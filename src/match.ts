import { FetchFunction, FetchGenerator } from "./fetch";

const filterSymbol = Symbol("filter");
const generatorSymbol = Symbol("generator");
export const Matcher = {
  filter: filterSymbol,
  generator: generatorSymbol
}

export interface Matcher{
  [filterSymbol]: (req: Request) => boolean | Promise<boolean>
}

export interface MatchFetch extends FetchFunction, Matcher {
}

export interface MatchGenerator extends FetchGenerator, Matcher{
  [generatorSymbol]: string,
  choices?: (FetchFunction|MatchGenerator)[]
}

export type AnyMatcher = MatchFetch | MatchGenerator | FetchFunction

export function match(...choices: (FetchFunction|MatchGenerator)[]): MatchGenerator{
  // turn any generator args into fetches
  const fetches = choices.map((c) => isMatchGenerator(c) ? c(fetch) : c)
  const fn = function (fetch: FetchFunction){
    async function match(req: RequestInfo, init?: RequestInit){
      if(typeof req === "string"){
        req = new Request(req, init)
        init = undefined
      }

      let fn = await findMatch(req, fetches);

      if(fn){
        return fn(req, init);
      }
      return fetch(req, init)
    }
    return match;
  }

  const r = Object.assign(
    fn,
    {
      choices: choices,
      [filterSymbol]: async (req: Request) => !!(await findMatch(req, fetches)),
      [generatorSymbol]: "match"
    }
  );
  return r;
}

export function mount(path: string, ...args: (FetchFunction|MatchGenerator)[]): MatchGenerator{
  const normalizedPath = path.endsWith("/") ? path : path + "/";

  function mountFilter(req: Request){
    const url = new URL(req.url);
    return (
      url.pathname === path ||
      url.pathname.startsWith(normalizedPath)
    )
  }
  return Object.assign(
    match(...args),
    {
      [filterSymbol]: mountFilter,
      [generatorSymbol]: "mount"
    }
  )
}

async function findMatch(req: Request, choices: FetchFunction[]){
  for(const c of choices){
    // * if matcher, check `matches`
    // * if function, treat it as default fetch
    let m = isMatcher(c) ? matchRequest(req, c) : typeof c === "function";
    if(m instanceof Promise){
      m = await m
    }
    if(m){
      return c
    }
 }
}

function matchRequest(req: Request, m: Matcher){
  return m[filterSymbol](req)
}
function isMatcher(obj: any): obj is Matcher{
  return !!obj[filterSymbol];
}
function isMatchGenerator(obj: any): obj is MatchGenerator{
  return typeof obj[Matcher.generator] === "string";
}