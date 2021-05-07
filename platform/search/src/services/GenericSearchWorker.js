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
 * Module defining GenericSearchWorker. Created by shale on 07/21/2015.
 */
(function () {

    // An array of objects composed of domain object IDs and models
    // {id: domainObject's ID, model: domainObject's model}
    var indexedItems = [],
        TERM_SPLITTER = /[ _*]/;

    function indexItem(id, model) {
        var vector = {
            name: model.name
        };
        vector.cleanName = model.name.trim();
        vector.lowerCaseName = vector.cleanName.toLocaleLowerCase();
        vector.terms = vector.lowerCaseName.split(TERM_SPLITTER);

        indexedItems.push({
            id: id,
            vector: vector,
            model: model,
            type: model.type
        });
    }

    // Helper function for search()
    function convertToTerms(input) {
        var query = {
            exactInput: input
        };
        query.inputClean = input.trim();
        query.inputLowerCase = query.inputClean.toLocaleLowerCase();
        query.terms = query.inputLowerCase.split(TERM_SPLITTER);
        query.exactTerms = query.inputClean.split(TERM_SPLITTER);

        return query;
    }

    /**
     * Gets search results from the indexedItems based on provided search
     *   input. Returns matching results from indexedItems
     *
     * @param data An object which contains:
     *           * input: The original string which we are searching with
     *           * maxResults: The maximum number of search results desired
     *           * queryId: an id identifying this query, will be returned.
     */
    function search(data) {
        // This results dictionary will have domain object ID keys which
        // point to the value the domain object's score.
        var results,
            input = data.input,
            query = convertToTerms(input),
            message = {
                request: 'search',
                results: {},
                total: 0,
                queryId: data.queryId
            },
            matches = {};

        if (!query.inputClean) {
            // No search terms, no results;
            return message;
        }

        // Two phases: find matches, then score matches.
        // Idea being that match finding should be fast, so that future scoring
        // operations process fewer objects.

        query.terms.forEach(function findMatchingItems(term) {
            indexedItems
                .filter(function matchesItem(item) {
                    return item.vector.lowerCaseName.indexOf(term) !== -1;
                })
                .forEach(function trackMatch(matchedItem) {
                    if (!matches[matchedItem.id]) {
                        matches[matchedItem.id] = {
                            matchCount: 0,
                            item: matchedItem
                        };
                    }

                    matches[matchedItem.id].matchCount += 1;
                });
        });

        // Then, score matching items.
        results = Object
            .keys(matches)
            .map(function asMatches(matchId) {
                return matches[matchId];
            })
            .map(function prioritizeExactMatches(match) {
                if (match.item.vector.name === query.exactInput) {
                    match.matchCount += 100;
                } else if (match.item.vector.lowerCaseName
                           === query.inputLowerCase) {
                    match.matchCount += 50;
                }

                return match;
            })
            .map(function prioritizeCompleteTermMatches(match) {
                match.item.vector.terms.forEach(function (term) {
                    if (query.terms.indexOf(term) !== -1) {
                        match.matchCount += 0.5;
                    }
                });

                return match;
            })
            .sort(function compare(a, b) {
                if (a.matchCount > b.matchCount) {
                    return -1;
                }

                if (a.matchCount < b.matchCount) {
                    return 1;
                }

                return 0;
            });

        message.total = results.length;
        message.results = results
            .slice(0, data.maxResults);

        return message;
    }

    self.onmessage = function (event) {
        if (event.data.request === 'index') {
            indexItem(event.data.id, event.data.model);
        } else if (event.data.request === 'search') {
            self.postMessage(search(event.data));
        }
    };
}());
