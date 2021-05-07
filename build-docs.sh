#!/bin/bash

#*****************************************************************************
#* Open MCT, Copyright (c) 2014-2021, United States Government
#* as represented by the Administrator of the National Aeronautics and Space
#* Administration. All rights reserved.
#*
#* Open MCT is licensed under the Apache License, Version 2.0 (the
#* "License"); you may not use this file except in compliance with the License.
#* You may obtain a copy of the License at
#* http://www.apache.org/licenses/LICENSE-2.0.
#*
#* Unless required by applicable law or agreed to in writing, software
#* distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
#* WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
#* License for the specific language governing permissions and limitations
#* under the License.
#*
#* Open MCT includes source code licensed under additional open source
#* licenses. See the Open Source Licenses file (LICENSES.md) included with
#* this source code distribution or the Licensing information page available
#* at runtime from the About dialog for additional information.
#*****************************************************************************

# Script to build and deploy docs.

OUTPUT_DIRECTORY="dist/docs"
# Docs, once built, are pushed to the private website repo
REPOSITORY_URL="git@github.com:nasa/openmct-website.git"
WEBSITE_DIRECTORY="website"

BUILD_SHA=`git rev-parse HEAD`

# A remote will be created for the git repository we are pushing to.
# Don't worry, as this entire directory will get trashed in between builds.
REMOTE_NAME="documentation"
WEBSITE_BRANCH="master"

# Clean output directory, JSDOC will recreate
if [ -d $OUTPUT_DIRECTORY ]; then
    rm -rf $OUTPUT_DIRECTORY || exit 1
fi

npm run docs

echo "git clone $REPOSITORY_URL website"
git clone $REPOSITORY_URL website || exit 1
echo "cp -r $OUTPUT_DIRECTORY $WEBSITE_DIRECTORY"
cp -r $OUTPUT_DIRECTORY $WEBSITE_DIRECTORY
echo "cd $WEBSITE_DIRECTORY"
cd $WEBSITE_DIRECTORY || exit 1

# Configure github for CircleCI user.
git config user.email "buildbot@circleci.com"
git config user.name "BuildBot"

echo "git add ."
git add .
echo "git commit -m \"Docs updated from build $BUILD_SHA\""
git commit -m "Docs updated from build $BUILD_SHA"
# Push to the website repo
git push
