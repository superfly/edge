import { FetchFunction, normalizeRequest } from "./fetch";

export interface FetchFactory {
  (fetch: FetchFunction): FetchFunction;
}

export interface Pipe<T = any> extends FetchFactory {
  pipeName: string;
  children?: Pipe[];
  props?: T;
}

export function pipe(name: string, handler: FetchFactory): Pipe {
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

    return (req, init) => {
      req = normalizeRequest(req);

      if (!condition(req)) {
        throw abortPipeHandle;
      }
      
      return handler(req, init);
    }
  });
  p.children = [child];
  return p;
}

// export function when(condition: ): Pipe {

// }


type RewritePathOptions = { stripPrefix: string }

export function rewritePath(options: RewritePathOptions): Pipe {
  return pipe(`rewritePath`, (fetch) => {
    const prefix = options.stripPrefix;
    const length = prefix.length;

    return (req, init) => {
      req = normalizeRequest(req);
      const url = new URL(req.url);
      if (url.pathname.startsWith(prefix)) {
        url.pathname = url.pathname.substring(length);
        return fetch(url.href, req);
      }
      return fetch(req, init);
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