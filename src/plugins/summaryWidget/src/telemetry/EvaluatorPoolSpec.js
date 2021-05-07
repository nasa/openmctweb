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

define([
    './EvaluatorPool',
    './SummaryWidgetEvaluator'
], function (
    EvaluatorPool,
    SummaryWidgetEvaluator
) {
    describe('EvaluatorPool', function () {
        let pool;
        let openmct;
        let objectA;
        let objectB;

        beforeEach(function () {
            openmct = {
                composition: jasmine.createSpyObj('compositionAPI', ['get']),
                objects: jasmine.createSpyObj('objectAPI', ['observe'])
            };
            openmct.composition.get.and.callFake(function () {
                const compositionCollection = jasmine.createSpyObj(
                    'compositionCollection',
                    [
                        'load',
                        'on',
                        'off'
                    ]
                );
                compositionCollection.load.and.returnValue(Promise.resolve());

                return compositionCollection;
            });
            openmct.objects.observe.and.callFake(function () {
                return function () {};
            });
            pool = new EvaluatorPool(openmct);
            objectA = {
                identifier: {
                    namespace: 'someNamespace',
                    key: 'someKey'
                },
                configuration: {
                    ruleOrder: []
                }
            };
            objectB = {
                identifier: {
                    namespace: 'otherNamespace',
                    key: 'otherKey'
                },
                configuration: {
                    ruleOrder: []
                }
            };
        });

        it('returns new evaluators for different objects', function () {
            const evaluatorA = pool.get(objectA);
            const evaluatorB = pool.get(objectB);
            expect(evaluatorA).not.toBe(evaluatorB);
        });

        it('returns the same evaluator for the same object', function () {
            const evaluatorA = pool.get(objectA);
            const evaluatorB = pool.get(objectA);
            expect(evaluatorA).toBe(evaluatorB);

            const evaluatorC = pool.get(JSON.parse(JSON.stringify(objectA)));
            expect(evaluatorA).toBe(evaluatorC);
        });

        it('returns new evaluator when old is released', function () {
            const evaluatorA = pool.get(objectA);
            const evaluatorB = pool.get(objectA);
            expect(evaluatorA).toBe(evaluatorB);
            pool.release(evaluatorA);
            pool.release(evaluatorB);
            const evaluatorC = pool.get(objectA);
            expect(evaluatorA).not.toBe(evaluatorC);
        });
    });
});
