import { expect } from 'chai'
import { mount, MountInfo, proxy } from '../src'

const routes: MountInfo[] = [
  ['/blog', proxy('https://medium.com/blog')],
  ['/docs', proxy('https://docs.site.com/docs')],
  [/^\/(?:[a-z]{2}(-[A-Z]{2})?\/)?app/, proxy('https://www.site.com/app')],
  ['/', proxy('https://www.site.com')],
]

const app = mount(routes)

describe('mount', () => {
  it('should route properly', async () => {
    const resp = await app(new Request('http://localhost/blog'))
    console.log('*************** resp', resp)
    // expect(p.stages).to.exist
    // expect(p.stages.length).to.eq(2)
    // expect(p.stages[0]).to.eq(outer)
    // expect(p.stages[1]).to.eq(inner)
  })
})
