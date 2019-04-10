import { expect } from 'chai'
import { mount, MountInfo } from '../src'

const routes: MountInfo[] = [
  ['/blog', async (req, init) => await new Response('Blog site')],
  ['/docs', async (req, init) => await new Response('Docs site')],
  [/^\/(?:[a-z]{2}(-[A-Z]{2})?\/)?app/, async (req, init) => await new Response('App site')],
  ['/', async (req, init) => await new Response('Main site')],
]

const app = mount(routes)

async function checkRoutingAssertions(resp: Response, respText: String) {
  expect(resp.status).to.eq(200)
  expect(resp.ok).to.be.true
  expect(await resp.text()).to.eq(respText)
}

describe('mount', () => {
  it('should route to /blog properly', async () => {
    const resp = await app(new Request('http://www.site.com/blog'))
    checkRoutingAssertions(resp, 'Blog site')
  })

  it('should route to /docs properly', async () => {
    const resp = await app(new Request('http://www.site.com/docs'))
    checkRoutingAssertions(resp, 'Docs site')
  })

  it('should route to /app properly', async () => {
    const resp = await app(new Request('http://www.site.com/app'))
    checkRoutingAssertions(resp, 'App site')
  })

  it('should route to /de-DE/app properly', async () => {
    const resp = await app(new Request('http://www.site.com/de-DE/app'))
    checkRoutingAssertions(resp, 'App site')
  })

  it('should route to /* properly', async () => {
    const resp = await app(new Request('http://www.site.com/'))
    checkRoutingAssertions(resp, 'Main site')

    const resp2 = await app(new Request('http://www.site.com/foo'))
    checkRoutingAssertions(resp2, 'Main site')
  })
})
