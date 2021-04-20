export function getDeployProps(gitRefs: string): {deployPath: string, version?: string, branch?: string} {
  const versionMatch = gitRefs.match(/refs\/tags\/(.*)/);
  const version = versionMatch && versionMatch[1];
  const branchMatch = gitRefs.match(/refs\/heads\/(.*)/);
  const branch = branchMatch && branchMatch[1];
  if (version) {
    return {
      deployPath: `version/${version}`,
      version
    };
  }
  if (branch) {
    const prefixStripMatch = branch.match(/^[0-9]{8,}-(.+)$/);
    const suffixStripMatch = branch.match(/^(.+)-[0-9]{8,}$/);
    let strippedBranch = branch;
    if (prefixStripMatch) {
      strippedBranch = prefixStripMatch[1];
    } else if (suffixStripMatch) {
      strippedBranch = suffixStripMatch[1];
    }
    return {
      deployPath: `branch/${strippedBranch}`,
      branch: strippedBranch
    };
  }
  throw new Error(`Unknown ref: ${gitRefs}`);
}
