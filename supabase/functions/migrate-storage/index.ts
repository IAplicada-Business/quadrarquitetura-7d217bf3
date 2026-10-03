import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Função de uso único: copia todos os arquivos de um bucket do banco ANTIGO
// (onde ela roda, lendo via SUPABASE_SERVICE_ROLE_KEY auto-injetado) para o
// banco NOVO (via MIGRATION_TARGET_URL + MIGRATION_TARGET_SERVICE_KEY).
// Apague esta function depois de migrar — ela guarda uma service role key
// de outro projeto como secret.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-migration-secret",
};

const REAL_BUCKETS = [
  "project-files",
  "proposal-assets",
  "invoices",
  "oportunidade-anexos",
  "onboarding-media",
  "site-media",
];

async function listAllObjects(
  storage: ReturnType<typeof createClient>["storage"],
  bucket: string,
  prefix = "",
): Promise<string[]> {
  const { data, error } = await storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) throw error;
  let paths: string[] = [];
  for (const item of data ?? []) {
    const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id === null) {
      // sem id = é uma "pasta" (prefixo) — desce recursivamente
      paths = paths.concat(await listAllObjects(storage, bucket, itemPath));
    } else {
      paths.push(itemPath);
    }
  }
  return paths;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const MIGRATION_SECRET = Deno.env.get("MIGRATION_SECRET");
    if (!MIGRATION_SECRET || req.headers.get("x-migration-secret") !== MIGRATION_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const onlyBucket = url.searchParams.get("bucket");
    const maxBytesParam = url.searchParams.get("max_mb");
    const maxBytes = maxBytesParam ? Number(maxBytesParam) * 1024 * 1024 : 500 * 1024 * 1024; // default: pula arquivos > 500MB

    const sourceUrl = Deno.env.get("SUPABASE_URL")!;
    const sourceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!; // auto-injetado = este projeto (antigo)
    const targetUrl = Deno.env.get("MIGRATION_TARGET_URL");
    const targetKey = Deno.env.get("MIGRATION_TARGET_SERVICE_KEY");
    if (!targetUrl || !targetKey) {
      throw new Error("MIGRATION_TARGET_URL e MIGRATION_TARGET_SERVICE_KEY precisam estar configurados como secrets");
    }

    const source = createClient(sourceUrl, sourceKey);
    const target = createClient(targetUrl, targetKey);

    const buckets = onlyBucket ? [onlyBucket] : REAL_BUCKETS;
    const results: Array<{ bucket: string; path: string; status: string; bytes?: number; error?: string }> = [];

    for (const bucket of buckets) {
      let paths: string[];
      try {
        paths = await listAllObjects(source.storage, bucket);
      } catch (e) {
        results.push({ bucket, path: "(list)", status: "error", error: e instanceof Error ? e.message : String(e) });
        continue;
      }

      for (const path of paths) {
        try {
          const { data: blob, error: downloadError } = await source.storage.from(bucket).download(path);
          if (downloadError || !blob) throw downloadError ?? new Error("download vazio");

          if (blob.size > maxBytes) {
            results.push({ bucket, path, status: "skipped_too_large", bytes: blob.size });
            continue;
          }

          const { error: uploadError } = await target.storage.from(bucket).upload(path, blob, {
            contentType: blob.type || "application/octet-stream",
            upsert: true,
          });
          if (uploadError) throw uploadError;

          results.push({ bucket, path, status: "ok", bytes: blob.size });
        } catch (e) {
          results.push({ bucket, path, status: "error", error: e instanceof Error ? e.message : String(e) });
        }
      }
    }

    const summary = {
      total: results.length,
      ok: results.filter((r) => r.status === "ok").length,
      skipped_too_large: results.filter((r) => r.status === "skipped_too_large").length,
      errors: results.filter((r) => r.status === "error").length,
    };

    return new Response(JSON.stringify({ summary, results }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
