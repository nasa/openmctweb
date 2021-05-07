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

define([], function () {

    /**
     * Navigates away from orphan objects whenever they are detected.
     *
     * An orphan object is an object whose apparent parent does not
     * actually contain it. This may occur in certain circumstances, such
     * as when persistence succeeds for a newly-created object but fails
     * for its parent.
     *
     * @param throttle the `throttle` service
     * @param topic the `topic` service
     * @param navigationService the `navigationService`
     * @constructor
     */
    function OrphanNavigationHandler(throttle, topic, navigationService) {
        var throttledCheckNavigation;

        function getParent(domainObject) {
            var context = domainObject.getCapability('context');

            return context.getParent();
        }

        function preventOrphanNavigation(domainObject) {
            var parent = getParent(domainObject);
            parent.useCapability('composition')
                .then(function (composees) {
                    var isOrphan = composees.every(function (c) {
                        return c.getId() !== domainObject.getId();
                    });
                    if (isOrphan) {
                        parent.getCapability('action').perform('navigate');
                    }
                });
        }

        function checkNavigation() {
            var navigatedObject = navigationService.getNavigation();
            if (navigatedObject && navigatedObject.hasCapability('context')) {
                if (!navigatedObject.getCapability('editor').isEditContextRoot()) {
                    preventOrphanNavigation(navigatedObject);
                }
            }
        }

        throttledCheckNavigation = throttle(checkNavigation);

        navigationService.addListener(throttledCheckNavigation);
        topic('mutation').listen(throttledCheckNavigation);
    }

    return OrphanNavigationHandler;
});
