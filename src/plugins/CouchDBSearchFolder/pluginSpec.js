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

import {createOpenMct, resetApplicationState} from "utils/testing";
import CouchDBSearchFolderPlugin from './plugin';

describe('the plugin', function () {
    let identifier = {
        namespace: 'couch-search',
        key: "couch-search"
    };
    let testPath = '/test/db';
    let openmct;
    let composition;

    beforeEach((done) => {

        openmct = createOpenMct();

        let couchPlugin = openmct.plugins.CouchDB(testPath);
        openmct.install(couchPlugin);

        openmct.install(new CouchDBSearchFolderPlugin('CouchDB Documents', couchPlugin, {
            "selector": {
                "model": {
                    "type": "plan"
                }
            }
        }));

        openmct.on('start', done);
        openmct.startHeadless();

        composition = openmct.composition.get({identifier});

        spyOn(couchPlugin.couchProvider, 'getObjectsByFilter').and.returnValue(Promise.resolve([
            {
                identifier: {
                    key: "1",
                    namespace: "mct"
                }
            },
            {
                identifier: {
                    key: "2",
                    namespace: "mct"
                }
            }
        ]));
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    it('provides a folder to hold plans', () => {
        openmct.objects.get(identifier).then((object) => {
            expect(object).toEqual({
                identifier,
                type: 'folder',
                name: "CouchDB Documents"
            });
        });
    });

    it('provides composition for couch search folders', () => {
        composition.load().then((objects) => {
            expect(objects.length).toEqual(2);
        });
    });

});
