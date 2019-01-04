import { isObject, merge } from "../util";
import * as errors from "../errors";
export interface SubdomainOptions {
  /** Blog's subdomain: <subdomain>.netlify.com */
  subdomain: string,
  /** Subdirectory site is served from (if any) */
  directory?: string,
  /** Netlify sites can be configured with a custom hostname, we need that to proxy properly */
  hostname?: string
}

export function normalizeOptions(input: unknown): SubdomainOptions {
  const options: SubdomainOptions = {
    subdomain: "",
    directory: "/"
  };

  if (typeof input === "string") {
    options.subdomain = input;
  } else if (isObject(input)) {
    merge(options, input, ["subdomain", "directory", "hostname"]);
  } else {
    throw errors.invalidInput("options must be a NetlifyProOptions object or string");
  }

  if (!options.subdomain) {
    throw errors.invalidProperty("subdomain", "is required");
  }
  
  return options;
}