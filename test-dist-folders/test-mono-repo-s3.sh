# A set of commands to verify how the s3 command line handles the exclude and include arguments

aws s3 sync ./mono-repo s3://private-models-resources/fake-app/version/v1.0.0 --delete --exclude "*index.html" --exclude "*index-top.html" --dryrun
# (dryrun) upload: mono-repo/sub-folder/test.txt to s3://private-models-resources/fake-app/version/v1.0.0/sub-folder/test.txt
# (dryrun) upload: mono-repo/test.txt to s3://private-models-resources/fake-app/version/v1.0.0/test.txt

aws s3 cp ./mono-repo s3://private-models-resources/fake-app/branch/test-branch --recursive --exclude "*" --include "*index.html" --include "*index-top.html" --cache-control "no-cache, max-age=0" --dryrun
# (dryrun) upload: mono-repo/index-top.html to s3://private-models-resources/fake-app/branch/test-branch/index-top.html
# (dryrun) upload: mono-repo/index.html to s3://private-models-resources/fake-app/branch/test-branch/index.html
# (dryrun) upload: mono-repo/sub-folder/index-top.html to s3://private-models-resources/fake-app/branch/test-branch/sub-folder/index-top.html
# (dryrun) upload: mono-repo/sub-folder/index.html to s3://private-models-resources/fake-app/branch/test-branch/sub-folder/index.html
