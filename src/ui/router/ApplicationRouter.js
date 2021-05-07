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
/*global module*/

const LocationBar = require('location-bar');
const EventEmitter = require('EventEmitter');

function paramsToObject(searchParams) {
    let params = {};
    for (let [key, value] of searchParams.entries()) {
        if (params[key]) {
            if (!Array.isArray(params[key])) {
                params[key] = [params[key]];
            }

            params[key].push(value);
        } else {
            params[key] = value;
        }
    }

    return params;
}

class ApplicationRouter extends EventEmitter {
    /**
     * events
     * change:params -> notify listeners w/ new, old, and changed.
     * change:path -> notify listeners w/ new, old paths.
     *
     * methods:
     * update(path, params) -> updates path and params at the same time.  Only
     *   updates specified params, other params are not modified.
     * updateParams(newParams) -> update only specified params, leaving rest
     *      intact.  Does not modify path.
     * updatePath(path);

     * route(path, handler);
     * start(); Start routing.
     */
    constructor() {
        super();
        this.routes = [];
        this.started = false;
        this.locationBar = new LocationBar();
    }

    /**
     * start application routing, should be done after handlers are registered.
     */
    start() {
        if (this.started) {
            throw new Error('Router already started!');
        }

        this.started = true;

        this.locationBar.onChange(p => this.handleLocationChange(p));
        this.locationBar.start({
            root: location.pathname
        });
    }

    destroy() {
        this.locationBar.stop();
        this.removeAllListeners();
    }

    handleLocationChange(pathString) {
        if (pathString[0] !== '/') {
            pathString = '/' + pathString;
        }

        let url = new URL(
            pathString,
            `${location.protocol}//${location.host}${location.pathname}`
        );

        let oldLocation = this.currentLocation;

        let newLocation = {
            url: url,
            path: url.pathname,
            queryString: url.search.replace(/^\?/, ''),
            params: paramsToObject(url.searchParams)
        };

        this.currentLocation = newLocation;

        if (!oldLocation) {
            this.doPathChange(newLocation.path, null, newLocation);
            this.doParamsChange(newLocation.params, {}, newLocation);

            return;
        }

        if (oldLocation.path !== newLocation.path) {
            this.doPathChange(
                newLocation.path,
                oldLocation.path,
                this
            );
        }

        if (!_.isEqual(oldLocation.params, newLocation.params)) {
            this.doParamsChange(
                newLocation.params,
                oldLocation.params,
                newLocation
            );
        }
    }

    doPathChange(newPath, oldPath, newLocation) {
        let route = this.routes.filter(r => r.matcher.test(newPath))[0];
        if (route) {
            route.callback(newPath, route.matcher.exec(newPath), this.currentLocation.params);
        }

        this.emit('change:path', newPath, oldPath);
    }

    doParamsChange(newParams, oldParams, newLocation) {
        let changedParams = {};
        Object.entries(newParams).forEach(([key, value]) => {
            if (value !== oldParams[key]) {
                changedParams[key] = value;
            }
        });
        Object.keys(oldParams).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(newParams, key)) {
                changedParams[key] = undefined;
            }
        });
        this.emit('change:params', newParams, oldParams, changedParams);
    }

    /**
     * Update route params.  Takes an object of updates.  New parameters
     */
    updateParams(updateParams) {
        let searchParams = this.currentLocation.url.searchParams;
        Object.entries(updateParams).forEach(([key, value]) => {
            if (typeof value === 'undefined') {
                searchParams.delete(key);
            } else {
                searchParams.set(key, value);
            }
        });
        this.setQueryString(searchParams.toString());
    }

    getParams() {
        return this.currentLocation.params;
    }

    update(path, params) {
        let searchParams = this.currentLocation.url.searchParams;
        for (let [key, value] of Object.entries(params)) {
            if (typeof value === 'undefined') {
                searchParams.delete(key);
            } else {
                searchParams.set(key, value);
            }
        }

        this.set(path, searchParams.toString());
    }

    set(path, queryString) {
        location.hash = `${path}?${queryString}`;
    }

    setQueryString(queryString) {
        this.set(this.currentLocation.path, queryString);
    }

    setPath(path) {
        this.set(path, this.currentLocation.queryString);
    }

    route(matcher, callback) {
        this.routes.push({
            matcher,
            callback
        });
    }
}

module.exports = ApplicationRouter;
