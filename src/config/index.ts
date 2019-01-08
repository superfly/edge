/** @module Config */
import { validateBackend, buildBackend } from "./backends";
import { isObject } from "../util";
import { FetchFunction } from "../fetch";
import { ProxyFunction } from "../proxy";
import { RuleInfo, validateRule, buildRules } from "./rules";
import { buildMiddleware, validateMiddleware } from "./middleware";
import { stringify } from "querystring";

export const CDNConfigKey = "flyCDN";

export interface CdnConfig {
  backends: { [key: string]: ItemConfig },
  middleware: ItemConfig[],
  rules: RuleInfo[]
}

export interface ItemConfig {
  type: string;
  [prop: string]: unknown;
}

export type BackendProxies = Map<string, ProxyFunction>;

export function isItemConfig(input: unknown): input is ItemConfig {
  if (!isObject(input)) {
    throw new Error("must be an object");
  }

  if (typeof input.type !== "string" || input.type.length == 0) {
    throw new Error("must have a type property specifying a backend");
  }

  return true
}

export function isCdnConfig(input: unknown): input is CdnConfig {
  if (!isObject(input)) {
    throw new Error("config must be an object")
  }

  const { backendConfigs = { }, ruleConfigs = [], middlewareConfigs = [] } = input;

  if (!isObject(backendConfigs)) {
    throw new Error("backends property must be a map of keys -> Backend definition");
  }

  for (const [key, cfg] of Object.entries(backendConfigs)) {
    try {
      if (isItemConfig(cfg)) {
        validateBackend(cfg);
      }
    } catch (error) {
      throw new Error(`backend config for ${key} is invalid: ${error.message || error}`)
    }
  }

  if (!(ruleConfigs instanceof Array)) {
    throw new Error("rules property must be an array of Rule definitions");
  }

  for (const [idx, cfg] of ruleConfigs.entries()) {
    try {
      validateRule(cfg)
    } catch (error) {
      throw new Error(`rule at index ${idx} is invalid: ${error.message || error}`)
    }
  }

  if (!(middlewareConfigs instanceof Array)) {
    throw new Error("middleware property must be an array of Middleware definitions");
  }

  for (const [idx, cfg] of middlewareConfigs.entries()) {
    try {
      if (isItemConfig) {
        validateMiddleware(cfg);
      }
    } catch (error) {
      throw new Error(`middleware at index ${idx} is invalid: ${error.message || error}`)
    }
  }

  return true;
}

export function buildCdn(config: CdnConfig) {
  const backends = new Map<string, ProxyFunction>();

  for (const [key, cfg] of Object.entries(config.backends)) {
    const b = buildBackend(cfg);
    backends.set(key, b);
  }
  console.log("Built backends:", Object.getOwnPropertyNames(config.backends));

  let fn = buildRules(backends, config.rules)
  
  const middleware = config.middleware;
  if (middleware && middleware.length > 0) {
    for (let i = middleware.length - 1; i >= 0; i--) {
      fn = buildMiddleware(fn, middleware[i]);
    }
  }

  return Object.assign(fn, {
    backends: backends
  })
}

export function buildCdnFromAppConfig(c?: any) {
  try {
    const config = c || app.config[CDNConfigKey];
    if (!config) {
      throw new Error("flyCDN config property not found");
    }
    if (!isCdnConfig(config)) {
      // This is unreachable because isCdnConfig throws but typescript can't infer that so we throw too
      throw new Error("App config not supported");
    }
    return buildCdn(config)
  } catch (error) {
    const fn = (...args: any[]) => {
      return Promise.resolve(new Response(`Invalid CDN Config: ${error.message || error}`));
    }
    return Object.assign(fn, { backends: new Map<string, ProxyFunction>()})
  }
}
