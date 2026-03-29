import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory rate limiting (per isolate instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > MAX_ATTEMPTS;
}

// Haversine formula — returns distance in meters
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { matricula, senha_ponto, latitude, longitude } = await req.json();

    if (!matricula || !senha_ponto) {
      return new Response(
        JSON.stringify({ error: "Matrícula e senha são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limit by IP + matricula
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    const rateLimitKey = `${ip}:${matricula}`;

    if (isRateLimited(rateLimitKey)) {
      return new Response(
        JSON.stringify({ error: "Muitas tentativas. Aguarde um minuto e tente novamente." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate credentials
    const { data: colaborador, error: colabError } = await supabaseAdmin
      .rpc("validate_senha_ponto", {
        _matricula: matricula,
        _senha_ponto: senha_ponto,
      });

    if (colabError || !colaborador || colaborador.length === 0) {
      await supabaseAdmin.from("audit_logs").insert({
        action_type: "login_failed",
        entity_type: "registro_ponto",
        details: { matricula, ip, reason: "invalid_credentials" },
      });

      return new Response(
        JSON.stringify({ error: "Matrícula ou senha inválidas." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const colab = colaborador[0];

    // Fetch full colaborador data for geolocation check
    const { data: colabFull } = await supabaseAdmin
      .from("colaboradores")
      .select("geolocation_obrigatoria, unidade_trabalho_id")
      .eq("id", colab.id)
      .single();

    let dentroRaio: boolean | null = null;

    if (colabFull?.geolocation_obrigatoria && colabFull?.unidade_trabalho_id) {
      // Must validate geolocation
      if (latitude == null || longitude == null) {
        return new Response(
          JSON.stringify({ error: "Geolocalização obrigatória. Ative a localização no navegador e tente novamente." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: unidade } = await supabaseAdmin
        .from("unidades_trabalho")
        .select("latitude, longitude, raio_metros, nome")
        .eq("id", colabFull.unidade_trabalho_id)
        .eq("ativo", true)
        .single();

      if (!unidade) {
        return new Response(
          JSON.stringify({ error: "Unidade de trabalho não encontrada ou inativa." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const distance = haversineDistance(latitude, longitude, unidade.latitude, unidade.longitude);
      dentroRaio = distance <= unidade.raio_metros;

      if (!dentroRaio) {
        // Log the failed attempt with coordinates
        await supabaseAdmin.from("audit_logs").insert({
          action_type: "ponto_fora_raio",
          entity_type: "registro_ponto",
          details: {
            matricula,
            ip,
            latitude,
            longitude,
            unidade_nome: unidade.nome,
            distancia_metros: Math.round(distance),
            raio_permitido: unidade.raio_metros,
          },
        });

        return new Response(
          JSON.stringify({
            error: `Você está fora da área permitida (${Math.round(distance)}m da unidade "${unidade.nome}", limite: ${unidade.raio_metros}m). Aproxime-se do local de trabalho.`,
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (latitude != null && longitude != null) {
      // Geo not required but coordinates were sent — save for auditing
      dentroRaio = null;
    }

    // Check today's records count
    const today = new Date().toISOString().split("T")[0];
    const { data: todayRecords, error: recordsError } = await supabaseAdmin
      .from("registros_ponto")
      .select("id, tipo, timestamp_registro")
      .eq("colaborador_id", colab.id)
      .eq("data_registro", today)
      .order("timestamp_registro", { ascending: true });

    if (recordsError) throw recordsError;

    if (todayRecords && todayRecords.length >= 20) {
      return new Response(
        JSON.stringify({ error: "Limite de registros por dia atingido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lastRecord = todayRecords && todayRecords.length > 0
      ? todayRecords[todayRecords.length - 1]
      : null;
    const tipo = !lastRecord || lastRecord.tipo === "saida" ? "entrada" : "saida";

    const now = new Date();

    const { data: registro, error: insertError } = await supabaseAdmin
      .from("registros_ponto")
      .insert({
        colaborador_id: colab.id,
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

    return new Response(
      JSON.stringify({
        success: true,
        message: `Ponto registrado com sucesso às ${now.toLocaleTimeString("pt-BR")} em ${now.toLocaleDateString("pt-BR")}`,
        registro: {
          ...registro,
          colaborador_nome: colab.nome_completo,
        },
        tipo,
        registros_hoje: (todayRecords?.length || 0) + 1,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[registrar-ponto] Error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno ao registrar ponto." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
