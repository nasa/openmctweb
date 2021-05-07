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

/**
 *  SearchSpec. Created by shale on 07/31/2015.
 */
define([
    "../../src/services/SearchAggregator"
], function (SearchAggregator) {

    xdescribe("SearchAggregator", function () {
        var $q,
            objectService,
            providers,
            aggregator;

        beforeEach(function () {
            $q = jasmine.createSpyObj(
                '$q',
                ['all']
            );
            $q.all.and.returnValue(Promise.resolve([]));
            objectService = jasmine.createSpyObj(
                'objectService',
                ['getObjects']
            );
            providers = [];
            aggregator = new SearchAggregator($q, objectService, providers);
        });

        it("has a fudge factor", function () {
            expect(aggregator.FUDGE_FACTOR).toBe(5);
        });

        it("has default max results", function () {
            expect(aggregator.DEFAULT_MAX_RESULTS).toBe(100);
        });

        it("can order model results by score", function () {
            var modelResults = {
                    hits: [
                        {score: 1},
                        {score: 23},
                        {score: 11}
                    ]
                },
                sorted = aggregator.orderByScore(modelResults);

            expect(sorted.hits).toEqual([
                {score: 23},
                {score: 11},
                {score: 1}
            ]);
        });

        it('filters results without a function', function () {
            var modelResults = {
                    hits: [
                        {thing: 1},
                        {thing: 2}
                    ],
                    total: 2
                },
                filtered = aggregator.applyFilter(modelResults);

            expect(filtered.hits).toEqual([
                {thing: 1},
                {thing: 2}
            ]);

            expect(filtered.total).toBe(2);
        });

        it('filters results with a function', function () {
            const modelResults = {
                hits: [
                    {model: {thing: 1}},
                    {model: {thing: 2}},
                    {model: {thing: 3}}
                ],
                total: 3
            };
            let filtered = aggregator.applyFilter(modelResults, filterFunc);

            function filterFunc(model) {
                return model.thing < 2;
            }

            expect(filtered.hits).toEqual([
                {model: {thing: 1}}
            ]);
            expect(filtered.total).toBe(1);
        });

        it('can remove duplicates', function () {
            var modelResults = {
                    hits: [
                        {id: 15},
                        {id: 23},
                        {id: 14},
                        {id: 23}
                    ],
                    total: 4
                },
                deduped = aggregator.removeDuplicates(modelResults);

            expect(deduped.hits).toEqual([
                {id: 15},
                {id: 23},
                {id: 14}
            ]);
            expect(deduped.total).toBe(3);
        });

        it('can convert model results to object results', function () {
            var modelResults = {
                    hits: [
                        {
                            id: 123,
                            score: 5
                        },
                        {
                            id: 234,
                            score: 1
                        }
                    ],
                    total: 2
                },
                objects = {
                    123: '123-object-hey',
                    234: '234-object-hello'
                };

            objectService.getObjects.and.returnValue(Promise.resolve(objects));

            return aggregator
                .asObjectResults(modelResults)
                .then(function (objectResults) {
                    expect(objectResults).toEqual({
                        hits: [
                            {
                                id: 123,
                                score: 5,
                                object: '123-object-hey'
                            },
                            {
                                id: 234,
                                score: 1,
                                object: '234-object-hello'
                            }
                        ],
                        total: 2
                    });
                });
        });

        it('can send queries to providers', function () {
            var provider = jasmine.createSpyObj(
                'provider',
                ['query']
            );
            provider.query.and.returnValue('i prooomise!');
            providers.push(provider);

            aggregator.query('find me', 123, 'filter');
            expect(provider.query)
                .toHaveBeenCalledWith(
                    'find me',
                    123 * aggregator.FUDGE_FACTOR
                );
            expect($q.all).toHaveBeenCalledWith(['i prooomise!']);
        });

        it('supplies max results when none is provided', function () {
            var provider = jasmine.createSpyObj(
                'provider',
                ['query']
            );
            providers.push(provider);
            aggregator.query('find me');
            expect(provider.query).toHaveBeenCalledWith(
                'find me',
                aggregator.DEFAULT_MAX_RESULTS * aggregator.FUDGE_FACTOR
            );
        });

        it('can combine responses from multiple providers', function () {
            var providerResponses = [
                {
                    hits: [
                        'oneHit',
                        'twoHit'
                    ],
                    total: 2
                },
                {
                    hits: [
                        'redHit',
                        'blueHit',
                        'by',
                        'Pete'
                    ],
                    total: 4
                }
            ];

            $q.all.and.returnValue(Promise.resolve(providerResponses));
            spyOn(aggregator, 'orderByScore').and.returnValue('orderedByScore!');
            spyOn(aggregator, 'applyFilter').and.returnValue('filterApplied!');
            spyOn(aggregator, 'removeDuplicates')
                .and.returnValue('duplicatesRemoved!');
            spyOn(aggregator, 'asObjectResults').and.returnValue('objectResults');

            return aggregator
                .query('something', 10, 'filter')
                .then(function (objectResults) {
                    expect(aggregator.orderByScore).toHaveBeenCalledWith({
                        hits: [
                            'oneHit',
                            'twoHit',
                            'redHit',
                            'blueHit',
                            'by',
                            'Pete'
                        ],
                        total: 6
                    });
                    expect(aggregator.applyFilter)
                        .toHaveBeenCalledWith('orderedByScore!', 'filter');
                    expect(aggregator.removeDuplicates)
                        .toHaveBeenCalledWith('filterApplied!');
                    expect(aggregator.asObjectResults)
                        .toHaveBeenCalledWith('duplicatesRemoved!');

                    expect(objectResults).toBe('objectResults');
                });
        });

    });
});
