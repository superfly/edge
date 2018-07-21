export async function applyReplacements(resp: Response, replacements?: [string, string][]) {
  if (!replacements) return resp
  const contentType = resp.headers.get("content-type") || ""
  if (
    contentType.includes("/html") ||
    contentType.includes("application/javascript") ||
    contentType.includes("application/json") ||
    contentType.includes("text/")
  ) {
    const start = Date.now()
    let body = await resp.text()
    for (const r of replacements) {
      body = body.replace(r[0], r[1])
    }
    resp.headers.delete("content-length")
    resp = new Response(body, resp)
  }
  return resp
}