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

describe("the plugin", () => {
    let openmct;
    let goToFolderAction;
    let mockObjectPath;

    beforeEach((done) => {
        openmct = createOpenMct();

        openmct.on('start', done);
        openmct.startHeadless();

        goToFolderAction = openmct.actions._allActions.goToOriginal;
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    it('installs the go to folder action', () => {
        expect(goToFolderAction).toBeDefined();
    });

    describe('when invoked', () => {

        beforeEach(() => {
            mockObjectPath = [{
                name: 'mock folder',
                type: 'folder',
                identifier: {
                    key: 'mock-folder',
                    namespace: ''
                }
            }];
            spyOn(openmct.objects, 'get').and.returnValue(Promise.resolve({
                identifier: {
                    namespace: '',
                    key: 'test'
                }
            }));
            goToFolderAction.invoke(mockObjectPath);
        });

        it('goes to the original location', () => {
            expect(window.location.href).toContain('context.html#/browse/?tc.mode=fixed&tc.startBound=0&tc.endBound=1&tc.timeSystem=utc');
        });
    });
});
