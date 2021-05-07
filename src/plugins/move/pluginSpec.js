/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
import MoveActionPlugin from './plugin.js';
import MoveAction from './MoveAction.js';
import {
    createOpenMct,
    resetApplicationState,
    getMockObjects
} from 'utils/testing';

describe("The Move Action plugin", () => {

    let openmct;
    let moveAction;
    let childObject;
    let parentObject;
    let anotherParentObject;

    // this setups up the app
    beforeEach((done) => {
        const appHolder = document.createElement('div');
        appHolder.style.width = '640px';
        appHolder.style.height = '480px';

        openmct = createOpenMct();

        childObject = getMockObjects({
            objectKeyStrings: ['folder'],
            overwrite: {
                folder: {
                    name: "Child Folder",
                    identifier: {
                        namespace: "",
                        key: "child-folder-object"
                    }
                }
            }
        }).folder;
        parentObject = getMockObjects({
            objectKeyStrings: ['folder'],
            overwrite: {
                folder: {
                    name: "Parent Folder",
                    composition: [childObject.identifier]
                }
            }
        }).folder;
        anotherParentObject = getMockObjects({
            objectKeyStrings: ['folder'],
            overwrite: {
                folder: {
                    name: "Another Parent Folder"
                }
            }
        }).folder;

        // already installed by default, but never hurts, just adds to context menu
        openmct.install(MoveActionPlugin());

        openmct.on('start', done);
        openmct.startHeadless(appHolder);
    });

    afterEach(() => {
        resetApplicationState(openmct);
    });

    it("should be defined", () => {
        expect(MoveActionPlugin).toBeDefined();
    });

    describe("when moving an object to a new parent and removing from the old parent", () => {

        beforeEach(() => {
            moveAction = new MoveAction(openmct);
            moveAction.addToNewParent(childObject, anotherParentObject);
            moveAction.removeFromOldParent(parentObject, childObject);
        });

        it("the child object's identifier should be in the new parent's composition", () => {
            let newParentChild = anotherParentObject.composition[0];
            expect(newParentChild).toEqual(childObject.identifier);
        });

        it("the child object's identifier should be removed from the old parent's composition", () => {
            let oldParentComposition = parentObject.composition;
            expect(oldParentComposition.length).toEqual(0);
        });
    });

});
