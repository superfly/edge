# Contributing to the Fly Edge

Thanks for stopping by! We'd like to make it as easy as possible for you to get started contributing, so read on to learn how.

## Where to start?

If you want to suggest a new feature, found a bug, or have a question, [search the issue tracker](https://github.com/superfly/edge/issues) to see if
someone else in the community has already created a ticket. If not, go ahead and create one
[here](https://github.com/superfly/edge/issues/new)!

## Workflow

The core team uses the [Pull Request workflow](https://guides.github.com/introduction/flow/) for all of our development. Each pull request is automatically tested and verified by our continuous integration system which is reported live on the pull request. Once all checks pass, someone on the core team will review the code and either sign off or provide feedback. After the change is signed off, the pull request will be merged into `master`. Note that `master` is not immediately published, so there might be a delay before the updated packages are live on npm.

We try to work through pull requests as quickly as we can, but some large or far reaching changes may take longer.

### 1. Fork & create a branch

When you're ready to start contributing, [fork](https://help.github.com/articles/fork-a-repo/) the CDN and clone to your machine:

```sh
git clone https://github.com/superfly/edge.git flycdn
cd flycdn

```

Next, create a branch from `master` with a descriptive name.

```sh
git checkout -b <your-branch>
```

A good branch name, for example, where issue #156 is the ticket you're working on, would be `156-update-docs`.

### 2. Install dependencies

The Fly CDN uses [Yarn](https://yarnpkg.com/en/) to manage dependencies and run development scripts. If you don't already have yarn installed, follow [these directions](https://yarnpkg.com/en/docs/install).

```sh
yarn install
```

### 3. Get the test suite running

Run the test suite:

```sh
yarn test
```

If the test suite passed, your environment is ready to go.

### 4. Make your changes

You're now ready to make your changes!

### 5. Make a Pull Request

Once you're happy with your changes and the test suite is passing locally, it's time to prepare your code for a pull request.

It's good practice to update your code with the latest changes on the Fly CDN's `master` branch before publishing. To do this you'll need to update your local copy of master and merge any changes into your branch:

```sh
git remote add upstream https://github.com/superfly/edge.git
git fetch upstream master
git rebase upstream/master
```

Then, push code to your fork:

```sh
git push --set-upstream origin <your-branch>
```

Finally, go to GitHub and [make a Pull Request](https://github.com/superfly/edge/compare) :D

[search the issue tracker]: https://github.com/superfly/edge/issues?q=something
[new issue]: https://github.com/superfly/edge/issues/new
[fork the CDN]: https://help.github.com/articles/fork-a-repo
[make a pull request]: https://help.github.com/articles/creating-a-pull-request
[git rebasing]: http://git-scm.com/book/en/Git-Branching-Rebasing
[interactive rebase]: https://help.github.com/articles/interactive-rebase

---

## Getting Started with your new Fly CDN

### Want a UI?

Sign up for an account on fly.io and use the `create app` button.

### Clone and run tests.

* `git clone https://github.com/superfly/edge.git flycdn` 
* `cd flycdn`
* `yarn install`
* `yarn test`

### Local development server

Run `yarn start` to launch a local development server on port 3000, then have a look in your browser: http://localhost:3000

### Deploy to production

You can deploy this app to the Fly hosting service using the CLI. Sign up at fly.io, then run:

* `yarn fly login`
* `yarn fly app create <name-of-your-app>`
* `yarn fly deploy`

### Questions? Feedback?

We're active in [Gitter](https://gitter.im/superfly/fly) (you do not need to sign in to view recent chat) and on [Twitter](https://twitter.com/flydotio) or you can drop us a line at support@fly.io. Thanks!  
