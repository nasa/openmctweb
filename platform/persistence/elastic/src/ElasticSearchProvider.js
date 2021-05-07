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
 * Module defining ElasticSearchProvider. Created by shale on 07/16/2015.
 */
define([

], function (

) {

    var ID_PROPERTY = '_id',
        SOURCE_PROPERTY = '_source',
        SCORE_PROPERTY = '_score';

    /**
     * A search service which searches through domain objects in
     * the filetree using ElasticSearch.
     *
     * @constructor
     * @param $http Angular's $http service, for working with urls.
     * @param ROOT the constant `ELASTIC_ROOT` which allows us to
     *        interact with ElasticSearch.
     */
    function ElasticSearchProvider($http, ROOT) {
        this.$http = $http;
        this.root = ROOT;
    }

    /**
     * Search for domain objects using elasticsearch as a search provider.
     *
     * @param {String} searchTerm the term to search by.
     * @param {Number} [maxResults] the max number of results to return.
     * @returns {Promise} promise for a modelResults object.
     */
    ElasticSearchProvider.prototype.query = function (searchTerm, maxResults) {
        var searchUrl = this.root + '/_search/',
            params = {},
            provider = this;

        searchTerm = this.cleanTerm(searchTerm);
        searchTerm = this.fuzzyMatchUnquotedTerms(searchTerm);

        params.q = searchTerm;
        params.size = maxResults;

        return this
            .$http({
                method: "GET",
                url: searchUrl,
                params: params
            })
            .then(function success(succesResponse) {
                return provider.parseResponse(succesResponse);
            }, function error() {
                // Gracefully fail.
                return {
                    hits: [],
                    total: 0
                };
            });
    };

    /**
     * Clean excess whitespace from a search term and return the cleaned
     * version.
     *
     * @private
     * @param {string} the search term to clean.
     * @returns {string} search terms cleaned of excess whitespace.
     */
    ElasticSearchProvider.prototype.cleanTerm = function (term) {
        return term.trim().replace(/ +/g, ' ');
    };

    /**
     * Add fuzzy matching markup to search terms that are not quoted.
     *
     * The following:
     *     hello welcome "to quoted village" have fun
     * will become
     *     hello~ welcome~ "to quoted village" have~ fun~
     *
     * @private
     */
    ElasticSearchProvider.prototype.fuzzyMatchUnquotedTerms = function (query) {
        var matchUnquotedSpaces = '\\s+(?=([^"]*"[^"]*")*[^"]*$)',
            matcher = new RegExp(matchUnquotedSpaces, 'g');

        return query
            .replace(matcher, '~ ')
            .replace(/$/, '~')
            .replace(/"~+/, '"');
    };

    /**
     * Parse the response from ElasticSearch and convert it to a
     * modelResults object.
     *
     * @private
     * @param response a ES response object from $http
     * @returns modelResults
     */
    ElasticSearchProvider.prototype.parseResponse = function (response) {
        var results = response.data.hits.hits,
            searchResults = results.map(function (result) {
                return {
                    id: result[ID_PROPERTY],
                    model: result[SOURCE_PROPERTY],
                    score: result[SCORE_PROPERTY]
                };
            });

        return {
            hits: searchResults,
            total: response.data.hits.total
        };
    };

    return ElasticSearchProvider;
});
