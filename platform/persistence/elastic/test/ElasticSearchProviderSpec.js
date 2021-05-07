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
    '../src/ElasticSearchProvider'
], function (
    ElasticSearchProvider
) {

    describe('ElasticSearchProvider', function () {
        var $http,
            ROOT,
            provider;

        beforeEach(function () {
            $http = jasmine.createSpy('$http');
            ROOT = 'http://localhost:9200';

            provider = new ElasticSearchProvider($http, ROOT);
        });

        describe('query', function () {
            beforeEach(function () {
                spyOn(provider, 'cleanTerm').and.returnValue('cleanedTerm');
                spyOn(provider, 'fuzzyMatchUnquotedTerms').and.returnValue('fuzzy');
                spyOn(provider, 'parseResponse').and.returnValue('parsedResponse');
                $http.and.returnValue(Promise.resolve({
                    data: {
                        hits: {
                            hits: []
                        }
                    }
                }));
            });

            it('cleans terms and adds fuzzyness', function () {
                return provider.query('hello', 10)
                    .then(() => {
                        expect(provider.cleanTerm).toHaveBeenCalledWith('hello');
                        expect(provider.fuzzyMatchUnquotedTerms)
                            .toHaveBeenCalledWith('cleanedTerm');
                    });
            });

            it('calls through to $http', function () {
                return provider.query('hello', 10).then(() => {
                    expect($http).toHaveBeenCalledWith({
                        method: 'GET',
                        params: {
                            q: 'fuzzy',
                            size: 10
                        },
                        url: 'http://localhost:9200/_search/'
                    });
                });
            });

            it('gracefully fails when http fails', function () {
                $http.and.returnValue(Promise.reject());

                return provider
                    .query('hello', 10)
                    .then(function (results) {
                        expect(results).toEqual({
                            hits: [],
                            total: 0
                        });
                    });
            });

            it('parses and returns when http succeeds', function () {
                $http.and.returnValue(Promise.resolve('successResponse'));

                return provider
                    .query('hello', 10)
                    .then(function (results) {
                        expect(provider.parseResponse)
                            .toHaveBeenCalledWith('successResponse');
                        expect(results).toBe('parsedResponse');
                    });
            });
        });

        it('can clean terms', function () {
            expect(provider.cleanTerm('   asdhs  ')).toBe('asdhs');
            expect(provider.cleanTerm('  and some    words'))
                .toBe('and some words');
            expect(provider.cleanTerm('Nice input')).toBe('Nice input');
        });

        it('can create fuzzy term matchers', function () {
            expect(provider.fuzzyMatchUnquotedTerms('pwr dvc 43'))
                .toBe('pwr~ dvc~ 43~');

            expect(provider.fuzzyMatchUnquotedTerms(
                'hello welcome "to quoted village" have fun'
            )).toBe(
                'hello~ welcome~ "to quoted village" have~ fun~'
            );
        });

        it('can parse responses', function () {
            var elasticSearchResponse = {
                data: {
                    hits: {
                        total: 2,
                        hits: [
                            {
                                '_id': 'hit1Id',
                                '_source': 'hit1Model',
                                '_score': 0.56
                            },
                            {
                                '_id': 'hit2Id',
                                '_source': 'hit2Model',
                                '_score': 0.34
                            }
                        ]
                    }
                }
            };

            expect(provider.parseResponse(elasticSearchResponse))
                .toEqual({
                    hits: [
                        {
                            id: 'hit1Id',
                            model: 'hit1Model',
                            score: 0.56
                        },
                        {
                            id: 'hit2Id',
                            model: 'hit2Model',
                            score: 0.34
                        }
                    ],
                    total: 2
                });
        });
    });

});
