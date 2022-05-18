jest.mock('@actions/exec');

import {getDeployProps} from '../src/deploy-props'
import {s3Update} from '../src/s3-update'
import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import * as exec from '@actions/exec';
import * as fs from 'fs';

test('getDeployProps version release', () => {
  expect(getDeployProps("refs/tags/v1.2.3"))
    .toEqual({deployPath: "version/v1.2.3", version: "v1.2.3"});
})

test('getDeployProps PT prefix branch', () => {
  expect(getDeployProps("refs/heads/123456789-test-branch"))
    .toEqual({deployPath: "branch/test-branch", branch: "test-branch"});
})

test('getDeployProps PT prefix branch with "#"', () => {
  expect(getDeployProps("refs/heads/#123456789-test-branch"))
    .toEqual({deployPath: "branch/test-branch", branch: "test-branch"});
})

test('getDeployProps PT suffix branch', () => {
  expect(getDeployProps("refs/heads/test-branch-123456789"))
    .toEqual({deployPath: "branch/test-branch", branch: "test-branch"});
})

test('getDeployProps PT suffix branch with "#"', () => {
  expect(getDeployProps("refs/heads/test-branch-#123456789"))
    .toEqual({deployPath: "branch/test-branch", branch: "test-branch"});
})

test('getDeployProps not PT branch', () => {
  expect(getDeployProps("refs/heads/test-branch"))
    .toEqual({deployPath: "branch/test-branch", branch: "test-branch"});
})

test('basic s3Update with branch calls correct sync and copy commands', async () => {
  await s3Update({
    deployPath: 'branch/test-branch',
    branch: 'test-branch',
    bucket: 'test-bucket',
    prefix: 'fake-app',
    localFolder: 'test-dist-folders/basic'
  });

  const execMock = (exec.exec as any).mock;
  expect(execMock.calls).toEqual([
    ['aws s3 sync ./test-dist-folders/basic s3://test-bucket/fake-app/branch/test-branch --delete --exclude "*index.html" --exclude "*index-top.html" --cache-control "max-age=0"'],
    ['aws s3 cp ./test-dist-folders/basic s3://test-bucket/fake-app/branch/test-branch --recursive --exclude "*" --include "*index.html" --include "*index-top.html" --cache-control "no-cache, max-age=0"']
  ]);
})

test('basic s3Update with version calls correct sync and copy commands', async () => {
  await s3Update({
    deployPath: 'version/v1.2.3',
    version: 'v1.2.3',
    bucket: 'test-bucket',
    prefix: 'fake-app',
    localFolder: 'test-dist-folders/basic'
  });

  const execMock = (exec.exec as any).mock;
  expect(execMock.calls).toEqual([
    ['aws s3 sync ./test-dist-folders/basic s3://test-bucket/fake-app/version/v1.2.3 --delete --exclude "*index.html" --exclude "*index-top.html" --cache-control "max-age=31536000"'],
    ['aws s3 cp ./test-dist-folders/basic s3://test-bucket/fake-app/version/v1.2.3 --recursive --exclude "*" --include "*index.html" --include "*index-top.html" --cache-control "no-cache, max-age=0"']
  ]);
})

test('s3Update with matching top branch calls correct sync and copy commands', async () => {
  await s3Update({
    deployPath: 'branch/test-branch',
    branch: 'test-branch',
    bucket: 'test-bucket',
    prefix: 'fake-app',
    localFolder: 'test-dist-folders/basic',
    topBranchesJSON: '["test-branch", "main"]'
  });

  const execMock = (exec.exec as any).mock;
  expect(execMock.calls).toEqual([
    ['aws s3 sync ./test-dist-folders/basic s3://test-bucket/fake-app/branch/test-branch --delete --exclude "*index.html" --exclude "*index-top.html" --cache-control "max-age=0"'],
    ['aws s3 cp ./test-dist-folders/basic s3://test-bucket/fake-app/branch/test-branch --recursive --exclude "*" --include "*index.html" --include "*index-top.html" --cache-control "no-cache, max-age=0"'],
    ['aws s3 cp s3://test-bucket/fake-app/branch/test-branch/index-top.html s3://test-bucket/fake-app/index-test-branch.html']
  ]);
})

test('s3Update with matching top branch and mono-repo calls correct sync and copy commands', async () => {
  await s3Update({
    deployPath: 'branch/test-branch',
    branch: 'test-branch',
    bucket: 'test-bucket',
    prefix: 'fake-app',
    localFolder: 'test-dist-folders/mono-repo',
    topBranchesJSON: '["test-branch", "main"]'
  });

  const execMock = (exec.exec as any).mock;
  expect(execMock.calls).toEqual([
    ['aws s3 sync ./test-dist-folders/mono-repo s3://test-bucket/fake-app/branch/test-branch --delete --exclude "*index.html" --exclude "*index-top.html" --cache-control "max-age=0"'],
    ['aws s3 cp ./test-dist-folders/mono-repo s3://test-bucket/fake-app/branch/test-branch --recursive --exclude "*" --include "*index.html" --include "*index-top.html" --cache-control "no-cache, max-age=0"'],
    ['aws s3 cp s3://test-bucket/fake-app/branch/test-branch/index-top.html s3://test-bucket/fake-app/index-test-branch.html'],
    ['aws s3 cp s3://test-bucket/fake-app/branch/test-branch/sub-folder/index-top.html s3://test-bucket/fake-app/sub-folder/index-test-branch.html']
  ]);
})

test('s3Update without matching top branch calls correct sync and copy commands', async () => {
  await s3Update({
    deployPath: 'branch/test-branch',
    branch: 'test-branch',
    bucket: 'test-bucket',
    prefix: 'fake-app',
    localFolder: 'test-dist-folders/basic',
    topBranchesJSON: '["main", "special-feature"]'
  });

  const execMock = (exec.exec as any).mock;
  expect(execMock.calls).toEqual([
    ['aws s3 sync ./test-dist-folders/basic s3://test-bucket/fake-app/branch/test-branch --delete --exclude "*index.html" --exclude "*index-top.html" --cache-control "max-age=0"'],
    ['aws s3 cp ./test-dist-folders/basic s3://test-bucket/fake-app/branch/test-branch --recursive --exclude "*" --include "*index.html" --include "*index-top.html" --cache-control "no-cache, max-age=0"'],
  ]);
})

test('s3Update with matching top branch but no index-top.html calls correct sync and copy commands', async () => {
  await s3Update({
    deployPath: 'branch/test-branch',
    branch: 'test-branch',
    bucket: 'test-bucket',
    prefix: 'fake-app',
    localFolder: 'test-dist-folders/no-index-top',
    topBranchesJSON: '["main", "test-branch"]'
  });

  const execMock = (exec.exec as any).mock;
  expect(execMock.calls).toEqual([
    ['aws s3 sync ./test-dist-folders/no-index-top s3://test-bucket/fake-app/branch/test-branch --delete --exclude "*index.html" --exclude "*index-top.html" --cache-control "max-age=0"'],
    ['aws s3 cp ./test-dist-folders/no-index-top s3://test-bucket/fake-app/branch/test-branch --recursive --exclude "*" --include "*index.html" --include "*index-top.html" --cache-control "no-cache, max-age=0"'],
  ]);
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
