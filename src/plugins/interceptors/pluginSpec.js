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

import { createOpenMct, resetApplicationState } from "utils/testing";
import InterceptorPlugin from "./plugin";

describe('the plugin', function () {
    let element;
    let child;
    let openmct;
    const TEST_NAMESPACE = 'test';

    beforeEach((done) => {
        const appHolder = document.createElement('div');
        appHolder.style.width = '640px';
        appHolder.style.height = '480px';

        openmct = createOpenMct();
        openmct.install(new InterceptorPlugin(openmct));

        element = document.createElement('div');
        element.style.width = '640px';
        element.style.height = '480px';
        child = document.createElement('div');
        child.style.width = '640px';
        child.style.height = '480px';
        element.appendChild(child);

        openmct.on('start', done);
        openmct.startHeadless(appHolder);
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    describe('the missingObjectInterceptor', () => {
        let mockProvider;
        beforeEach(() => {
            mockProvider = jasmine.createSpyObj("mock provider", [
                "get"
            ]);
            mockProvider.get.and.returnValue(Promise.resolve(undefined));
            openmct.objects.addProvider(TEST_NAMESPACE, mockProvider);
        });

        it('returns missing objects', (done) => {
            const identifier = {
                namespace: TEST_NAMESPACE,
                key: 'hello'
            };
            openmct.objects.get(identifier).then((testObject) => {
                expect(testObject).toEqual({
                    identifier,
                    type: 'unknown',
                    name: 'Missing: test:hello'
                });
                done();
            });
        });

        it('returns the My items object if not found', (done) => {
            const identifier = {
                namespace: TEST_NAMESPACE,
                key: 'mine'
            };
            openmct.objects.get(identifier).then((testObject) => {
                expect(testObject).toEqual({
                    identifier,
                    "name": "My Items",
                    "type": "folder",
                    "composition": [],
                    "location": "ROOT"
                });
                done();
            });
        });

    });
});
