# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="0.7.2"></a>
## [0.7.2](https://github.com/superfly/edge/compare/v0.7.1...v0.7.2) (2019-04-04)


### Bug Fixes

* faster installs, fly now a dev dependency ([d9e7e6b](https://github.com/superfly/edge/commit/d9e7e6b))



<a name="0.7.1"></a>
## [0.7.1](https://github.com/superfly/edge/compare/v0.7.0...v0.7.1) (2019-03-14)


### Bug Fixes

* proxy supports fetch client certificates ([c8b56a4](https://github.com/superfly/edge/commit/c8b56a4))



<a name="0.7.0"></a>
# [0.7.0](https://github.com/superfly/edge/compare/v0.6.0-0...v0.7.0) (2019-03-14)


### Features

* firebase backend ([#42](https://github.com/superfly/edge/issues/42)) ([a964be5](https://github.com/superfly/edge/commit/a964be5))
* gitlab pages backend ([#43](https://github.com/superfly/edge/issues/43)) ([93ee12d](https://github.com/superfly/edge/commit/93ee12d))
* load balancing ([f3c77e6](https://github.com/superfly/edge/commit/f3c77e6))



<a name="0.6.0"></a>
# [0.6.0](https://github.com/superfly/edge/compare/v0.6.0-0...v0.6.0) (2019-03-12)



<a name="0.6.0-0"></a>
# [0.6.0-0](https://github.com/superfly/cdn/compare/v0.5.0-0...v0.6.0-0) (2019-02-20)


### Bug Fixes

* auto-webp works with config based setup now ([a06b1cd](https://github.com/superfly/cdn/commit/a06b1cd))
* conflicting fly versions in dev/dependencies ([d0aa9c2](https://github.com/superfly/cdn/commit/d0aa9c2))
* getting started sending wrong host header (fixes: [#34](https://github.com/superfly/cdn/issues/34)) ([073bf67](https://github.com/superfly/cdn/commit/073bf67))
* include aws dependencies ([66ef0f5](https://github.com/superfly/cdn/commit/66ef0f5))
* origin backend doesn't accept forwardHostHeader ([6b97455](https://github.com/superfly/cdn/commit/6b97455))
* origin backend respects forwardHostHeader option ([57cd1d9](https://github.com/superfly/cdn/commit/57cd1d9))
* origin backend users retries option properly ([5d2242d](https://github.com/superfly/cdn/commit/5d2242d))
* proxy retries needs back off ([3c305f5](https://github.com/superfly/cdn/commit/3c305f5))
* relative `proxy` import on s3 backend ([#45](https://github.com/superfly/cdn/issues/45)) ([5e01d86](https://github.com/superfly/cdn/commit/5e01d86))
* squareSpace -> squarespace ([a60918b](https://github.com/superfly/cdn/commit/a60918b))


### Features

* aerobatic backend ([0fc08ab](https://github.com/superfly/cdn/commit/0fc08ab))
* better error handling on proxy (fixes [#28](https://github.com/superfly/cdn/issues/28)) ([c8c2e99](https://github.com/superfly/cdn/commit/c8c2e99))
* surge.sh backend ([a924769](https://github.com/superfly/cdn/commit/a924769))
* Zeit Now backend ([35b30f8](https://github.com/superfly/cdn/commit/35b30f8))



<a name="0.5.0"></a>
# [0.5.0](https://github.com/superfly/cdn/compare/v0.4.0...v0.5.0) (2019-01-17)


### Features

* Automatically serve webp images when possible ([#17](https://github.com/superfly/cdn/issues/17)) ([c5cafc2](https://github.com/superfly/cdn/commit/c5cafc2))
* AWS S3 backend ([#22](https://github.com/superfly/cdn/issues/22)) ([1b32d02](https://github.com/superfly/cdn/commit/1b32d02)), closes [#12](https://github.com/superfly/cdn/issues/12)
* Squarespace backend type ([213c4e7](https://github.com/superfly/cdn/commit/213c4e7)), closes [#16](https://github.com/superfly/cdn/issues/16)



<a name="0.4.0"></a>
# [0.4.0](https://github.com/superfly/cdn/compare/v0.3.3...v0.4.0) (2019-01-09)


### Features

* Glitch backend type ([b9bdb0b](https://github.com/superfly/cdn/commit/b9bdb0b))
* http-cache middleware ([#15](https://github.com/superfly/cdn/issues/15)) ([5d6d47a](https://github.com/superfly/cdn/commit/5d6d47a))
* Netlify backend type ([f1891a3](https://github.com/superfly/cdn/commit/f1891a3))

### Bug Fixes

* generated typedefs break tsc compilation ([0e21699](https://github.com/superfly/cdn/commit/0e21699))


<a name="0.4.0-1"></a>
# [0.4.0-1](https://github.com/superfly/cdn/compare/v0.4.0-0...v0.4.0-1) (2019-01-09)


<a name="0.4.0-0"></a>
# [0.4.0-0](https://github.com/superfly/cdn/compare/v0.3.3...v0.4.0-0) (2019-01-08)


<a name="0.3.3"></a>
## [0.3.3](https://github.com/superfly/cdn/compare/v0.3.2...v0.3.3) (2018-12-18)



<a name="0.3.2"></a>
## [0.3.2](https://github.com/superfly/cdn/compare/v0.3.1...v0.3.2) (2018-12-13)


### Bug Fixes

* need fly 0.44.2 ([aa5fd85](https://github.com/superfly/cdn/commit/aa5fd85))



<a name="0.3.1"></a>
## [0.3.1](https://github.com/superfly/cdn/compare/v0.3.0...v0.3.1) (2018-12-13)


### Bug Fixes

* include proper files in publish ([f6f30e7](https://github.com/superfly/cdn/commit/f6f30e7))



<a name="0.3.0"></a>
# 0.3.0 (2018-12-13)


### Features

* ghost pro backend type ([dc1fca5](https://github.com/superfly/cdn/commit/dc1fca5))
* GitHub Pages backend type ([19e1a28](https://github.com/superfly/cdn/commit/19e1a28))
* Heroku backend support ([a1d7edb](https://github.com/superfly/cdn/commit/a1d7edb))
* package as an npm ([b53cec1](https://github.com/superfly/cdn/commit/b53cec1))
* rewrite location headers on proxied responses ([604a531](https://github.com/superfly/cdn/commit/604a531))



<a name="0.2.0"></a>
# 0.2.0 (2018-10-20)


### Features

* package as an npm ([b53cec1](https://github.com/superfly/fl-site/commit/b53cec1))
