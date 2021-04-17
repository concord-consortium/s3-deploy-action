import * as core from '@actions/core';
import {context} from '@actions/github';
import {getDeployPath} from './deploy-path'

async function run(): Promise<void> {
  try {
    const deployPath = getDeployPath(context.ref);
    core.info(`deployPath: ${deployPath}`);

    core.setOutput('deployPath', deployPath);
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
