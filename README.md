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

## Versioned Release Support 
This action also supports a concept of releasing versions in S3 without copying all the resources. A typical non-S3 version release process would use symlinks, but those are not supported in S3.

Versioned releases are done by copying a special index-top.html file out of the versioned folder up to the top level.

An example folder structure when v1.0.0 has been released would be:
- index.html
- versions
  - v1.0.0
    - index.html
    - index-top.html
    - code.js

### `/index.html` 
This is the released html file. If v1.0.0 is released then `/index.html` is a copy of `/versions/v1.0.0/index-top.html`. The `index-top.html` file cannot be used directly it must be copied to the top before it can be used.

### `/versions/v1.0.0/index.html` 
This file can be used to run the version without copying anything. This is useful when there are multiple deployed versions and only one is released.

The content of `/versions/v1.0.0/index.html` refers to `code.js` using a relative reference of just `code.js`. 

### `/versions/v1.0.0/index-top.html`
This file is copied when doing a release. Its content refers to `code.js` using a relative reference of `versions/v1.0.0/code.js`. This is why `index-top.html` needs to be copied before it can work.

`s3-deploy-action` makes building the `index-top.html` possible by providing a `DEPLOY_PATH` environment variable when it runs the build command. When `s3-deploy-action` is deploying the tag `v1.0.0` it will set this to `DEPLOY_PATH=versions/v1.0.0`.

If you are using Webpack's HtmlWebpackPlugin to build your index-top.html file you can make this work by configuring HtmlWebpackPlugin with `publicPath: process.env.DEPLOY_PATH`.

One issue you will have to deal with when using the versioned approach is when code.js loads its own resources. It might load json files or icons. By default if it uses relative paths to do this, these paths will be relative to the html file not the js file. If you are using Webpack, it has a `publicPath:auto` option which takes care of this. This is a different `publicPath` than the one for HtmlWebpackPlugin. As long as all resources are accessed via `import` webpack will take care of loading them relative to the location of `code.js`. 

**TODO** make a separate doc about using webpack. A good bit of doc to start with is here: https://github.com/concord-consortium/starter-projects/blob/b2f267ee0a4fff52a60f55132d9d70ee4825ae7f/doc/deploy.md 

### Caching
Because the index files have their max-age set to 0, when they are copied to the top level this change will appear immediately in browsers requesting the file even if they have requested it before.

## Top Branches
Because the released index.html changes the path javascript uses to access assets, you won't see issues caused by this when using a file like `branch/main/index.html`. To make it possible to test this in advance, `s3-deploy-action` supports something called 'top branches'.

A simple configuration of this is:

```
- uses: concord-consortium/s3-deploy-action@v1
  with:
    bucket: models-resources
    prefix: name-of-project
    awsAccessKeyId: ${{ secrets.AWS_ACCESS_KEY_ID }}
    awsSecretAccessKey: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    topBranches: >
      [ "main" ]
```

If `topBranches` is specified, the action assumes there will be an an `index-top.html` file. This `index-top.html` should follow the approach described above to reference its dependencies. 

When one of the branches listed in `topBranches` is deployed, the action will automatically copy the `index-top.html` file to the top level and rename it with the branch name. So in the configuration above, if the main branch is pushed, `/branch/main/index-top.html` will be copied to `/index-main.html`.

Now `/index-main.html` can be opened and you can make sure that all of the assets are loading properly.

Because the index files have their max-age set to 0, when they are copied to the top level this change will appear immediately in browsers requesting the file even if they have requested it before. 

You can see an example of this being used in this PR:
https://github.com/concord-consortium/starter-projects/pull/37

## Mono Repo Support
This action supports certain mono-repo setups.  In particular if your repo generates a top level index.html file that refers to sub folder index.html files. The action will copy all files that match index.html or index-top.html to S3 with max-age of 0. So this includes files in sub folders. 

To support releasing versions, the `sub-folder/index-top.html` files need to have relative paths to their resources which will work when the file is copied to the top level. Here is an example folder structure when v1.0.0 is released:
- index.html (copy of version/v1.0.0/index-top.html)
- sub-folder
  - index.html (copy of version/v1.0.0/sub-folder/index-top.html)
- version
  - v1.0.0
    - index.html
    - index-top.html
    - sub-folder
      - index.html
      - index-top.html
      - code.js

So this means that the reference to the code.js in sub-folder/index-top.html should be `../version/v1.0.0/sub-folder/code.js`

If you are using webpack's HtmlWebpackPlugin to build the `sub-folder/index-top.html`, you can set `` publicPath: `../${DEPLOY_PATH}/sub-folder` ``. When the project is built by s3-deploy-action DEPLOY_PATH will be set to `version/v1.0.0`.

### Top Branch Support in Mono Repos
s3-deploy-action supports top branches in mono repos by copying all `index-top.html` files to the top level and renaming them `index-[branch name].html`. It will do this regardless of what level the index-top.html is at. 

For example:
- index-main.html (copy of branch/main/index-top.html)
- sub-folder
  - index-main.html (copy of branch/main/sub-folder/index-top.html)
- branch
  - main
    - index.html
    - index-top.html
    - sub-folder
      - index.html
      - index-top.html
      - code.js

However for this to work, it means that the top-level index-top.html file needs to figure out that it should be referencing `sub-folder/index-main.html`. This same index-top.html file has to work when it is built for a version, and then copied to the top level. 

There are a few ways to support this. One of them is to have some javascript in this file which looks at its own URL. If the file name is `index-[something].html` then it should update the references in its dom to be `sub-folder/index-[something].html`.

Another option is for the build system to identify that this is a branch build instead of a version build. It can do this by checking the `DEPLOY_PATH` environment variable. For version builds it uses `sub-folder/index.html` for branch builds it uses `sub-folder/index-[branch].html`.

# Deploy Path Only Action

This repository also contains an action which just computes the deploy path. It doesn't build or deploy anything. This is useful if you want to build your code in one job and then reuse that built code for all of your testing and then deploy the same code that you tested.

A typical way to use this action is:

```
- uses: concord-consortium/s3-deploy-action/deploy-path@v1
  id: s3-deploy-path
- name: Build
  run: npm run build
  env:
    DEPLOY_PATH: ${{ steps.s3-deploy-path.outputs.deployPath }}
```



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

## Tests
The final tests of `main.test.ts` run the built version of the actions. So in order for this test to pass you need to run `npm run package` before running `npm run test`.

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
