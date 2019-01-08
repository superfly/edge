/** @module Config */
import { FetchFactory, FetchFunction } from "../fetch";
import * as middleware from "../middleware";
import { ItemConfig } from "./index";

type FactoryDefinition = [FetchFactory, ((options: any) => boolean)?];

const factories = new Map<string, FactoryDefinition>([
  ["https-upgrader", [middleware.httpsUpgrader]],
  ["response-headers", [middleware.responseHeaders]],
  ["inject-html", [middleware.injectHTML]],
  ["http-cache", [middleware.httpCache]]
]);

function getFactory(type: string): FactoryDefinition {
  const def = factories.get(type);
  if (!def) {
    throw new Error(`Unknown middleware type '${type}'`);
  }
  return def;
}

export function buildMiddleware(fetch: FetchFunction, config: ItemConfig): FetchFunction {
  const [factory, validator] = getFactory(config.type);
  return factory(fetch, config);
}

export function validateMiddleware(config: ItemConfig) {
  const [factory, validator] = getFactory(config.type);
  if (validator) {
    validator(config);
  }
}
