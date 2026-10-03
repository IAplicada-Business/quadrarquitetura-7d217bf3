import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Função de uso único: copia todos os arquivos de um bucket do banco ANTIGO
// (onde ela roda, lendo via SUPABASE_SERVICE_ROLE_KEY auto-injetado) para o
// banco NOVO (via MIGRATION_TARGET_URL + MIGRATION_TARGET_SERVICE_KEY).
// Faz streaming direto (download -> upload) sem bufferizar o arquivo
// inteiro na memória, para aguentar arquivos grandes (centenas de MB).
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

// Copia um objeto sem bufferizar o arquivo inteiro na memória: assina uma
// URL de leitura no projeto antigo, abre o stream de download, e repassa
// esse stream direto no corpo da requisição de upload do projeto novo.
// deno-lint-ignore no-explicit-any
async function streamCopy(
  source: any,
  targetUrl: string,
  targetKey: string,
  bucket: string,
  path: string,
): Promise<number> {
  const { data: signed, error: signError } = await source.storage.from(bucket).createSignedUrl(path, 300);
  if (signError || !signed?.signedUrl) throw signError ?? new Error("falha ao assinar URL de origem");

  const downloadResp = await fetch(signed.signedUrl);
  if (!downloadResp.ok || !downloadResp.body) {
    throw new Error(`download falhou: HTTP ${downloadResp.status}`);
  }

  const contentType = downloadResp.headers.get("content-type") || "application/octet-stream";
  const contentLength = downloadResp.headers.get("content-length");

  const uploadUrl = `${targetUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${path.split("/").map(encodeURIComponent).join("/")}`;
  const uploadResp = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${targetKey}`,
      apikey: targetKey,
      "Content-Type": contentType,
      "x-upsert": "true",
      ...(contentLength ? { "Content-Length": contentLength } : {}),
    },
    body: downloadResp.body,
    // Streaming request bodies exigem duplex "half" no fetch do Deno/undici.
    duplex: "half",
    // deno-lint-ignore no-explicit-any
  } as any);
  if (!uploadResp.ok) {
    const text = await uploadResp.text().catch(() => "");
    throw new Error(`upload falhou: HTTP ${uploadResp.status} ${text.slice(0, 300)}`);
  }
  return contentLength ? Number(contentLength) : -1;
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
    const onlyPath = url.searchParams.get("path"); // migra só esse arquivo específico

    const sourceUrl = Deno.env.get("SUPABASE_URL")!;
    const sourceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!; // auto-injetado = este projeto (antigo)
    const targetUrl = Deno.env.get("MIGRATION_TARGET_URL");
    const targetKey = Deno.env.get("MIGRATION_TARGET_SERVICE_KEY");
    if (!targetUrl || !targetKey) {
      throw new Error("MIGRATION_TARGET_URL e MIGRATION_TARGET_SERVICE_KEY precisam estar configurados como secrets");
    }

    const source = createClient(sourceUrl, sourceKey);
    const results: Array<{ bucket: string; path: string; status: string; bytes?: number; error?: string }> = [];

    if (onlyBucket && onlyPath) {
      // Modo arquivo único — para isolar um arquivo problemático.
      try {
        const bytes = await streamCopy(source, targetUrl, targetKey, onlyBucket, onlyPath);
        results.push({ bucket: onlyBucket, path: onlyPath, status: "ok", bytes });
      } catch (e) {
        results.push({ bucket: onlyBucket, path: onlyPath, status: "error", error: e instanceof Error ? e.message : String(e) });
      }
    } else {
      const buckets = onlyBucket ? [onlyBucket] : REAL_BUCKETS;
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
            const bytes = await streamCopy(source, targetUrl, targetKey, bucket, path);
            results.push({ bucket, path, status: "ok", bytes });
          } catch (e) {
            results.push({ bucket, path, status: "error", error: e instanceof Error ? e.message : String(e) });
          }
        }
      }
    }

    const summary = {
      total: results.length,
      ok: results.filter((r) => r.status === "ok").length,
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
