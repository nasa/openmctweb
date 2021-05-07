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
    [],
    function () {

        /**
         * @typeDef {object} PartContents
         * @property {string} key If the part is defined as a
         * representation, the key corresponding to the representation.
         * @memberOf platform/commonUI/regions
         */

        /**
         * @typeDef {object} RegionConfiguration
         * @property {string} name A unique name for this region part
         * @property {PartContents} [content] the details of the region being
         * defined
         * @property {Array<string>} [modes] the modes that this region
         * should be included in. Options are 'edit' and 'browse'. By
         * default, will be included in both. Inclusion of regions is
         * determined by policies of category 'region'. By default, the
         * {EditableRegionPolicy} will be applied.
         * @memberOf platform/commonUI/regions
         */

        /**
         * Defines the interface for a screen region. A screen region is a
         * section of the browse an edit screens for an object. Regions are
         * declared in object type definitions.
         * @memberOf platform/commonUI/regions
         * @abstract
         * @constructor
         */
        function Region(configuration) {
            configuration = configuration || {};
            this.name = configuration.name;
            this.content = configuration.content;
            this.modes = configuration.modes;

            this.regions = [];
        }

        /**
         * Adds a sub-region to this region.
         * @param {Region} region the part to add
         * @param {number} [index] the position to insert the region. By default
         * will add to the end
         */
        Region.prototype.addRegion = function (region, index) {
            if (index) {
                this.regions.splice(index, 0, region);
            } else {
                this.regions.push(region);
            }
        };

        /**
         * Removes a sub-region from this region.
         * @param {Region | number | strnig} region The region to
         * remove. If a number, will remove the region at that index. If a
         * string, will remove the region with the matching name. If an
         * object, will attempt to remove that object from the Region
         */
        Region.prototype.removeRegion = function (region) {
            if (typeof region === 'number') {
                this.regions.splice(region, 1);
            } else if (typeof region === 'string') {
                this.regions = this.regions.filter(function (thisRegion) {
                    return thisRegion.name !== region;
                });
            } else {
                this.regions.splice(this.regions.indexOf(region), 1);
            }
        };

        return Region;
    }
);
