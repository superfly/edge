/**
 * @module Backends
 */

import { proxy, ProxyFunction } from "../proxy";
import { isObject, merge } from "../util";
import * as errors from "../errors";
import { Pipe } from "../pipeline";
 
/**
 * Heroku application configugration.
 */
export interface HerokuOptions {
  /** Blog's subdomain: <subdomain>.ghost.io */
  appName: string
}

/**
 * Creates a `fetch` like function for proxying requests to a Heroku app.
 * @param config Heroku app information. Accepts appName as a string.
 */
export function heroku(options: HerokuOptions | string): Pipe {
  const config = normalizeOptions(options);

  const herokuHost = `${config.appName}.herokuapp.com`;
  const uri = `https://${herokuHost}`;
  const headers = {
    "host": herokuHost
  };

  return proxy(uri, { headers });
}

heroku.normalizeOptions = normalizeOptions;

function normalizeOptions(input: unknown): HerokuOptions {
  const options: HerokuOptions = { appName: "" };

  if (typeof input === "string") {
    options.appName = input;
  } else if (isObject(input)) {
    merge(options, input, ["appName"]);
  } else {
    throw errors.invalidInput("options must be a HerokuOptions object or string");
  }

  if (!options.appName) {
    throw errors.invalidProperty("appName", "is required");
  }

  return options;
}
