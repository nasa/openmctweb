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
define([
    './Model'
], function (
    Model
) {

    /**
     * TODO: doc strings.
     */
    const LegendModel = Model.extend({
        listenToSeriesCollection: function (seriesCollection) {
            this.seriesCollection = seriesCollection;
            this.listenTo(this.seriesCollection, 'add', this.setHeight, this);
            this.listenTo(this.seriesCollection, 'remove', this.setHeight, this);
            this.listenTo(this, 'change:expanded', this.setHeight, this);
            this.set('expanded', this.get('expandByDefault'));
        },
        setHeight: function () {
            const expanded = this.get('expanded');
            if (this.get('position') !== 'top') {
                this.set('height', '0px');
            } else {
                this.set('height', expanded ? (20 * (this.seriesCollection.size() + 1) + 40) + 'px' : '21px');
            }
        },
        defaults: function (options) {
            return {
                position: 'top',
                expandByDefault: false,
                hideLegendWhenSmall: false,
                valueToShowWhenCollapsed: 'nearestValue',
                showTimestampWhenExpanded: true,
                showValueWhenExpanded: true,
                showMaximumWhenExpanded: true,
                showMinimumWhenExpanded: true,
                showUnitsWhenExpanded: true
            };
        }
    });

    return LegendModel;
});
