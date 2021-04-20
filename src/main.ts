import * as core from "@actions/core";
import {context} from "@actions/github";
import * as exec from "@actions/exec";
import {getDeployProps} from "./deploy-props";
import {s3Update} from "./s3-update";
import * as process from "process";

async function run(): Promise<void> {
  try {
    const {deployPath, version, branch} = getDeployProps(context.ref);
    core.info(`deployPath: ${deployPath}`);
    process.env.SUB_DIR_PATH = deployPath;
    await exec.exec("npm run build");
    core.setOutput("deployPath", deployPath);

    const bucket = core.getInput("bucket");
    const prefix = core.getInput("prefix");
    const topBranchesJSON = core.getInput("topBranches");
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
        topBranchesJSON });
    }

    // TODO:
    // - refactor to make the list of index.html files more clear and configurable
    // - change name of SUB_DIR_PATH to be something more informative

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
