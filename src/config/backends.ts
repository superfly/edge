/** @module Config */
import * as backends from "../backends";
import { ProxyFunction, ProxyFactory } from "../proxy";
import { ItemConfig } from "./index";

export type BackendMap = Map<string, ProxyFactory>;

// type FactoryDefinition =  [ProxyFactory, (options: any) => boolean];

const factories = new Map<string, ProxyFactory>([
  ["origin", backends.origin],
  ["github_pages", backends.githubPages],
  ["heroku", backends.heroku],
  ["ghost_pro", backends.ghostProBlog],
  ["glitch", backends.glitch],
]);

function getFactory(type: string): ProxyFactory {
  const def = factories.get(type);
  if (!def) {
    throw new Error(`Unknown backend type '${type}'`);
  }
  return def;
}

export function buildBackend(config: ItemConfig): ProxyFunction<any> {
  try{
    const factory = getFactory(config.type);
    return factory(config);
  }catch(err){
    console.error("Exception building backend:", err, config)
    const backendError = async (..._: any[]) => new Response(err.toString(), { status: 500 } )
    return Object.assign(backendError, { proxyConfig: config} )
  }
}

export function validateBackend(config: ItemConfig) {
  const factory = getFactory(config.type);
  if (factory.normalizeOptions) {
    factory.normalizeOptions(config);
  }
}
