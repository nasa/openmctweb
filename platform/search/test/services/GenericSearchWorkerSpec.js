/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * 'License'); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

/**
 *  SearchSpec. Created by shale on 07/31/2015.
 */
define([
    "raw-loader!../../src/services/GenericSearchWorker.js"
], function (
    GenericSearchWorkerText
) {

    var WORKER_FILE = URL.createObjectURL(new Blob(
        [GenericSearchWorkerText],
        {type: 'application/javascript'}
    ));

    describe('GenericSearchWorker', function () {
        // If this test fails, make sure this path is correct
        var worker,
            objectX,
            objectY,
            objectZ,
            itemsToIndex;

        beforeEach(function () {
            worker = new Worker(WORKER_FILE);

            objectX = {
                id: 'x',
                model: {name: 'object xx'}
            };
            objectY = {
                id: 'y',
                model: {name: 'object yy'}
            };
            objectZ = {
                id: 'z',
                model: {name: 'object zz'}
            };
            itemsToIndex = [
                objectX,
                objectY,
                objectZ
            ];

            itemsToIndex.forEach(function (item) {
                worker.postMessage({
                    request: 'index',
                    id: item.id,
                    model: item.model
                });
            });
        });

        afterEach(function () {
            worker.terminate();
        });

        it('returns search results for partial term matches', function (done) {
            worker.addEventListener('message', function (message) {
                var data = message.data;
                expect(data.request).toBe('search');
                expect(data.total).toBe(3);
                expect(data.queryId).toBe(123);
                expect(data.results.length).toBe(3);
                expect(data.results[0].item.id).toBe('x');
                expect(data.results[0].item.model).toEqual(objectX.model);
                expect(data.results[0].matchCount).toBe(1);
                expect(data.results[1].item.id).toBe('y');
                expect(data.results[1].item.model).toEqual(objectY.model);
                expect(data.results[1].matchCount).toBe(1);
                expect(data.results[2].item.id).toBe('z');
                expect(data.results[2].item.model).toEqual(objectZ.model);
                expect(data.results[2].matchCount).toBe(1);

                done();
            });

            worker.postMessage({
                request: 'search',
                input: 'obj',
                maxResults: 100,
                queryId: 123
            });
        });

        it('scores exact term matches higher', function (done) {
            worker.addEventListener('message', function (message) {
                expect(message.data.queryId).toBe(234);
                expect(message.data.results.length).toBe(3);
                expect(message.data.results[0].item.id).toBe('x');
                expect(message.data.results[0].matchCount).toBe(1.5);

                done();
            });

            worker.postMessage({
                request: 'search',
                input: 'object',
                maxResults: 100,
                queryId: 234
            });
        });

        it('can find partial term matches', function (done) {
            worker.addEventListener('message', function (message) {
                expect(message.data.queryId).toBe(345);
                expect(message.data.results.length).toBe(1);
                expect(message.data.results[0].item.id).toBe('x');
                expect(message.data.results[0].matchCount).toBe(1);

                done();
            });

            worker.postMessage({
                request: 'search',
                input: 'x',
                maxResults: 100,
                queryId: 345
            });
        });

        it('matches individual terms', function (done) {
            worker.addEventListener('message', function (message) {
                var data = message.data;

                expect(data.queryId).toBe(456);
                expect(data.results.length).toBe(3);
                expect(data.results[0].item.id).toBe('x');
                expect(data.results[0].matchCount).toBe(1);
                expect(data.results[1].item.id).toBe('y');
                expect(data.results[1].matchCount).toBe(1);
                expect(data.results[2].item.id).toBe('z');
                expect(data.results[1].matchCount).toBe(1);

                done();
            });

            worker.postMessage({
                request: 'search',
                input: 'x y z',
                maxResults: 100,
                queryId: 456
            });
        });

        it('scores exact matches highest', function (done) {
            worker.addEventListener('message', function (message) {
                var data = message.data;

                expect(data.queryId).toBe(567);
                expect(data.results.length).toBe(3);
                expect(data.results[0].item.id).toBe('x');
                expect(data.results[0].matchCount).toBe(103);
                expect(data.results[1].matchCount).toBe(1.5);
                expect(data.results[2].matchCount).toBe(1.5);

                done();
            });

            worker.postMessage({
                request: 'search',
                input: 'object xx',
                maxResults: 100,
                queryId: 567
            });
        });

        it('scores multiple term match above single match', function () {
            worker.addEventListener('message', function (message) {
                var data = message.data;

                expect(data.queryId).toBe(678);
                expect(data.results.length).toBe(3);
                expect(data.results[0].item.id).toBe('x');
                expect(data.results[0].matchCount).toBe(2);
                expect(data.results[1].matchCount).toBe(1);
                expect(data.results[2].matchCount).toBe(1);
            });

            worker.postMessage({
                request: 'search',
                input: 'obj x',
                maxResults: 100,
                queryId: 678
            });
        });
    });
});
