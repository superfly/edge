import db, { Collection } from "@fly/v8env/lib/fly/data";
import cache from "@fly/v8env/lib/fly/cache";
import { FetchFunction } from "./fetch";

export interface RestOptions{
  authToken: string,
  basePath?: string,
  cache?: CacheOptions
}

export interface CacheOptions{
  ttl?: number,
  toCacheKey?: (collection: string, key: string) => string
}

const apiPathPattern = /^\/([a-zA-Z0-9-_]+)(\/(.+))?$/
/**
 * Creates a REST API for updating the Fly k/v data store.
 * 
 * ```typescript
 * import { data } from "@fly/edge"
 * const api = restAPI({authToken: "aSeCUrToken", basePath: "/__data/"});
 * fly.http.respondWith(req => {
 *   const url = new URL(req.url);
 *   if(url.pathname.startsWith("/__data/")){
 *     return api(req);
 *   }
 *   return new Response('not found', { status: 404});
 * })
 * ```
 * 
 * @param tokenOrOptions 
 */
export function restAPI(tokenOrOptions: string | RestOptions): FetchFunction{
  const options = typeof tokenOrOptions === "string" ? {authToken: tokenOrOptions} : tokenOrOptions;
  const { authToken, basePath } = options;
  return async function fetchRest(req, init){
    if(typeof req === "string"){
      req = new Request(req, init);
      init = undefined;
    }
    const auth = (req.headers.get("Authorization") || "").split("Bearer ", 2);
    if(auth.length < 2 || auth[1] !== authToken){
      return new Response("Access denied", { status: 403});
    }

    const url = new URL(req.url);
    let path = url.pathname;
    if(basePath && path.startsWith(basePath) && path.length > basePath.length){
      path = path.substr(basePath.length);
    }
    if(!path.startsWith("/")){
      path = `/${path}`;
    }

    const match = path.match(apiPathPattern);

    if(!match){
      return jsonResponse({error: "not found"}, { status: 404})
    }

    const colName: string = match[1];
    let key: string | undefined = match[3];
    if(!key){
      return jsonResponse({error: "not found"}, { status: 404 })
    }

    const collection = cachedCollection(colName, options.cache);

    let data: any;
    switch(req.method){
      case "GET":
        data = await collection.get(key);
        if(data === null){
          return jsonResponse({error: "not found"}, { status: 404 })
        }
        return jsonResponse(data, { status: 200})
      case "PUT":
        data = await req.json();
        await collection.put(key, data);
        return jsonResponse(data, { status: 201})
      case "DELETE":
        await collection.del(key);
        return jsonResponse(data, { status: 204})
    }

    return jsonResponse({error: "not found"}, { status: 404})
  }
}

/**
 * Get a collection with a write through cache. Data retrieved from the collection will
 * be cached in the current region. Put/Delete will expire a key globally.
 * @param name 
 * @param opts 
 */
export function cachedCollection(name: string, opts?: CacheOptions): Collection{
  return new CachedCollection(name);
}

export class CachedCollection extends Collection{
  constructor(name: string, public readonly options?: CacheOptions){
    super(name);
    this.options = options;
  }
  public async get(key: string){
    const cacheKey = this.toCacheKey(key);
    const value = await cache.getString(key);

    if(value){
      try{
        return JSON.parse(value);
      }catch(err){
        console.error("CacheCollection: JSON parse failed. ", err.message)
        // fall through on parse fail.
      }
    }

    const result = await super.get(key);
    await cache.set(cacheKey, typeof result !== "string" ? JSON.stringify(result) : result);
    return super.get(key);
  }

  public async del(key: string){
    const result = await super.del(key)
    await expire(this.name, key, this.options);
    return result;
  }

  public async put(key: string, obj: any){
    const result = await super.put(key, obj);
    await expire(this.name, key, this.options);
    return result;
  }

  public toCacheKey(key: string){
    if(this.options && this.options.toCacheKey){
      return this.options.toCacheKey(this.name, key);
    }
    return toCacheKey(this.name, key);
  }
}

function jsonResponse(data: any, init?: ResponseInit){
  if(!init) init = {};
  init.headers = new Headers(init.headers);
  init.headers.set("content-type", "application/json");
  if(typeof data !== "string"){
    data = JSON.stringify(data);
  }
  return new Response(data, init)
}

function toCacheKey(colName: string, key: string){
  return `db.${colName}(${key})`;
}

async function expire(collection: string, key: string, opts?: CacheOptions){
  let cacheKey: string;
  if(opts && opts.toCacheKey){
    cacheKey = opts.toCacheKey(collection, key);
  }else{
    cacheKey = toCacheKey(collection, key);
  }

  return cache.global.del(cacheKey);
}