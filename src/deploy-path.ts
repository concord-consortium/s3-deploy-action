import * as core from "@actions/core";
import {context} from "@actions/github";
import {getDeployProps} from "./deploy-props";

try {
  const {deployPath} = getDeployProps(context.ref);
  core.info(`deployPath: ${deployPath}`);

  // Output the deployPath so it can be used by an independent build step
  core.setOutput("deployPath", deployPath);
} catch (error) {
  core.setFailed(`Action failed with error: ${error}`);
}
