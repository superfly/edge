/**
 * @module Site
 * @ignore
 */
export async function applyReplacements(resp: Response, replacements?: [string, string][]) {
  if (!replacements || !isTextContentType(resp)) {
    return resp;
  }

  let body = await resp.text();
  for (const r of replacements) {
    body = body.replace(r[0], r[1]);
  }
  resp.headers.delete("content-length");// .set("content-length", body.length.toString());
  return new Response(body, resp);
}

const ContentTypePatterns = [
  "/html",
  "application/javascript",
  "application/json",
  "text/",
  // css????
];

function isTextContentType(resp: Response): boolean {
  const contentType = resp.headers.get("content-type") || "";

  for (const pattern of ContentTypePatterns) {
    if (contentType.includes(pattern)) {
      return true;
    }
  }

  return false;
}