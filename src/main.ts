import * as core from '@actions/core';
import {context} from '@actions/github';
import * as exec from '@actions/exec';
import {getDeployProps} from './deploy-props';
import * as process from 'process';

// Upload dist folder to the S3 bucket with the prefix followed by the deployPath
async function s3Upload(deployS3Url: string, maxAge: number): Promise<void> {
  process.env['AWS_ACCESS_KEY_ID'] = core.getInput('awsAccessKeyId');
  process.env['AWS_SECRET_ACCESS_KEY'] = core.getInput('awsSecretAccessKey');
  process.env['AWS_DEFAULT_REGION'] = 'us-east-1';

  // Currently this syncs the non index.html files first and then updates the index.html
  // files. So there is a moment when index.html files do not match the resources.
  // We could do this in 3 steps so there was no time when the index.html files
  // referenced missing resources. But even in that case a browser could have fetched
  // the old index.html just before it was replaced and then would be trying to
  // fetch the old resources as they are being deleted. The safest approach would be
  // to queue some kind of cleanup task which would delete the old resources several
  // minutes later.
  // However, branches are not intended for production use, so the occational broken
  // branch does not seem worth fixing.

  const excludes = `--exclude "index.html" --exclude "index-top.html"`;
  const cacheControl = `--cache-control "max-age=${maxAge}"`;
  await exec.exec(`aws s3 sync ./dist ${deployS3Url} --delete ${excludes} ${cacheControl}`);

  const noCache = `--cache-control "no-cache, max-age=0"`;
  await exec.exec(`aws s3 cp ./dist/index.html ${deployS3Url}/ ${noCache}`);
  await exec.exec(`aws s3 cp ./dist/index-top.html ${deployS3Url}/ ${noCache}`);
}

async function run(): Promise<void> {
  try {
    const {deployPath, version, branch} = getDeployProps(context.ref);
    core.info(`deployPath: ${deployPath}`);
    process.env['SUB_DIR_PATH'] = deployPath;
    await exec.exec('npm run build');
    core.setOutput('deployPath', deployPath);

    const bucket = core.getInput('bucket');
    const prefix = core.getInput('prefix');
    if (bucket && prefix) {
      const topLevelS3Url = `s3://${bucket}/${prefix}`;
      const deployS3Url = `${topLevelS3Url}/${deployPath}`;
      const maxAge = version ? 60*60*24*365 : 60*2;
      await s3Upload(deployS3Url, maxAge);

      // seems better to move this into the s3Upload function
      const topBranchesInput = core.getInput('topBranches');
      if (topBranchesInput) {
        const topBranches = JSON.parse(topBranchesInput);
        if (topBranches.includes(branch)) {
          await exec.exec(`aws s3 cp ${deployS3Url}/index-top.html ${topLevelS3Url}/index-${branch}.html`);
        }
      }
    }


    // TODO:
    // - use workflow_dispatch to add the release UI right into GitHub itself!!!
    // - refactor to make the list of index.html files more clear and configurable

  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
