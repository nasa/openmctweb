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
 * Module defining SearchController. Created by shale on 07/15/2015.
 */
define(function () {

    /**
     * Controller for search in Tree View.
     *
     * Filtering is currently buggy; it filters after receiving results from
     * search providers, the downside of this is that it requires search
     * providers to provide objects for all possible results, which is
     * potentially a hit to persistence, thus can be very very slow.
     *
     * Ideally, filtering should be handled before loading objects from the persistence
     * store, the downside to this is that filters must be applied to object
     * models, not object instances.
     *
     * @constructor
     * @param $scope
     * @param searchService
     */
    function SearchController($scope, searchService) {
        var controller = this;
        this.$scope = $scope;
        this.$scope.ngModel = this.$scope.ngModel || {};
        this.searchService = searchService;
        this.numberToDisplay = this.RESULTS_PER_PAGE;
        this.availabileResults = 0;
        this.$scope.results = [];
        this.$scope.loading = false;
        this.pendingQuery = undefined;
        this.$scope.ngModel.filter = function () {
            return controller.onFilterChange.apply(controller, arguments);
        };
    }

    SearchController.prototype.RESULTS_PER_PAGE = 20;

    /**
     * Returns true if there are more results than currently displayed for the
     * for the current query and filters.
     */
    SearchController.prototype.areMore = function () {
        return this.$scope.results.length < this.availableResults;
    };

    /**
     * Display more results for the currently displayed query and filters.
     */
    SearchController.prototype.loadMore = function () {
        this.numberToDisplay += this.RESULTS_PER_PAGE;
        this.dispatchSearch();
    };

    /**
     * Reset search results, then search for the query string specified in
     * scope.
     */
    SearchController.prototype.search = function () {
        var inputText = this.$scope.ngModel.input;

        this.clearResults();

        if (inputText) {
            this.$scope.loading = true;
            this.$scope.ngModel.search = true;
        } else {
            this.pendingQuery = undefined;
            this.$scope.ngModel.search = false;
            this.$scope.loading = false;

            return;
        }

        this.dispatchSearch();
    };

    /**
     * Dispatch a search to the search service if it hasn't already been
     * dispatched.
     *
     * @private
     */
    SearchController.prototype.dispatchSearch = function () {
        var inputText = this.$scope.ngModel.input,
            controller = this,
            queryId = inputText + this.numberToDisplay;

        if (this.pendingQuery === queryId) {
            return; // don't issue multiple queries for the same term.
        }

        this.pendingQuery = queryId;

        this
            .searchService
            .query(inputText, this.numberToDisplay, this.filterPredicate())
            .then(function (results) {
                if (controller.pendingQuery !== queryId) {
                    return; // another query in progress, so skip this one.
                }

                controller.onSearchComplete(results);
            });
    };

    SearchController.prototype.filter = SearchController.prototype.onFilterChange;

    /**
     * Refilter results and update visible results when filters have changed.
     */
    SearchController.prototype.onFilterChange = function () {
        this.pendingQuery = undefined;
        this.search();
    };

    /**
     * Returns a predicate function that can be used to filter object models.
     *
     * @private
     */
    SearchController.prototype.filterPredicate = function () {
        if (this.$scope.ngModel.checkAll) {
            return function () {
                return true;
            };
        }

        var includeTypes = this.$scope.ngModel.checked;

        return function (model) {
            return Boolean(includeTypes[model.type]);
        };
    };

    /**
     * Clear the search results.
     *
     * @private
     */
    SearchController.prototype.clearResults = function () {
        this.$scope.results = [];
        this.availableResults = 0;
        this.numberToDisplay = this.RESULTS_PER_PAGE;
    };

    /**
     * Update search results from given `results`.
     *
     * @private
     */
    SearchController.prototype.onSearchComplete = function (results) {
        this.availableResults = results.total;
        this.$scope.results = results.hits;
        this.$scope.loading = false;
        this.pendingQuery = undefined;
    };

    return SearchController;
});
