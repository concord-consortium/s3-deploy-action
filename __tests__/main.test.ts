import {getDeployProps} from '../src/deploy-props'
import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'

test('getDeployProps version release', () => {
  expect(getDeployProps("refs/tags/v1.2.3"))
    .toEqual({deployPath: "version/v1.2.3", version: "v1.2.3"});
})

test('getDeployProps PT prefix branch', () => {
  expect(getDeployProps("refs/heads/123456789-test-branch"))
    .toEqual({deployPath: "branch/test-branch", branch: "test-branch"});
})

test('getDeployProps PT suffix branch', () => {
  expect(getDeployProps("refs/heads/test-branch-123456789"))
    .toEqual({deployPath: "branch/test-branch", branch: "test-branch"});
})

test('getDeployProps not PT branch', () => {
  expect(getDeployProps("refs/heads/test-branch"))
    .toEqual({deployPath: "branch/test-branch", branch: "test-branch"});
})

// Test the action using the env / stdout protocol
test('test runs', () => {
  process.env['GITHUB_REF'] = "refs/heads/test-branch";
  const np = process.execPath
  const ip = path.join(__dirname, '..', 'lib', 'main.js')
  const options: cp.ExecFileSyncOptions = {
    env: process.env
  }
  console.log(cp.execFileSync(np, [ip], options).toString())
})
