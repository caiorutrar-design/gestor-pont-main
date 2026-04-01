import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Rate limiting configuration
const RATE_LIMIT_SECONDS = 10;

// ─────────────────────────────────────────────────────────────────────────────
// Rate Limit: tenta Redis (Upstash) se configurado; fallback para Postgres
// ─────────────────────────────────────────────────────────────────────────────
async function checkAndSetRateLimit(
  supabaseAdmin: any,
  matricula: string
): Promise<{ limited: boolean; source: string }> {
  const upstashUrl = Deno.env.get("UPSTASH_REDIS_REST_URL");
  const upstashToken = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

  // Caminho A: Redis (Upstash) — alta performance, preferencial
  if (upstashUrl && upstashToken) {
    try {
      const { Redis } = await import("https://esm.sh/@upstash/redis@1.25.0");
      const redis = new Redis({ url: upstashUrl, token: upstashToken });
      const key = `rl_ponto:${matricula}`;
      const isLimited = await redis.get(key);
      if (isLimited) return { limited: true, source: "redis" };
      await redis.set(key, "1", { ex: RATE_LIMIT_SECONDS });
      return { limited: false, source: "redis" };
    } catch (redisErr) {
      // Redis configurado mas inacessível → loga e faz fallback para Postgres
      console.warn("[registrar-ponto-v2] Redis inacessível, usando fallback Postgres:", redisErr);
    }
  }

  // Caminho B: Postgres (tabela ponto_rate_limits) — fallback robusto
  try {
    const cutoff = new Date(Date.now() - RATE_LIMIT_SECONDS * 1000).toISOString();
    const { data: limitRow } = await supabaseAdmin
      .from("ponto_rate_limits")
      .select("last_request_at, user_id")
      .eq("user_id", `mat_${matricula}`) // chave baseada em matrícula
      .maybeSingle();

    if (limitRow && limitRow.last_request_at > cutoff) {
      return { limited: true, source: "postgres" };
    }

    // Upsert do timestamp de última requisição
    await supabaseAdmin
      .from("ponto_rate_limits")
      .upsert(
        { user_id: `mat_${matricula}`, last_request_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );

    return { limited: false, source: "postgres" };
  } catch (pgErr) {
    // Se até o fallback falhar, permitir (fail-open) com log de erro crítico
    console.error("[registrar-ponto-v2] CRÍTICO: Fallback Postgres de rate limit falhou:", pgErr);
    return { limited: false, source: "fail-open" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Haversine: distância entre dois pontos em metros
// ─────────────────────────────────────────────────────────────────────────────
function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler principal
// ─────────────────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: object, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { matricula, senha_ponto, latitude, longitude } = await req.json();

    if (!matricula || !senha_ponto) {
      return json({ error: "Matrícula e senha são obrigatórios." }, 400);
    }

    // 1. RATE LIMIT (Redis ou Postgres, automaticamente)
    const rl = await checkAndSetRateLimit(supabaseAdmin, matricula);
    if (rl.limited) {
      console.log(`[v2] Rate limit atingido para ${matricula} via ${rl.source}`);
      return json({ error: `Aguarde ${RATE_LIMIT_SECONDS} segundos entre registros.` }, 429);
    }

    // 2. FEATURE FLAG
    const { data: flagData } = await supabaseAdmin
      .from("feature_flags")
      .select("enabled")
      .eq("key", "new_geo_validation")
      .maybeSingle();
    const isNewGeoEnabled = flagData?.enabled ?? false;

    // 3. VALIDAÇÃO DE CREDENCIAIS
    const { data: colaborador, error: colabError } = await supabaseAdmin.rpc(
      "validate_senha_ponto",
      { _matricula: matricula, _senha_ponto: senha_ponto }
    );

    if (colabError || !colaborador || colaborador.length === 0) {
      return json({ error: "Matrícula ou senha inválidas." }, 401);
    }

    const { id: colaborador_id, nome_completo, orgao_id, lotacao_id } = colaborador[0];

    // 4. GEOLOCALIZAÇÃO
    let dentroRaio: boolean | null = null;

    const { data: colabFull } = await supabaseAdmin
      .from("colaboradores")
      .select("geolocation_obrigatoria, unidade_trabalho_id")
      .eq("id", colaborador_id)
      .maybeSingle();

    if (colabFull?.geolocation_obrigatoria && colabFull?.unidade_trabalho_id) {
      if (latitude == null || longitude == null) {
        return json({ error: "Geolocalização obrigatória para este colaborador." }, 400);
      }

      const { data: unidade } = await supabaseAdmin
        .from("unidades_trabalho")
        .select("latitude, longitude, raio_permitido")
        .eq("id", colabFull.unidade_trabalho_id)
        .maybeSingle();

      if (unidade?.latitude != null && unidade?.longitude != null) {
        const distancia = calcularDistancia(latitude, longitude, unidade.latitude, unidade.longitude);
        const raio = unidade.raio_permitido ?? 200;
        dentroRaio = distancia <= raio;

        if (!dentroRaio && isNewGeoEnabled) {
          return json({ error: "Você está fora da área permitida para registrar o ponto." }, 403);
        }
      }
    }

    // 5. AUTO-DETECTAR ENTRADA/SAÍDA
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();

    const { data: lastRecord } = await supabaseAdmin
      .from("registros_ponto")
      .select("tipo")
      .eq("colaborador_id", colaborador_id)
      .eq("data_registro", today)
      .order("timestamp_registro", { ascending: false })
      .limit(1)
      .maybeSingle();

    const tipo = lastRecord?.tipo === "entrada" ? "saida" : "entrada";

    // 6. INSERÇÃO
    const { data: registro, error: insertError } = await supabaseAdmin
      .from("registros_ponto")
      .insert({
        colaborador_id,
        orgao_id,
        data_registro: today,
        hora_registro: now.toTimeString().split(" ")[0],
        timestamp_registro: now.toISOString(),
        tipo,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        dentro_raio: dentroRaio,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return json({
      success: true,
      message: `Ponto registrado!`,
      registro: { ...registro, colaborador_nome: nome_completo },
      tipo,
      engine: "v2",
    });
  } catch (error: any) {
    console.error("[registrar-ponto-v2] Erro crítico:", error.message);
    return json({ error: "Erro interno no servidor." }, 500);
  }
});
