jest.mock("@actions/exec");

import { s3Update } from "./s3-update";
import * as process from "process";
import * as cp from "child_process";
import * as path from "path";
import * as exec from "@actions/exec";

test("basic s3Update with branch calls correct sync and copy commands", async () => {
  await s3Update({
    deployPath: "branch/test-branch",
    branch: "test-branch",
    bucket: "test-bucket",
    prefix: "fake-app",
    localFolder: "test-dist-folders/basic",
  });

  const execMock = (exec.exec as any).mock;
  expect(execMock.calls).toEqual([
    [
      'aws s3 sync ./test-dist-folders/basic s3://test-bucket/fake-app/branch/test-branch --delete --exclude "*index.html" --exclude "*index-top.html" --cache-control "max-age=0"',
    ],
    [
      'aws s3 cp ./test-dist-folders/basic s3://test-bucket/fake-app/branch/test-branch --recursive --exclude "*" --include "*index.html" --include "*index-top.html" --cache-control "no-cache, max-age=0"',
    ],
  ]);
});

test("basic s3Update with version calls correct sync and copy commands", async () => {
  await s3Update({
    deployPath: "version/v1.2.3",
    version: "v1.2.3",
    bucket: "test-bucket",
    prefix: "fake-app",
    localFolder: "test-dist-folders/basic",
  });

  const execMock = (exec.exec as any).mock;
  expect(execMock.calls).toEqual([
    [
      'aws s3 sync ./test-dist-folders/basic s3://test-bucket/fake-app/version/v1.2.3 --delete --exclude "*index.html" --exclude "*index-top.html" --cache-control "max-age=31536000"',
    ],
    [
      'aws s3 cp ./test-dist-folders/basic s3://test-bucket/fake-app/version/v1.2.3 --recursive --exclude "*" --include "*index.html" --include "*index-top.html" --cache-control "no-cache, max-age=0"',
    ],
  ]);
});

test("basic s3Update with optional maxAge option set to 0 calls correct sync and copy commands", async () => {
  await s3Update({
    deployPath: "version/v1.2.3",
    version: "v1.2.3",
    bucket: "test-bucket",
    prefix: "fake-app",
    localFolder: "test-dist-folders/basic",
    maxAge: 0,
  });

  const execMock = (exec.exec as any).mock;
  expect(execMock.calls).toEqual([
    [
      'aws s3 sync ./test-dist-folders/basic s3://test-bucket/fake-app/version/v1.2.3 --delete --exclude "*index.html" --exclude "*index-top.html" --cache-control "max-age=0"',
    ],
    [
      'aws s3 cp ./test-dist-folders/basic s3://test-bucket/fake-app/version/v1.2.3 --recursive --exclude "*" --include "*index.html" --include "*index-top.html" --cache-control "no-cache, max-age=0"',
    ],
  ]);
});

test("basic s3Update with optional maxAge option set to 600 calls correct sync and copy commands", async () => {
  await s3Update({
    deployPath: "version/v1.2.3",
    version: "v1.2.3",
    bucket: "test-bucket",
    prefix: "fake-app",
    localFolder: "test-dist-folders/basic",
    maxAge: 600,
  });

  const execMock = (exec.exec as any).mock;
  expect(execMock.calls).toEqual([
    [
      'aws s3 sync ./test-dist-folders/basic s3://test-bucket/fake-app/version/v1.2.3 --delete --exclude "*index.html" --exclude "*index-top.html" --cache-control "max-age=600"',
    ],
    [
      'aws s3 cp ./test-dist-folders/basic s3://test-bucket/fake-app/version/v1.2.3 --recursive --exclude "*" --include "*index.html" --include "*index-top.html" --cache-control "no-cache, max-age=0"',
    ],
  ]);
});

test("s3Update with matching top branch calls correct sync and copy commands", async () => {
  await s3Update({
    deployPath: "branch/test-branch",
    branch: "test-branch",
    bucket: "test-bucket",
    prefix: "fake-app",
    localFolder: "test-dist-folders/basic",
    topBranchesJSON: '["test-branch", "main"]',
  });

  const execMock = (exec.exec as any).mock;
  expect(execMock.calls).toEqual([
    [
      'aws s3 sync ./test-dist-folders/basic s3://test-bucket/fake-app/branch/test-branch --delete --exclude "*index.html" --exclude "*index-top.html" --cache-control "max-age=0"',
    ],
    [
      'aws s3 cp ./test-dist-folders/basic s3://test-bucket/fake-app/branch/test-branch --recursive --exclude "*" --include "*index.html" --include "*index-top.html" --cache-control "no-cache, max-age=0"',
    ],
    [
      "aws s3 cp s3://test-bucket/fake-app/branch/test-branch/index-top.html s3://test-bucket/fake-app/index-test-branch.html",
    ],
  ]);
});

