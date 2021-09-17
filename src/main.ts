import * as core from "@actions/core";
import {context} from "@actions/github";
import {exec, ExecOptions} from "@actions/exec";
import {getDeployProps} from "./deploy-props";
import {s3Update} from "./s3-update";
import * as process from "process";

async function run(): Promise<void> {
  try {
    const {deployPath, version, branch} = getDeployProps(context.ref);
    core.info(`deployPath: ${deployPath}`);

    const workingDirectory = core.getInput("workingDirectory");
    const build = core.getInput("build") || "npm run build";
    const execOptions: ExecOptions = {};
    if (workingDirectory) {
      execOptions.cwd = workingDirectory;
    }

    // provide the deployPath to the build command as an env variable
    // this way the build can create the index-top.html that prefixes its dependencies
    // with this path
    process.env.DEPLOY_PATH = deployPath;
    await exec(build, [], execOptions);
    core.setOutput("deployPath", deployPath);

    const bucket = core.getInput("bucket");
    const prefix = core.getInput("prefix");
    const topBranchesJSON = core.getInput("topBranches");
    const folderToDeploy = core.getInput("folderToDeploy");
    const localFolderParts = [];
    if (workingDirectory) {
      localFolderParts.push(workingDirectory);
    }
    localFolderParts.push(folderToDeploy || "dist");
    const localFolder = localFolderParts.join("/");
    if (bucket && prefix) {
      process.env.AWS_ACCESS_KEY_ID = core.getInput("awsAccessKeyId");
      process.env.AWS_SECRET_ACCESS_KEY = core.getInput("awsSecretAccessKey");
      process.env.AWS_DEFAULT_REGION = "us-east-1";

      await s3Update({
        deployPath,
        version,
        branch,
        bucket,
        prefix,
        topBranchesJSON,
        localFolder });
    }

  } catch (error) {
    core.setFailed(`Action failed with error: ${error}`);
  }
}

run();
