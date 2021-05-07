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
 * Module defining SearchAggregator. Created by shale on 07/16/2015.
 */
define([

], function (

) {

    /**
     * Aggregates multiple search providers as a singular search provider.
     * Search providers are expected to implement a `query` method which returns
     * a promise for a `modelResults` object.
     *
     * The search aggregator combines the results from multiple providers,
     * removes aggregates, and converts the results to domain objects.
     *
     * @constructor
     * @param $q Angular's $q, for promise consolidation.
     * @param objectService
     * @param {SearchProvider[]} providers The search providers to be
     *        aggregated.
     */
    function SearchAggregator($q, objectService, providers) {
        this.$q = $q;
        this.objectService = objectService;
        this.providers = providers;
    }

    /**
     * If max results is not specified in query, use this as default.
     */
    SearchAggregator.prototype.DEFAULT_MAX_RESULTS = 100;

    /**
     * Because filtering isn't implemented inside each provider, the fudge
     * factor is a multiplier on the number of results returned-- more results
     * than requested will be fetched, and then will be filtered.  This helps
     * provide more predictable pagination when large numbers of results are
     * returned but very few results match filters.
     *
     * If a provider level filter implementation is implemented in the future,
     * remove this.
     */
    SearchAggregator.prototype.FUDGE_FACTOR = 5;

    /**
     * Sends a query to each of the providers. Returns a promise for
     *   a result object that has the format
     *   {hits: searchResult[], total: number}
     *   where a searchResult has the format
     *   {id: string, object: domainObject, score: number}
     *
     * @param {String} inputText The text input that is the query.
     * @param {Number} maxResults (optional) The maximum number of results
     *   that this function should return. If not provided, a
     *   default of 100 will be used.
     * @param {Function} [filter] if provided, will be called for every
     *   potential modelResult.  If it returns false, the model result will be
     *   excluded from the search results.
     * @param {AbortController.signal} abortSignal (optional) can pass in an abortSignal to cancel any
     *   downstream fetch requests.
     * @returns {Promise} A Promise for a search result object.
     */
    SearchAggregator.prototype.query = function (
        inputText,
        maxResults,
        filter,
        abortSignal
    ) {

        var aggregator = this,
            resultPromises;

        if (!maxResults) {
            maxResults = this.DEFAULT_MAX_RESULTS;
        }

        resultPromises = this.providers.map(function (provider) {
            return provider.query(
                inputText,
                maxResults * aggregator.FUDGE_FACTOR
            );
        });

        return this.$q
            .all(resultPromises)
            .then(function (providerResults) {
                var modelResults = {
                    hits: [],
                    total: 0
                };

                providerResults.forEach(function (providerResult) {
                    modelResults.hits =
                        modelResults.hits.concat(providerResult.hits);
                    modelResults.total += providerResult.total;
                });

                modelResults = aggregator.orderByScore(modelResults);
                modelResults = aggregator.applyFilter(modelResults, filter);
                modelResults = aggregator.removeDuplicates(modelResults);

                return aggregator.asObjectResults(modelResults, abortSignal);
            });
    };

    /**
     * Order model results by score descending and return them.
     */
    SearchAggregator.prototype.orderByScore = function (modelResults) {
        modelResults.hits.sort(function (a, b) {
            if (a.score > b.score) {
                return -1;
            } else if (b.score > a.score) {
                return 1;
            } else {
                return 0;
            }
        });

        return modelResults;
    };

    /**
     * Apply a filter to each model result, removing it from search results
     * if it does not match.
     */
    SearchAggregator.prototype.applyFilter = function (modelResults, filter) {
        if (!filter) {
            return modelResults;
        }

        var initialLength = modelResults.hits.length,
            finalLength,
            removedByFilter;

        modelResults.hits = modelResults.hits.filter(function (hit) {
            return filter(hit.model);
        });

        finalLength = modelResults.hits.length;
        removedByFilter = initialLength - finalLength;
        modelResults.total -= removedByFilter;

        return modelResults;
    };

    /**
     * Remove duplicate hits in a modelResults object, and decrement `total`
     * each time a duplicate is removed.
     */
    SearchAggregator.prototype.removeDuplicates = function (modelResults) {
        var includedIds = {};

        modelResults.hits = modelResults
            .hits
            .filter(function alreadyInResults(hit) {
                if (includedIds[hit.id]) {
                    modelResults.total -= 1;

                    return false;
                }

                includedIds[hit.id] = true;

                return true;
            });

        return modelResults;
    };

    /**
     * Convert modelResults to objectResults by fetching them from the object
     * service.
     *
     * @param {Object} modelResults an object containing the results from the search
     * @param {AbortController.signal} abortSignal (optional) abort signal to cancel any
     *   downstream fetch requests
     * @returns {Promise} for an objectResults object.
     */
    SearchAggregator.prototype.asObjectResults = function (modelResults, abortSignal) {
        var objectIds = modelResults.hits.map(function (modelResult) {
            return modelResult.id;
        });

        return this
            .objectService
            .getObjects(objectIds, abortSignal)
            .then(function (objects) {

                var objectResults = {
                    total: modelResults.total
                };

                objectResults.hits = modelResults
                    .hits
                    .map(function asObjectResult(hit) {
                        return {
                            id: hit.id,
                            object: objects[hit.id],
                            score: hit.score
                        };
                    });

                return objectResults;
            });
    };

    return SearchAggregator;
});
