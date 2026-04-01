import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SupabasePontoRepository } from "../_shared/ponto/infrastructure/repositories/SupabasePontoRepository.ts";
import { PontoApplicationService } from "../_shared/ponto/application/services/PontoApplicationService.ts";
import { AuditService } from "../_shared/audit/AuditService.ts";
import { TipoRegistro } from "../_shared/ponto/types.ts";
import { registrarPontoSchema } from "../_shared/ponto/validators/pontoSchemas.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Controller: registrar-ponto (Edge Function)
 * Atua como porta de entrada (Controller), tratando autenticação e feature flags.
 * Delega a orquestração para o Application Service.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const now = new Date();
  
  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();

    // 0. Validação de Schema (Domain Driven Validation)
    const validation = registrarPontoSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error.issues[0].message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { matricula, senha_ponto, latitude, longitude } = validation.data;

    // 1. Autenticação (Controller Layer - Entry Port)
    const { data: colaborador, error: colabError } = await supabaseAdmin
      .rpc("validate_senha_ponto", {
        _matricula: matricula,
        _senha_ponto: senha_ponto,
      });

    if (colabError || !colaborador || colaborador.length === 0) {
      return new Response(
        JSON.stringify({ error: "Matrícula ou senha inválidas." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const colab = colaborador[0];

    // 2. Resolver Feature Flag (Rollout Control)
    const useNewLogic = await isFeatureEnabled(supabaseAdmin, "use_new_ponto_logic", colab.orgao_id);

    let result: any;
    let engineUsed: string;

    if (useNewLogic) {
      // --- CAMINHO LIMPO (Application Layer) ---
      const repository = new SupabasePontoRepository(supabaseAdmin);
      const service = new PontoApplicationService(repository);
      const audit = new AuditService(supabaseAdmin);
      const clientIp = req.headers.get("x-real-ip") || undefined;

      try {
        result = await service.registrarBatida({
          colaborador_id: colab.id,
          user_id: colab.user_id,
          orgao_id: colab.orgao_id,
          unidade_id: colab.lotacao_id,
          timestamp: now,
          latitude,
          longitude,
          clientIp,
        });
        engineUsed = "v3_clean_arch";

        // Audit de sucesso (com IP — o trigger do banco não captura o IP)
        await audit.logPontoRegistrado({
          user_id: colab.user_id ?? colab.id,
          orgao_id: colab.orgao_id,
          colaborador_id: colab.id,
          tipo: result.tipo,
          timestamp: now.toISOString(),
          ip: clientIp,
        });

      } catch (domainError: any) {
        // Audit de bloqueio de segurança (geo, ip, rate limit)
        const msg: string = domainError.message ?? "";
        const blockAction = msg.includes("Localização") ? "SECURITY_BLOCK_GEO"
          : msg.includes("IP")     ? "SECURITY_BLOCK_IP"
          : msg.includes("Aguarde") ? "SECURITY_BLOCK_RATE_LIMIT"
          : null;

        if (blockAction) {
          await audit.logSecurityBlock({
            action: blockAction as any,
            orgao_id: colab.orgao_id,
            matricula: colab.matricula,
            reason: msg,
            ip: clientIp,
          });
        }

        return new Response(
          JSON.stringify({ error: domainError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // --- CAMINHO LEGADO (Fallback Seguro) ---
      result = await registrarLegado(supabaseAdmin, colab, now, { latitude, longitude });
      engineUsed = "v1_legacy";
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Ponto registrado com sucesso às ${now.toLocaleTimeString("pt-BR")}`,
        registro: { 
          ...result, 
          colaborador_nome: colab.nome_completo 
        },
        tipo: result.tipo,
        engine: engineUsed
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error(`[registrar-ponto] Erro Crítico: ${error.message}`);
    return new Response(
      JSON.stringify({ error: "Erro interno no servidor de ponto." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Logica Legada Mantida para Fallback (Etapa de Transição)
 */
async function registrarLegado(supabase: any, colab: any, now: Date, pos: any) {
  const today = now.toISOString().split("T")[0];
  const { data: lastTodayRecord } = await supabase
    .from("registros_ponto")
    .select("tipo")
    .eq("colaborador_id", colab.id)
    .eq("data_registro", today)
    .order("timestamp_registro", { ascending: false })
    .limit(1)
    .maybeSingle();

  const tipo = (!lastTodayRecord || lastTodayRecord.tipo === "saida") 
    ? TipoRegistro.ENTRADA 
    : TipoRegistro.SAIDA;

  const { data, error } = await supabase
    .from("registros_ponto")
    .insert({
      colaborador_id: colab.id,
      data_registro: today,
      timestamp_registro: now.toISOString(),
      tipo,
      latitude: pos.latitude ?? null,
      longitude: pos.longitude ?? null
    })
    .select().single();

  if (error) throw error;
  return data;
}

/**
 * Helper para Feature Flags (Infra Concern)
 */
async function isFeatureEnabled(supabase: any, key: string, orgaoId: string): Promise<boolean> {
  const { data: flags } = await supabase
    .from("feature_flags")
    .select("enabled, orgao_id")
    .eq("key", key)
    .or(`orgao_id.is.null,orgao_id.eq.${orgaoId}`);

  if (!flags || flags.length === 0) return false;
  const orgFlag = flags.find((f: any) => f.orgao_id === orgaoId);
  if (orgFlag !== undefined) return orgFlag.enabled;
  const globalFlag = flags.find((f: any) => f.orgao_id === null);
  return globalFlag ? globalFlag.enabled : false;
}
