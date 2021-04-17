import * as core from '@actions/core';
import {context} from '@actions/github';
import * as exec from '@actions/exec';
import {getDeployPath} from './deploy-path'
import * as process from 'process'

async function run(): Promise<void> {
  try {
    const deployPath = getDeployPath(context.ref);
    core.info(`deployPath: ${deployPath}`);
    process.env['SUB_DIR_PATH'] = deployPath;
    await exec.exec('npm run build');
    core.setOutput('deployPath', deployPath);
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
