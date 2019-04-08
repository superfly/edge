import { normalizeRequest, FetchFunction } from '.'

/**
 * MountInfo can either be a string or a RegExp.
 */
export type MountInfo = [string | RegExp, FetchFunction]

/**
 * Allows you to mount routes to different proxied backends
 *
 * Example:
 *
 * ```javascript
 * import { mount, MountInfo, proxy, middleware, pipeline } from '@fly/cdn'
 *
 * const routes: MountInfo[] = [
 *  ['/blog', proxy('https://medium.com/blog')],
 *  ['/docs', proxy('https://docs.example.com/docs')],
 *  [/^\/(?:[a-z]{2}(-[A-Z]{2})?\/)?products/, proxy('https://app.example.com')] // ie, /de-DE/products
 * ]
 *
 * const p = pipeline(middleware.httpsUpgrader, middleware.autoWebp)
 * const routerApp = p(mount(routes))
 *
 * fly.http.respondWith(routerApp)
 * ```
 *
 * @param routes array of tuples, with routes as string|RegExp and proxied backend
 * @returns a combinedfunction that can be used anywhere that wants `fetch`
 */
function mount(paths: MountInfo[]) {
  function matchMount(req: RequestInfo, init?: RequestInit) {
    req = normalizeRequest(req)
    const url = new URL(req.url)
    for (const [p, f] of paths) {
      if (typeof p === 'string' && url.pathname.startsWith(p)) {
        return f
      } else if (p instanceof RegExp && url.pathname.match(p)) {
        return f
      }
    }
    return null
  }

  const fn = async function mountFetch(req: RequestInfo, init?: RequestInit) {
    const f = matchMount(req, init)
    if (f) {
      return f(req, init)
    }
    return new Response('no mount found', { status: 404 })
  }

  return Object.assign(fn, { match: matchMount })
}

export { mount }
