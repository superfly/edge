import { pipe, Pipe, pipeline } from "./pipeline";
import { FlyFetch } from "./fetch";

export interface SegmentOptions {
  name: string;
  segments: Segment[];
}

export interface Segment {
  id: string,
  origin: Pipe
}

export function routeSegments(options: SegmentOptions): Pipe {
  const p = pipe(`routeSegments(${options.name})`,
    pipeline(
      assignSegment(options.segments),
      chooseSegment(options.segments)
    )
  );
  p.children = options.segments.map(s => s.origin);
  return p;
}

function chooseSegment(segments: Segment[]): Pipe {
  return pipe(`chooseSegment`, (fetch) => {
    // convert pipes to FetchFunctions using the provided `fetch` fn and create some data structure for mapping
    const segmentHandlers = new Map<string, FlyFetch>();
    for (const {id, origin} of segments) {
      segmentHandlers.set(id, origin(fetch));
    }

    return async (req) => {
      // grab the segment for this user
      const segmentId = req.headers.get("x-segment-id")!;
      // map the segment to a handler
      const handler = segmentHandlers.get(segmentId)!;
      console.log("chooseSegment", { segmentId, handler });
      // invoke the handler
      return handler(req);
    }
  });
}

function assignSegment(segments: Segment[]): Pipe {
  const segmentIds = segments.map(s => s.id);
  console.log(segmentIds);
  return pipe(`assignSegment`, (fetch) => {
    return async (req) => {
      const segmentCookie = req.cookies.get("x-segment-id");
      let segmentId = segmentCookie ? segmentCookie.value : segmentIds[Math.floor(Math.random() * segmentIds.length)];
      req.headers.set("x-segment-id", segmentId);

      console.log("assignSegment", { segmentId, segmentCookie });
      const resp = await fetch(req);
      if (!segmentCookie) {
        resp.cookies.append("x-segment-id", segmentId, {});
      }
      return resp;
    }
  });
}