test("s3Update with matching top branch and mono-repo calls correct sync and copy commands", async () => {
  await s3Update({
    deployPath: "branch/test-branch",
    branch: "test-branch",
    bucket: "test-bucket",
    prefix: "fake-app",
    localFolder: "test-dist-folders/mono-repo",
    topBranchesJSON: '["test-branch", "main"]',
  });

  const execMock = (exec.exec as any).mock;
  expect(execMock.calls).toEqual([
    [
      'aws s3 sync ./test-dist-folders/mono-repo s3://test-bucket/fake-app/branch/test-branch --delete --exclude "*index.html" --exclude "*index-top.html" --cache-control "max-age=0"',
    ],
    [
      'aws s3 cp ./test-dist-folders/mono-repo s3://test-bucket/fake-app/branch/test-branch --recursive --exclude "*" --include "*index.html" --include "*index-top.html" --cache-control "no-cache, max-age=0"',
    ],
    [
      "aws s3 cp s3://test-bucket/fake-app/branch/test-branch/index-top.html s3://test-bucket/fake-app/index-test-branch.html",
    ],
    [
      "aws s3 cp s3://test-bucket/fake-app/branch/test-branch/sub-folder/index-top.html s3://test-bucket/fake-app/sub-folder/index-test-branch.html",
    ],
  ]);
});

test("s3Update without matching top branch calls correct sync and copy commands", async () => {
  await s3Update({
    deployPath: "branch/test-branch",
    branch: "test-branch",
    bucket: "test-bucket",
    prefix: "fake-app",
    localFolder: "test-dist-folders/basic",
    topBranchesJSON: '["main", "special-feature"]',
  });

  const execMock = (exec.exec as any).mock;
  expect(execMock.calls).toEqual([
    [
      'aws s3 sync ./test-dist-folders/basic s3://test-bucket/fake-app/branch/test-branch --delete --exclude "*index.html" --exclude "*index-top.html" --cache-control "max-age=0"',
    ],
    [
      'aws s3 cp ./test-dist-folders/basic s3://test-bucket/fake-app/branch/test-branch --recursive --exclude "*" --include "*index.html" --include "*index-top.html" --cache-control "no-cache, max-age=0"',
    ],
  ]);
});

test("s3Update with matching top branch but no index-top.html calls correct sync and copy commands", async () => {
  await s3Update({
    deployPath: "branch/test-branch",
    branch: "test-branch",
    bucket: "test-bucket",
    prefix: "fake-app",
    localFolder: "test-dist-folders/no-index-top",
    topBranchesJSON: '["main", "test-branch"]',
  });

  const execMock = (exec.exec as any).mock;
  expect(execMock.calls).toEqual([
    [
      'aws s3 sync ./test-dist-folders/no-index-top s3://test-bucket/fake-app/branch/test-branch --delete --exclude "*index.html" --exclude "*index-top.html" --cache-control "max-age=0"',
    ],
    [
      'aws s3 cp ./test-dist-folders/no-index-top s3://test-bucket/fake-app/branch/test-branch --recursive --exclude "*" --include "*index.html" --include "*index-top.html" --cache-control "no-cache, max-age=0"',
    ],
  ]);
});

test("s3Update with noPrefix option set calls correct sync and copy commands", async () => {
  await s3Update({
    deployPath: "branch/test-branch",
    branch: "test-branch",
    bucket: "test-bucket",
    prefix: "fake-app",
    noPrefix: true,
    localFolder: "test-dist-folders/basic",
  });

  const execMock = (exec.exec as any).mock;
  expect(execMock.calls).toEqual([
    [
      'aws s3 sync ./test-dist-folders/basic s3://test-bucket/branch/test-branch --delete --exclude "*index.html" --exclude "*index-top.html" --cache-control "max-age=0"',
    ],
    [
      'aws s3 cp ./test-dist-folders/basic s3://test-bucket/branch/test-branch --recursive --exclude "*" --include "*index.html" --include "*index-top.html" --cache-control "no-cache, max-age=0"',
    ],
  ]);
});

function testActionOutput(actionJSPath: string, deployPath: string) {
  const np = process.execPath;

  // Make sure the github commands of the action match what we expect
  // This stdout approach has been deprecated:
  // https://github.blog/changelog/2022-10-11-github-actions-deprecating-save-state-and-set-output-commands/
  // If the new GITHUB_OUTPUT variable and file doesn't exist, then the core library
  // continues to fallback to this stdout approach. Since it is easy to test stdout we just
  // make sure this variable isn't set even when this test is running in GitHub actions
  process.env.GITHUB_OUTPUT = "";

  const options: cp.ExecFileSyncOptions = {
    env: process.env,
  };

  const result = cp.execFileSync(np, [actionJSPath], options).toString();

  const githubCommands = result.split("\n").filter((line) => line.startsWith("::"));
  expect(githubCommands).toMatchObject(
    [ `::set-output name=deployPath::${deployPath}` ]
  );
}

// Test the main action using the env / stdout protocol
test("main action runs", () => {
  process.env.GITHUB_REF = "refs/heads/test-branch";
  const ip = path.join(__dirname, "..", "dist", "index.js");
  testActionOutput(ip, "branch/test-branch");
});

// Test the deploy-path action using the env / stdout protocol
test("deploy-path action runs", () => {
  process.env.GITHUB_REF = "refs/heads/test-branch2";
  const ip = path.join(__dirname, "..", "deploy-path", "dist", "index.js");
  testActionOutput(ip, "branch/test-branch2");
});
