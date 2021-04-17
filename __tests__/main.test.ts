import {getDeployPath} from '../src/deploy-path'
import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'

test('getDeployPath version release', () => {
  expect(getDeployPath("refs/tags/v1.2.3")).toEqual("version/v1.2.3");
})

test('getDeployPath PT prefix branch', () => {
  expect(getDeployPath("refs/heads/123456789-test-branch")).toEqual("branch/test-branch");
})

test('getDeployPath PT suffix branch', () => {
  expect(getDeployPath("refs/heads/test-branch-123456789")).toEqual("branch/test-branch");
})

test('getDeployPath not PT branch', () => {
  expect(getDeployPath("refs/heads/test-branch")).toEqual("branch/test-branch");
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
