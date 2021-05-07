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
    '../configuration/configStore',
    '../lib/eventHelpers',
    'objectUtils'
], function (
    configStore,
    eventHelpers,
    objectUtils
) {

    function PlotOptionsController($scope, openmct, $timeout) {
        this.$scope = $scope;
        this.openmct = openmct;
        this.$timeout = $timeout;

        this.configId = $scope.domainObject.getId();
        this.setUpScope();
    }

    eventHelpers.extend(PlotOptionsController.prototype);

    PlotOptionsController.prototype.updateDomainObject = function (domainObject) {
        this.domainObject = domainObject;
        this.$scope.formDomainObject = domainObject;
    };

    PlotOptionsController.prototype.destroy = function () {
        this.stopListening();
        this.unlisten();
    };

    PlotOptionsController.prototype.setUpScope = function () {
        const config = configStore.get(this.configId);
        if (!config) {
            this.$timeout(this.setUpScope.bind(this));

            return;
        }

        this.config = this.$scope.config = config;
        this.$scope.plotSeries = [];

        this.updateDomainObject(this.config.get('domainObject'));
        this.unlisten = this.openmct.objects.observe(this.domainObject, '*', this.updateDomainObject.bind(this));

        this.listenTo(this.$scope, '$destroy', this.destroy, this);
        this.listenTo(config.series, 'add', this.addSeries, this);
        this.listenTo(config.series, 'remove', this.resetAllSeries, this);

        config.series.forEach(this.addSeries, this);
    };

    PlotOptionsController.prototype.addSeries = function (series, index) {
        this.$timeout(function () {
            this.$scope.plotSeries[index] = series;
            series.locateOldObject(this.$scope.domainObject);
        }.bind(this));
    };

    PlotOptionsController.prototype.resetAllSeries = function (series, index) {
        this.$timeout(function () {
            this.$scope.plotSeries = [];
            this.$timeout(function () {
                this.config.series.forEach(this.addSeries, this);
            }.bind(this));
        }.bind(this));
    };

    return PlotOptionsController;
});

