import * as backends from "../backends";
import { ProxyFunction, ProxyFactory } from "../proxy";
import { ItemConfig } from "./index";

export type BackendMap = Map<string, ProxyFactory>;

type FactoryDefinition = [ProxyFactory, (options: any) => boolean];

const factories = new Map<string, FactoryDefinition>([
  ["origin", [backends.origin, backends.isOriginOptions]],
  ["github_pages", [backends.githubPages, backends.isGithubPagesOptions]],
  ["heroku", [backends.heroku, backends.isHerokuOptions]],
  ["ghost_pro", [backends.ghostProBlog, backends.isGhostProOptions]],
]);

function getFactory(type: string): FactoryDefinition {
  const def = factories.get(type);
  if (!def) {
    throw new Error(`Unknown backend type '${type}'`);
  }
  return def;
}

export function buildBackend(config: ItemConfig): ProxyFunction<any> {
  const [factory, validator] = getFactory(config.type);
  return factory(config);
}

export function validateBackend(config: ItemConfig) {
  const [factory, validator] = getFactory(config.type);
  if (validator) {
    validator(config);
  }
}
