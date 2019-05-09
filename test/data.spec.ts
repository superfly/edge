import { expect } from 'chai';
import * as data from "../src/data";
import { FetchFunction } from '../src/fetch';

import db from "@fly/v8env/lib/fly/data";
import cache from "@fly/v8env/lib/fly/cache";

describe("restAPI", () => {
  const paths:Record<string,FetchFunction> = {
    "/": data.restAPI("asdf"),
    "/with/a/base/path/": data.restAPI({authToken: "asdf", basePath: "/with/a/base/path/"})
  }

  for(const path of Object.getOwnPropertyNames(paths)){
    const api = paths[path];
    const colName = "testCollection";
    const testKey = `key-${new Date().getTime()}`;
    const collection = db.collection(colName);
    const cacheKey = `db.${colName}(${testKey})`;

    it(`GET ${path}${colName}/${testKey}`, async ()=>{
      const value = JSON.stringify({time: new Date().getTime()});
      await collection.put(testKey, value);

      const resp = await api(`http://api${path}${colName}/${testKey}`, {
        headers: {"Authorization": "Bearer asdf"}
      })
      expect(resp.status).to.eq(200);

      const body = await resp.text();
      expect(body).to.eq(value);

      const cacheValue = await cache.getString(cacheKey);
      expect(cacheValue).to.eq(body);
    })

    it(`GET (missing) ${path}${colName}/${testKey}`, async ()=>{
      const resp = await api(`http://api${path}${colName}/${testKey}-asdf`, {
        headers: {"Authorization": "Bearer asdf"}
      })
      expect(resp.status).to.eq(404);
    })

    it(`DELETE ${path}${colName}/${testKey}`, async ()=>{
      const value = JSON.stringify({time: new Date().getTime()});
      await collection.put(testKey, value);

      const resp = await api(`http://api${path}${colName}/${testKey}`, {
        method: "DELETE",
        headers: {"Authorization": "Bearer asdf"}
      })
      expect(resp.status).to.eq(204);

      const v = await collection.get(testKey);
      expect(v).to.eq(null);
    })

    it(`PUT ${path}${colName}/${testKey}`, async ()=>{
      const value = JSON.stringify({time: new Date().getTime()});

      const resp = await api(`http://api${path}${colName}/${testKey}`, {
        method: "PUT",
        body: value,
        headers: {"Authorization": "Bearer asdf"}
      })

      expect(resp.status).to.eq(201);

      const v = JSON.stringify(await collection.get(testKey));
      expect(v).to.eq(value);
    })

    it('expires cache on PUT', async ()=>{
      cache.set(cacheKey, "hocuspocus");

      const value = JSON.stringify({time: new Date().getTime()});

      const resp = await api(`http://api${path}${colName}/${testKey}`, {
        method: "PUT",
        body: value,
        headers: {"Authorization": "Bearer asdf"}
      })

      expect(resp.status).to.eq(201);
      const cacheValue = await cache.getString(cacheKey);
      expect(cacheValue).to.eq(null);
    })
  }
})