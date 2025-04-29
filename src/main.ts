import * as core from "@actions/core";
import * as github from "@actions/github";
import {exec, ExecOptions} from "@actions/exec";
import {getDeployProps} from "./deploy-props";
import {s3Update} from "./s3-update";
import * as process from "process";

async function run(): Promise<void> {
  const { repo, owner } = github.context.repo;
  let octokit: ReturnType<typeof github.getOctokit> | undefined;

  const isTest = process.env.NODE_ENV === "test";
  if (!isTest) {
    const token = core.getInput("githubToken");
    if (token) {
      octokit = github.getOctokit(token);
    }
  }

  let deploymentId: number | undefined;
  const { deployPath, version, branch, error: deployError } = getDeployProps();

  if (deployError) {
    core.setFailed(`Error getting deploy props: ${deployError}`);
    return;
  }

  core.info(`deployPath: ${deployPath}`);

  try {
    if (octokit) {
      const deploymentResp = await octokit.rest.repos.createDeployment({
        owner,
        repo,
        ref: github.context.ref,
        required_contexts: [], // skip status checks
        environment: branch ? "development" : "staging",
        auto_merge: false,
        description: "Deploying to S3",
      });

      if (!deploymentResp?.data || !("id" in deploymentResp.data)) {
        throw new Error(`Failed to create deployment: ${JSON.stringify(deploymentResp?.data)}`);
      }

      deploymentId = deploymentResp?.data.id;
    }

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

    // Output the deployPath so it can be used to generate a deploy url
    core.setOutput("deployPath", deployPath);

    const bucket = core.getInput("bucket");
    const prefix = core.getInput("prefix");
    const noPrefix = core.getInput("noPrefix") === "true"; // allows top level bucket deploys if true
    const topBranchesJSON = core.getInput("topBranches");
    const folderToDeploy = core.getInput("folderToDeploy") || "dist";
    const localFolderParts = [];
    if (workingDirectory) {
      localFolderParts.push(workingDirectory);
    }
    localFolderParts.push(folderToDeploy);
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

      const deployRunUrl = core.getInput("deployRunUrl");
      const logUrl = deployRunUrl ? deployRunUrl.replace(/__deployPath__/, deployPath) : "";
      core.setOutput("logUrl", logUrl);
      core.info(`Deployment log URL: ${logUrl}`);

      if (deploymentId && octokit) {
        await octokit.rest.repos.createDeploymentStatus({
          owner,
          repo,
          deployment_id: deploymentId,
          state: "success",
          ...(logUrl && { environment_url: logUrl, log_url: logUrl }),
          description: "Deployment finished successfully"
        });
      }
    }

  } catch (error) {
    core.setFailed(`Action failed with error: ${error}`);
    if (!deploymentId || !octokit || isTest) return;

    await octokit.rest.repos.createDeploymentStatus({
      owner,
      repo,
      deployment_id: deploymentId,
      state: "failure",
      environment_url: "",
      log_url: "",
      description: `Deployment failed with error: ${error}`
    });
  }
}

run();
