import * as exec from "@actions/exec";
import glob from "glob";

export interface S3UpdateOptions {
  deployPath: string,
  version?: string,
  branch?: string,
  bucket: string,
  prefix: string,
  topBranchesJSON?: string,
  localFolder: string,
  noPrefix?: boolean
}

const MAX_AGE_VERSION_SECS = 60*60*24*365;
const MAX_AGE_BRANCH_SECS = 0;


// Upload dist folder to the S3 bucket with the prefix followed by the deployPath
export async function s3Update(options: S3UpdateOptions): Promise<void> {
  // Currently this syncs the non index.html files first and then updates the index.html
  // files. So there is a moment when index.html files do not match the resources.
  // We could do this in 3 steps so there was no time when the index.html files
  // referenced missing resources. But even in that case a browser could have fetched
  // the old index.html just before it was replaced and then would be trying to
  // fetch the old resources as they are being deleted. The safest approach would be
  // to queue some kind of cleanup task which would delete the old resources several
  // minutes later.
  // However, branches are not intended for production use, so the occasional broken
  // branch does not seem worth fixing.

  const { deployPath, version, branch, bucket, prefix, topBranchesJSON, localFolder, noPrefix} = options;

  const topLevelS3Url = noPrefix ? `s3://${bucket}` : `s3://${bucket}/${prefix}`;
  const deployS3Url = `${topLevelS3Url}/${deployPath}`;
  const maxAgeSecs = version ?  MAX_AGE_VERSION_SECS : MAX_AGE_BRANCH_SECS;

  // copy everything except the index and index-top files, delete anything remote
  // that isn't present locally.
  // "*index.html" is used to support mono-repos that have sub folders with index
  // and index-top files.
  const excludes = `--exclude "*index.html" --exclude "*index-top.html"`;
  const cacheControl = `--cache-control "max-age=${maxAgeSecs}"`;
  await exec.exec(`aws s3 sync ./${localFolder} ${deployS3Url} --delete ${excludes} ${cacheControl}`);

  // Now copy all of the index and index-top files, again a pattern is used to support
  // mono-repos with sub folders
  const noCache = `--cache-control "no-cache, max-age=0"`;
  const filters = `--exclude "*" --include "*index.html" --include "*index-top.html"`;
  await exec.exec(`aws s3 cp ./${localFolder} ${deployS3Url} --recursive ${filters} ${noCache}`);

  if (topBranchesJSON) {
    const topBranches = JSON.parse(topBranchesJSON);
    if (topBranches.includes(branch)) {

      // Find all folders that contain index-top.html files and then copy their
      // remote versions to index-[branch].html
      // This approach is used to support mono-reports that might have index-top.html files
      // in sub folders. The matchBase option tells glob to look for the file in all directories.
      const files = glob.sync("index-top.html", {matchBase:true, cwd: localFolder});

      for (const indexTopFile of files) {
        const indexTopFolder = indexTopFile.replace(/index-top\.html$/, "");
        // TODO: We could optimize this to run the copies in parallel
        await exec.exec(`aws s3 cp ${deployS3Url}/${indexTopFolder}index-top.html ${topLevelS3Url}/${indexTopFolder}index-${branch}.html`);
      }
    }
  }

}
