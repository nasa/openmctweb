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

import objectUtils from '../api/objects/object-utils.js';

/**
 * Utility functions for getting and setting Open MCT search parameters and navigated object path.
 * Open MCT encodes application state into the "hash" of the url, making it awkward to use standard browser API such
 * as URL for modifying state in the URL. This wraps native API with some utility functions that operate only on the
 * hash section of the URL.
 */

export function setSearchParam(paramName, paramValue) {
    let url = getHashRelativeURL();

    url.searchParams.set(paramName, paramValue);
    setLocationFromUrl(url);
}

export function deleteSearchParam(paramName) {
    let url = getHashRelativeURL();

    url.searchParams.delete(paramName);
    setLocationFromUrl(url);
}

/**
 * Will replace all current search parameters with the ones defined in urlSearchParams
 * @param {URLSearchParams} paramMap
 */
export function setAllSearchParams(newSearchParams) {
    let url = getHashRelativeURL();

    Array.from(url.searchParams.keys()).forEach((key) => url.searchParams.delete(key));

    Array.from(newSearchParams.keys()).forEach(key => {
        url.searchParams.set(key, newSearchParams.get(key));
    });

    setLocationFromUrl(url);
}

export function getSearchParam(paramName) {
    return getAllSearchParams().get(paramName);
}

/**
 * @returns {URLSearchParams} A {@link https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/entries|URLSearchParams}
 * object for accessing all current search parameters
 */
export function getAllSearchParams() {
    return getHashRelativeURL().searchParams;
}

export function getObjectPath() {
    return getHashRelativeURL().pathname;
}

export function setObjectPath(objectPath) {
    let objectPathString;
    let url = getHashRelativeURL();

    if (objectPath instanceof Array) {
        if (objectPath.length > 0 && isDomainObject(objectPath[0])) {
            throw 'setObjectPath must be called with either a string, or an array of Domain Objects';
        }

        objectPathString = objectPath.reduce((pathString, object) => {
            return `${pathString}/${objectUtils.makeKeyString(object.identifier)}`;
        }, '');
    } else {
        objectPathString = objectPath;
    }

    url.pathname = objectPathString;
    setLocationFromUrl(url);
}

function isDomainObject(potentialObject) {
    return potentialObject.identifier === undefined;
}

function setLocationFromUrl(url) {
    window.location.hash = `${url.pathname}${url.search}`;
}

function getHashRelativeURL() {
    return new URL(window.location.hash.substring(1), window.location.origin);
}
