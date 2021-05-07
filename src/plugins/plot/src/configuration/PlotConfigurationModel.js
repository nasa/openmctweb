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
    './Collection',
    './Model',
    './SeriesCollection',
    './XAxisModel',
    './YAxisModel',
    './LegendModel',
    'lodash'
], function (
    Collection,
    Model,
    SeriesCollection,
    XAxisModel,
    YAxisModel,
    LegendModel,
    _
) {

    /**
     * PlotConfiguration model stores the configuration of a plot and some
     * limited state.  The indiidual parts of the plot configuration model
     * handle setting defaults and updating in response to various changes.
     *
     */
    const PlotConfigurationModel = Model.extend({

        /**
         * Initializes all sub models and then passes references to submodels
         * to those that need it.
         */
        initialize: function (options) {
            this.openmct = options.openmct;

            this.xAxis = new XAxisModel({
                model: options.model.xAxis,
                plot: this,
                openmct: options.openmct
            });
            this.yAxis = new YAxisModel({
                model: options.model.yAxis,
                plot: this,
                openmct: options.openmct
            });
            this.legend = new LegendModel({
                model: options.model.legend,
                plot: this,
                openmct: options.openmct
            });
            this.series = new SeriesCollection({
                models: options.model.series,
                plot: this,
                openmct: options.openmct
            });

            if (this.get('domainObject').type === 'telemetry.plot.overlay') {
                this.removeMutationListener = this.openmct.objects.observe(
                    this.get('domainObject'),
                    '*',
                    this.updateDomainObject.bind(this)
                );
            }

            this.yAxis.listenToSeriesCollection(this.series);
            this.legend.listenToSeriesCollection(this.series);

            this.listenTo(this, 'destroy', this.onDestroy, this);
        },
        /**
         * Retrieve the persisted series config for a given identifier.
         */
        getPersistedSeriesConfig: function (identifier) {
            const domainObject = this.get('domainObject');
            if (!domainObject.configuration || !domainObject.configuration.series) {
                return;
            }

            return domainObject.configuration.series.filter(function (seriesConfig) {
                return seriesConfig.identifier.key === identifier.key
                    && seriesConfig.identifier.namespace === identifier.namespace;
            })[0];
        },
        /**
         * Retrieve the persisted filters for a given identifier.
         */
        getPersistedFilters: function (identifier) {
            const domainObject = this.get('domainObject');
            const keystring = this.openmct.objects.makeKeyString(identifier);

            if (!domainObject.configuration || !domainObject.configuration.filters) {
                return;
            }

            return domainObject.configuration.filters[keystring];
        },
        /**
         * Update the domain object with the given value.
         */
        updateDomainObject: function (domainObject) {
            this.set('domainObject', domainObject);
        },
        /**
         * Clean up all objects and remove all listeners.
         */
        onDestroy: function () {
            this.xAxis.destroy();
            this.yAxis.destroy();
            this.series.destroy();
            this.legend.destroy();
            if (this.removeMutationListener) {
                this.removeMutationListener();
            }
        },
        /**
         * Return defaults, which are extracted from the passed in domain
         * object.
         */
        defaults: function (options) {
            return {
                series: [],
                domainObject: options.domainObject,
                xAxis: {
                },
                yAxis: _.cloneDeep(_.get(options.domainObject, 'configuration.yAxis', {})),
                legend: _.cloneDeep(_.get(options.domainObject, 'configuration.legend', {}))
            };
        }
    });

    return PlotConfigurationModel;
});
