
// We use environment variables to figure out the branch or tag name:
// https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables#default-environment-variables
// Instead we could use the context provided by @actions/github, but that makes this harder to test
// and requires more logic to make sure we are looking at the right ref.
//
// Perhaps in the future we'll want more information about the event that triggered
// the action. In that case it might make sense to switch to using the context
// object. Testing this will be harder because we'll have to set GITHUB_EVENT_NAME
// and GITHUB_EVENT_PATH and write the payload to the file referred to by
// GITHUB_EVENT_PATH.
//
// import {context} from "@actions/github";
// import {WebhookEventMap, WebhookEventName} from "@octokit/webhooks-definitions/schema";
// type TypedContext = {
//   [k in WebhookEventName]: { eventName: k; payload: WebhookEventMap[k] };
// }[WebhookEventName];
// const typedContext = context as unknown as TypedContext;
// if (typedContext.eventName === "pull_request") {
//   ref = typedContext.payload.pull_request.head.ref;
// }

export function getDeployProps(refOverride?: string): {deployPath: string, version?: string, branch?: string, error?: string} {
  const headRefName = process.env.GITHUB_HEAD_REF;
  const headRef = headRefName && `/refs/heads/${headRefName}`;
  const ref = refOverride || headRef || process.env.GITHUB_REF;
  const versionMatch = ref?.match(/refs\/tags\/(.*)/);
  const version = versionMatch && versionMatch[1];
  const branchMatch = ref?.match(/refs\/heads\/(.*)/);
  const branch = branchMatch && branchMatch[1];
  if (version) {
    return {
      deployPath: `version/${version}`,
      version
    };
  }
  if (branch) {
    const jiraPrefixStripMatch = branch.match(/^[A-Za-z]{2,}-[0-9]+-(.+)$/);
    const pivotalPrefixStripMatch = branch.match(/^#?[0-9]{8,}-(.+)$/);
    const pivotalSuffixStripMatch = branch.match(/^(.+)-#?[0-9]{8,}$/);
    let strippedBranch = branch;
    if (jiraPrefixStripMatch) {
      strippedBranch = jiraPrefixStripMatch[1];
    } else if (pivotalPrefixStripMatch) {
      strippedBranch = pivotalPrefixStripMatch[1];
    } else if (pivotalSuffixStripMatch) {
      strippedBranch = pivotalSuffixStripMatch[1];
    }
    return {
      deployPath: `branch/${strippedBranch}`,
      branch: strippedBranch
    };
  }

  return { deployPath: "", error: `Unknown ref: ${ref}` };
}
