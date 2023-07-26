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
    const noPrefix = core.getInput("noPrefix") === "true"; // allows top level bucket deploys if true
    const topBranchesJSON = core.getInput("topBranches");
    const folderToDeploy = core.getInput("folderToDeploy");
    const localFolderParts = [];
    if (workingDirectory) {
      localFolderParts.push(workingDirectory);
    }
    localFolderParts.push(folderToDeploy || "dist");
    const localFolder = localFolderParts.join("/");

    let maxBranchAge: number|undefined = parseInt(core.getInput("maxBranchAge"), 10);
    if (isNaN(maxBranchAge)) {
      maxBranchAge = undefined;
    }
    let maxVersionAge: number|undefined = parseInt(core.getInput("maxVersionAge"), 10);
    if (isNaN(maxVersionAge)) {
      maxVersionAge = undefined;
    }
    const maxAge = version ? maxVersionAge : (branch ? maxBranchAge : undefined);

    if (bucket && (prefix || noPrefix)) {
      process.env.AWS_ACCESS_KEY_ID = core.getInput("awsAccessKeyId");
      process.env.AWS_SECRET_ACCESS_KEY = core.getInput("awsSecretAccessKey");
      process.env.AWS_DEFAULT_REGION = "us-east-1";

      const options = {
        deployPath,
        version,
        branch,
        bucket,
        prefix,
        noPrefix,
        topBranchesJSON,
        localFolder,
        maxAge
      };

      core.info(`Calling s3Update with: ${JSON.stringify(options)}`);

      await s3Update(options);
    }

  } catch (error) {
    core.setFailed(`Action failed with error: ${error}`);
  }
}

run();
