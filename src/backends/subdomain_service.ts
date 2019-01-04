import { isObject, merge } from "../util";
import * as errors from "../errors";
export interface SubdomainOptions {
  [k: string]: string | undefined
  /** Blog's subdomain: <subdomain>.netlify.com */
  subdomain: string,
  /** Subdirectory site is served from (if any) */
  directory?: string,
  /** Netlify sites can be configured with a custom hostname, we need that to proxy properly */
  hostname?: string
}

export function optionNormalizer(map?: {[k:string]: string | false | undefined}){
  return function normalizeOptions(input: unknown): SubdomainOptions {
    if(!map) map = {}
    const options: SubdomainOptions = {
      subdomain: "",
      directory: "/"
    };

    if (typeof input === "string") {
      options.subdomain = input.trim();
    } else if (isObject(input)) {
      for(const k of ["subdomain", "directory", "hostname"]){
        let alias = map[k]
        if(!alias && alias !== false){
          alias = k
        }
        if(alias !== false && input[alias]){
          const value = input[alias]
          options[k] = typeof value === "string" ? value.trim() : value;
        }
      }
    } else {
      throw errors.invalidInput("options must be a SubdomainOptions object or string");
    }

    if (!options.subdomain) {
      throw errors.invalidProperty(map["subdomain"] || "subdomain", "is required");
    }
    
    return options;
  }
}

optionNormalizer.default = optionNormalizer();

export const normalizeOptions = optionNormalizer.default;