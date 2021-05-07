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
    '../../src/controllers/SearchController'
], function (
    SearchController
) {

    describe('The search controller', function () {
        var mockScope,
            mockSearchService,
            mockPromise,
            mockSearchResult,
            mockDomainObject,
            mockTypes,
            controller;

        function bigArray(size) {
            var array = [],
                i;
            for (i = 0; i < size; i += 1) {
                array.push(mockSearchResult);
            }

            return array;
        }

        beforeEach(function () {
            mockScope = jasmine.createSpyObj(
                '$scope',
                ['$watch']
            );
            mockScope.ngModel = {};
            mockScope.ngModel.input = 'test input';
            mockScope.ngModel.checked = {};
            mockScope.ngModel.checked['mock.type'] = true;
            mockScope.ngModel.checkAll = true;

            mockSearchService = jasmine.createSpyObj(
                'searchService',
                ['query']
            );
            mockPromise = jasmine.createSpyObj(
                'promise',
                ['then']
            );
            mockSearchService.query.and.returnValue(mockPromise);

            mockTypes = [{
                key: 'mock.type',
                name: 'Mock Type',
                cssClass: 'icon-object-unknown'
            }];

            mockSearchResult = jasmine.createSpyObj(
                'searchResult',
                ['']
            );
            mockDomainObject = jasmine.createSpyObj(
                'domainObject',
                ['getModel']
            );
            mockSearchResult.object = mockDomainObject;
            mockDomainObject.getModel.and.returnValue({
                name: 'Mock Object',
                type: 'mock.type'
            });

            controller = new SearchController(mockScope, mockSearchService, mockTypes);
            controller.search();
        });

        it('has a default number of results per page', function () {
            expect(controller.RESULTS_PER_PAGE).toBe(20);
        });

        it('sends queries to the search service', function () {
            expect(mockSearchService.query).toHaveBeenCalledWith(
                'test input',
                controller.RESULTS_PER_PAGE,
                jasmine.any(Function)
            );
        });

        describe('filter query function', function () {
            it('returns true when all types allowed', function () {
                mockScope.ngModel.checkAll = true;
                controller.onFilterChange();
                var filterFn = mockSearchService.query.calls.mostRecent().args[2];
                expect(filterFn('askbfa')).toBe(true);
            });

            it('returns true only for matching checked types', function () {
                mockScope.ngModel.checkAll = false;
                controller.onFilterChange();
                var filterFn = mockSearchService.query.calls.mostRecent().args[2];
                expect(filterFn({type: 'mock.type'})).toBe(true);
                expect(filterFn({type: 'other.type'})).toBe(false);
            });
        });

        it('populates the results with results from the search service', function () {
            expect(mockPromise.then).toHaveBeenCalledWith(jasmine.any(Function));
            mockPromise.then.calls.mostRecent().args[0]({hits: ['a']});

            expect(mockScope.results.length).toBe(1);
            expect(mockScope.results).toContain('a');
        });

        it('is loading until the service\'s promise fulfills', function () {
            expect(mockScope.loading).toBeTruthy();

            // Then resolve the promises
            mockPromise.then.calls.mostRecent().args[0]({hits: []});
            expect(mockScope.loading).toBeFalsy();
        });

        it('detects when there are more results', function () {
            mockPromise.then.calls.mostRecent().args[0]({
                hits: bigArray(controller.RESULTS_PER_PAGE),
                total: controller.RESULTS_PER_PAGE + 5
            });

            expect(mockScope.results.length).toBe(controller.RESULTS_PER_PAGE);
            expect(controller.areMore()).toBeTruthy();

            controller.loadMore();

            expect(mockSearchService.query).toHaveBeenCalledWith(
                'test input',
                controller.RESULTS_PER_PAGE * 2,
                jasmine.any(Function)
            );

            mockPromise.then.calls.mostRecent().args[0]({
                hits: bigArray(controller.RESULTS_PER_PAGE + 5),
                total: controller.RESULTS_PER_PAGE + 5
            });

            expect(mockScope.results.length)
                .toBe(controller.RESULTS_PER_PAGE + 5);

            expect(controller.areMore()).toBe(false);
        });

        it('sets the ngModel.search flag', function () {
            // Flag should be true with nonempty input
            expect(mockScope.ngModel.search).toEqual(true);

            // Flag should be false with empty input
            mockScope.ngModel.input = '';
            controller.search();
            mockPromise.then.calls.mostRecent().args[0]({
                hits: [],
                total: 0
            });
            expect(mockScope.ngModel.search).toEqual(false);

            // Both the empty string and undefined should be 'empty input'
            mockScope.ngModel.input = undefined;
            controller.search();
            mockPromise.then.calls.mostRecent().args[0]({
                hits: [],
                total: 0
            });
            expect(mockScope.ngModel.search).toEqual(false);
        });

        it('attaches a filter function to scope', function () {
            expect(mockScope.ngModel.filter).toEqual(jasmine.any(Function));
        });
    });
});
