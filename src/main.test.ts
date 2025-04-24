jest.mock("@actions/exec");

jest.mock("@actions/core", () => ({
  getInput: (name: string) => {
    if (name === "github-token") return "test-token";
    return "";
  },
  setOutput: jest.fn(),
  setFailed: jest.fn(),
  info: jest.fn()
}));

jest.mock("@actions/github", () => ({
  getOctokit: jest.fn(() => ({
    rest: {
      repos: {
        createDeployment: jest.fn().mockResolvedValue({ data: { id: 12345 } }),
        createDeploymentStatus: jest.fn().mockResolvedValue({}),
      }
    }
  })),
  context: {
    repo: {
      owner: "concord-consortium",
      repo: "s3-deploy-action"
    },
    ref: "refs/heads/test-branch"
  }
}));

import { s3Update } from "./s3-update";
import * as process from "process";
import * as childProcess from "child_process";
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

function testActionOutput(
  actionJSPath: string,
  environment: Record<string, string>,
  deployPath: string
) {
  const np = process.execPath;

  // Make sure the github commands of the action match what we expect
  // This stdout approach has been deprecated:
  // https://github.blog/changelog/2022-10-11-github-actions-deprecating-save-state-and-set-output-commands/
  // If the new GITHUB_OUTPUT variable and file doesn't exist, then the core library
  // continues to fallback to this stdout approach. Since it is easy to test stdout we just
  // make sure this variable isn't set even when this test is running in GitHub actions
  const env = {
    ...environment,
    GITHUB_OUTPUT: "",
    GITHUB_REPOSITORY: "concord-consortium/s3-deploy-action",
    "INPUT_GITHUB-TOKEN": "test-token"
  };

  const options: childProcess.ExecFileSyncOptions = {
    env,
  };

  try {
    const result = childProcess.execFileSync(np, [actionJSPath], options).toString();

    const githubCommands = result.split("\n").filter((line) => line.startsWith("::"));
    expect(githubCommands).toMatchObject(
      [ `::set-output name=deployPath::${deployPath}` ]
    );
  } catch (error) {
    if ((error as any).stdout) {
      console.log("Error running command\n", (error as any).stdout.toString());
    } else {
      console.log("Error running command", error);
    }
    throw new Error("Error running command");
  }
}

// This test runs against the built version of the code so you need to run
// `npm run build` and `npm run package` first
describe("built actions run using env / stdout protocol", () => {
  describe("main action", () => {
    const indexPath = path.join(__dirname, "..", "dist", "index.js");
    test("running in a push event on a branch", () => {
      testActionOutput(
        indexPath,
        {
          // The path is needed so the build command below will run
          PATH: process.env.PATH!,
          // Pass the build input as an env variable
          INPUT_BUILD: "echo no build",
          GITHUB_REF: "refs/heads/test-branch",
        },
        "branch/test-branch");
    });

    test("running in a pull_request event on a branch", () => {
      testActionOutput(
        indexPath,
        {
          // The path is needed so the build command below will run
          PATH: process.env.PATH!,
          // Pass the build input as an env variable
          INPUT_BUILD: "echo no build",
          GITHUB_REF: "refs/pull/123/merge",
          GITHUB_HEAD_REF: "test-branch2",
        },
        "branch/test-branch2");
    });
  });

  describe("deploy-path action", () => {
    const indexPath = path.join(__dirname, "..", "deploy-path", "dist", "index.js");
    test("running in a push event on a branch", () => {
      testActionOutput(
        indexPath,
        {
          GITHUB_REF: "refs/heads/test-branch2",
        },
        "branch/test-branch2");
    });

    test("running in a pull_request event on a branch", () => {
      testActionOutput(
        indexPath,
        {
          GITHUB_REF: "refs/pull/123/merge",
          GITHUB_HEAD_REF: "test-branch2",
        },
        "branch/test-branch2");
    });
  });

});
