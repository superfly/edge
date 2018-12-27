import { FlyFetch } from "./fetch";

export interface FlyFetchFactory {
  (fetch: FlyFetch): FlyFetch;
}

export interface Pipe<T = any> extends FlyFetchFactory {
  pipeName: string;
  children?: Pipe[];
  props?: T;
}

export function pipe(name: string, handler: FlyFetchFactory): Pipe {
  return Object.assign(handler, {
    pipeName: name
  });
}

export function pipeline(...pipes: Pipe[]): Pipe {
  const pipeline = pipe("pipeline", (fetch) => {
    return pipes.reduceRight((parentFetch, pipelineFn) => {
      return pipelineFn(parentFetch);
    }, fetch);
  });
  pipeline.children = pipes;
  return pipeline;
}

type RequestAction = (req: Request) => Request | void;

export function onRequest(action: RequestAction): Pipe {
  return pipe("requestModifier", (fetch) => {
    return (req) => {
      const maybeReq = action(req);
      if (maybeReq) {
        req = maybeReq;
      }
      return fetch(req);
    }
  })
}

type ResponseAction = (req: Request, resp: Response) => Response | Promise<Response | void> | void;

export function onResponse(action: ResponseAction): Pipe {
  return pipe("responseModifier", (fetch) => {
    return async (req) => {
      const resp = await fetch(req);
      const maybeReq = await action(req, resp);
      if (maybeReq) {
        return maybeReq;
      }
      return resp;
    }
  })
}

export function match(...pipes: Pipe[]): Pipe {
  return pipe("match", (fetch) => {
    const handlers = pipes.map(s => s(fetch));

    return async (req) => {
      for (const [idx, handler] of handlers.entries()) {
        try {
          return await handler(req);
        } catch (e) {
          if (e !== abortPipeHandle) {
            throw e;
          }
        }
      }
      throw abortPipeHandle;
    }
  });
}

type GateExpression = (req: Request) => boolean;

export function gate(condition: GateExpression, child: Pipe): Pipe {
  const p = pipe("gate", (fetch) => {
    const handler = child(fetch);

    return (req) => {
      if (!condition(req)) {
        throw abortPipeHandle;
      }
      
      return handler(req);
    }
  });
  p.children = [child];
  return p;
}

type RewritePathOptions = { stripPrefix: string }

export function rewritePath(options: RewritePathOptions): Pipe {
  return pipe(`rewritePath`, (fetch) => {
    const prefix = options.stripPrefix;
    const length = prefix.length;

    return (req) => {
      const url = new URL(req.url);
      if (url.pathname.startsWith(prefix)) {
        url.pathname = url.pathname.substring(length);
        req = new Request(url.href, req);
        return fetch(req);
      }
      return fetch(req);
    }
  })
}

export function mount(pathPrefix: string, child: Pipe): Pipe {
  return gate(
    matchPathPrefix(pathPrefix),
    pipeline(
      rewritePath({ stripPrefix: pathPrefix }),
      child,
    )
  )
}

function matchPathPrefix(prefix: string): GateExpression {
  return (req) => {
    const url = new URL(req.url);
    return url.pathname.startsWith(prefix);
  }
}

const abortPipeHandle = Symbol();

export function abortPipe(): never {
  throw abortPipeHandle 
}

export const connect = pipeline;