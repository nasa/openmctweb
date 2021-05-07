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

define(
    ["../src/WorkerService"],
    function (WorkerService) {

        describe("The worker service", function () {
            var mockWindow,
                testWorkers,
                mockWorker,
                mockSharedWorker,
                service;

            beforeEach(function () {
                mockWindow = jasmine.createSpyObj(
                    '$window',
                    ['Worker', 'SharedWorker']
                );
                testWorkers = [
                    {
                        key: 'abc',
                        scriptUrl: 'c.js',
                        bundle: {
                            path: 'a',
                            sources: 'b'
                        }
                    },
                    {
                        key: 'xyz',
                        scriptUrl: 'z.js',
                        bundle: {
                            path: 'x',
                            sources: 'y'
                        }
                    },
                    {
                        key: 'xyz',
                        scriptUrl: 'bad.js',
                        bundle: {
                            path: 'bad',
                            sources: 'bad'
                        }
                    },
                    {
                        key: 'a-shared-worker',
                        shared: true,
                        scriptUrl: 'c.js',
                        bundle: {
                            path: 'a',
                            sources: 'b'
                        }
                    }
                ];
                mockWorker = {};
                mockSharedWorker = {};

                mockWindow.Worker.and.returnValue(mockWorker);
                mockWindow.SharedWorker.and.returnValue(mockSharedWorker);

                service = new WorkerService(mockWindow, testWorkers);
            });

            it("instantiates workers at registered paths", function () {
                expect(service.run('abc')).toBe(mockWorker);
                expect(mockWindow.Worker).toHaveBeenCalledWith('a/b/c.js');
            });

            it("prefers the first worker when multiple keys are found", function () {
                expect(service.run('xyz')).toBe(mockWorker);
                expect(mockWindow.Worker).toHaveBeenCalledWith('x/y/z.js');
            });

            it("allows workers to be shared", function () {
                expect(service.run('a-shared-worker')).toBe(mockSharedWorker);
                expect(mockWindow.SharedWorker)
                    .toHaveBeenCalledWith('a/b/c.js');
            });

            it("returns undefined for unknown workers", function () {
                expect(service.run('def')).toBeUndefined();
            });

        });
    }
);
