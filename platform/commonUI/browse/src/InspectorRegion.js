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

define(
    [
        '../../regions/src/Region'
    ],
    function (Region) {

        /**
         * Defines the a default Inspector region. Captured in a class to
         * allow for modular extension and customization of regions based on
         * the typical case.
         * @memberOf platform/commonUI/regions
         * @constructor
         */
        function InspectorRegion() {
            Region.call(this, {'name': 'Inspector'});

            this.buildRegion();
        }

        InspectorRegion.prototype = Object.create(Region.prototype);
        InspectorRegion.prototype.constructor = Region;

        /**
         * @private
         */
        InspectorRegion.prototype.buildRegion = function () {
            var metadataRegion = {
                name: 'metadata',
                title: 'Metadata Region',
                // Which modes should the region part be visible in? If
                // nothing provided here, then assumed that part is visible
                // in both. The visibility or otherwise of a region part
                // should be decided by a policy. In this case, 'modes' is a
                // shortcut that is used by the EditableRegionPolicy.
                modes: ['browse', 'edit'],
                content: {
                    key: 'object-properties'
                }
            };
            this.addRegion(new Region(metadataRegion), 0);
        };

        return InspectorRegion;
    }
);
