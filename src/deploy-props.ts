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
    const jiraPrefixStripMatch = branch.match(/^[A-Z]{2,}-[0-9]+-(.+)$/);
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
  throw new Error(`Unknown ref: ${gitRefs}`);
}
