workflow "Build, Test, and Publish" {
  on = "push"
  resolves = ["Test"]
}

action "Build" {
  uses = "nuxt/actions-yarn@master"
  args = "install"
}

action "Test" {
  needs = "Build"
  uses = "nuxt/actions-yarn@master"
  args = "test"
  needs = ["Build"]
}
