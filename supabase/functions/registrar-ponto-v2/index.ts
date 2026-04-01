import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Redis } from "https://esm.sh/@upstash/redis@1.25.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Rate limiting configuration
const RATE_LIMIT_SECONDS = 10;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Initializing Upstash Redis (requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Env Vars)
    const upstashUrl = Deno.env.get("UPSTASH_REDIS_REST_URL");
    const upstashToken = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");
    
    let redis: Redis | null = null;
    if (upstashUrl && upstashToken) {
      redis = new Redis({
        url: upstashUrl,
        token: upstashToken,
      });
    } else {
      console.warn("Variáveis do Upstash Redis ausentes. Rate limiting via Redis será ignorado.");
    }

    const { matricula, senha_ponto, latitude, longitude } = await req.json();

    if (!matricula || !senha_ponto) {
      return new Response(
        JSON.stringify({ error: "Matrícula e senha são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. GLOBAL RATE LIMIT (Upstash Redis)
    const rateLimitKey = `rl_ponto:${matricula}`;
    
    if (redis) {
      const isLimited = await redis.get(rateLimitKey);
      
      if (isLimited) {
        return new Response(
          JSON.stringify({ error: `Aguarde ${RATE_LIMIT_SECONDS} segundos entre registros.` }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Set lock for X seconds
      await redis.set(rateLimitKey, "true", { ex: RATE_LIMIT_SECONDS });
    }

    // 2. FEATURE FLAG CHECK
    const { data: flagData } = await supabaseAdmin
      .from("feature_flags")
      .select("enabled")
      .eq("key", "new_geo_validation")
      .single();
    
    const isNewGeoEnabled = flagData?.enabled || false;

    // 3. VALIDATE CREDENTIALS
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

    const { id: colaborador_id, nome_completo } = colaborador[0];

    // 4. GEOLOCATION VALIDATION
    const { data: colabFull } = await supabaseAdmin
      .from("colaboradores")
      .select("geolocation_obrigatoria, unidade_trabalho_id")
      .eq("id", colaborador_id)
      .single();

    let dentroRaio: boolean | null = null;

    if (colabFull?.geolocation_obrigatoria && colabFull?.unidade_trabalho_id) {
      if (latitude == null || longitude == null) {
        return new Response(
          JSON.stringify({ error: "Geolocalização obrigatória." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: unidade } = await supabaseAdmin
        .from("unidades_trabalho")
        .select("latitude, longitude, raio_metros")
        .eq("id", colabFull.unidade_trabalho_id)
        .single();

      if (unidade) {
        // Haversine implementation removed for brevity in this snippet, 
        // assumed to be the same as v1 or using PostGIS in future v3
        const distance = calculateDistanceSnippet(latitude, longitude, unidade.latitude, unidade.longitude);
        dentroRaio = distance <= unidade.raio_metros;

        if (!dentroRaio && isNewGeoEnabled) {
          // Strict block only if new_geo_validation is ON
          return new Response(
            JSON.stringify({ error: "Você está fora da área permitida." }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // 5. REGISTRATION LOGIC (Inherited from v1)
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    
    // Auto-detect direction (In/Out)
    const { data: lastRecord } = await supabaseAdmin
      .from("registros_ponto")
      .select("tipo")
      .eq("colaborador_id", colaborador_id)
      .eq("data_registro", today)
      .order("timestamp_registro", { ascending: false })
      .limit(1)
      .maybeSingle();

    const tipo = lastRecord?.tipo === "entrada" ? "saida" : "entrada";

    const { data: registro, error: insertError } = await supabaseAdmin
      .from("registros_ponto")
      .insert({
        colaborador_id,
        data_registro: today,
        hora_registro: now.toTimeString().split(" ")[0],
        timestamp_registro: now.toISOString(),
        tipo,
        latitude,
        longitude,
        dentro_raio: dentroRaio,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, message: "Ponto registrado!", registro }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Erro interno", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper simple distance function
function calculateDistanceSnippet(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
