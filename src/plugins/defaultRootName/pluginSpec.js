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
import {
    createOpenMct,
    resetApplicationState
} from 'utils/testing';

xdescribe("the plugin", () => {
    let openmct;
    let compositionAPI;
    let newFolderAction;
    let mockObjectPath;
    let mockDialogService;
    let mockComposition;
    let mockPromise;
    let newFolderName = 'New Folder';

    beforeEach((done) => {
        openmct = createOpenMct();

        openmct.on('start', done);
        openmct.startHeadless();

        newFolderAction = openmct.contextMenu._allActions.filter(action => {
            return action.key === 'newFolder';
        })[0];
    });

    afterEach(() => {
        resetApplicationState(openmct);
    });

    it('installs the new folder action', () => {
        expect(newFolderAction).toBeDefined();
    });

    describe('when invoked', () => {

        beforeEach((done) => {
            compositionAPI = openmct.composition;
            mockObjectPath = [{
                name: 'mock folder',
                type: 'folder',
                identifier: {
                    key: 'mock-folder',
                    namespace: ''
                }
            }];
            mockPromise = {
                then: (callback) => {
                    callback({name: newFolderName});
                    done();
                }
            };

            mockDialogService = jasmine.createSpyObj('dialogService', ['getUserInput']);
            mockComposition = jasmine.createSpyObj('composition', ['add']);

            mockDialogService.getUserInput.and.returnValue(mockPromise);

            spyOn(openmct.$injector, 'get').and.returnValue(mockDialogService);
            spyOn(compositionAPI, 'get').and.returnValue(mockComposition);
            spyOn(openmct.objects, 'mutate');

            newFolderAction.invoke(mockObjectPath);
        });

        it('gets user input for folder name', () => {
            expect(mockDialogService.getUserInput).toHaveBeenCalled();
        });

        it('creates a new folder object', () => {
            expect(openmct.objects.mutate).toHaveBeenCalled();
        });

        it('adds new folder object to parent composition', () => {
            expect(mockComposition.add).toHaveBeenCalled();
        });
    });
});
