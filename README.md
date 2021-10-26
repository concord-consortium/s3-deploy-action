# Usage

## Basic Example
Add the following step to a GitHub workflow file:
```
- uses: concord-consortium/s3-deploy-action@v1
  with:
    bucket: models-resources
    prefix: name-of-project
    awsAccessKeyId: ${{ secrets.AWS_ACCESS_KEY_ID }}
    awsSecretAccessKey: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```
You should replace `name-of-project` with the repository name.

This will build the code with `npm run build`, and then copy the output in `dist` up to
S3. The location in S3 depends on if this is a branch or tag:
- If it is a branch it will be:
`models-resources/name-of-project/branch/[branch-name]`
- If it is a tag it will be:
`models-resources/name-of-project/version/[tag-name]`

The max-age of the files in branches is configured to be 0. This way changes to branches
are seen immediately. Branches should not be used in production with high numbers of users.

The max-age of the files in the version folder is set to be 1 year. Versions should not change
so they can be cached basically forever.  

The index files have their max-age set to 0 even for versions. These files should be small
so it isn't important if they are cached. This is also needed for the top branch feature
described below.

The build command can be overridden with the `build` option.

The folder where the build command is run can be overridden with `workingDirectory`.

The folder that is copied to S3 can be overridden with `folderToDeploy`. Its value is
relative to the `workingDirectory`.

## Top Branch Example
This action also supports a concept of top branches. A simple configuration of this is:

```
- uses: concord-consortium/s3-deploy-action@v1
  with:
    bucket: models-resources
    prefix: name-of-project
    awsAccessKeyId: ${{ secrets.AWS_ACCESS_KEY_ID }}
    awsSecretAccessKey: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    topBranches:
      - main
```

If `topBranches` is specified, the action assumes there will be an an `index-top.html` file
created in the `folderToDeploy`. The `index-top.html` should reference its dependencies
using a prefix of `branch/[branch-name]/` or `version/[tag-name]/`. This way the
`index-top.html` can be copied up two levels and still be able to find its resources.
The build command is passed this prefix in an environment variable named `DEPLOY_PATH`.

The list of branches in `topBranches` will have their `index-top.html` file copied and
renamed with the branch name.
So in this case, if the main branch is pushed,
`models-resources/name-of-project/branch/main/index-top.html` will be copied
to `models-resources/name-of-project/index-main.html`

Because the index files have their max-age set to 0, when they are copied to the top level
this change will appear immediately in browsers requesting the file even if they have
requested it before. 

You can see an example of this being used in this PR:
https://github.com/concord-consortium/starter-projects/pull/37

# Develop

> First, you'll need to have a reasonably modern version of `node` handy. This won't work with versions older than 9, for instance.

Install the dependencies  
```bash
$ npm install
```

Build, test, and package for distribution
```bash
$ npm run all
```

## action.yml

The action.yml defines the inputs and output for this action.

See the [documentation](https://help.github.com/en/articles/metadata-syntax-for-github-actions)

## Use new GH Action packages

See the [toolkit documentation](https://github.com/actions/toolkit/blob/master/README.md#packages) for the various packages.

## Publish to a distribution branch

Actions are run from GitHub repos so we need to checkin the packed dist folder.

Then run [ncc](https://github.com/zeit/ncc) and push the results:
```bash
$ npm run all
$ git add dist
$ git commit -a -m "prod dependencies"
$ git push origin releases/v1
```

The action is now published! :rocket:

See the [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)

## Validate

The action is used in this repository by the test job in [test.yml](.github/workflows/test.yml)
Currently this test job does nothing more than just build itself.

See the [actions tab](https://github.com/concord-consortium/s3-deploy-action/actions) for runs of this action.
