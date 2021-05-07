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

/*jscs:disable disallowDanglingUnderscores */

define([
    'lodash',
    '../configuration/PlotConfigurationModel',
    '../configuration/configStore',
    '../lib/eventHelpers'
], function (
    _,
    PlotConfigurationModel,
    configStore,
    eventHelpers
) {

    /**
    TODO: Need to separate off plot configuration and specifying of defaults,
    is part of onDomainObjectChange as it can be triggered by mutation.
     */

    /**
     * Controller for a plot.
     *
     * @constructor.
     */
    function PlotController(
        $scope,
        $element,
        formatService,
        openmct,
        objectService,
        exportImageService
    ) {

        this.$scope = $scope;
        this.$element = $element;
        this.formatService = formatService;
        this.openmct = openmct;
        this.objectService = objectService;
        this.exportImageService = exportImageService;
        this.cursorGuide = false;
        this.gridLines = true;

        $scope.pending = 0;

        this.clearData = this.clearData.bind(this);

        this.listenTo($scope, 'user:viewport:change:end', this.onUserViewportChangeEnd, this);
        this.listenTo($scope, '$destroy', this.destroy, this);
        this.listenTo($scope, 'clearData', this.clearData);

        this.config = this.getConfig(this.$scope.domainObject);
        this.listenTo(this.config.series, 'add', this.addSeries, this);
        this.listenTo(this.config.series, 'remove', this.removeSeries, this);
        this.config.series.forEach(this.addSeries, this);

        this.followTimeConductor();

        this.newStyleDomainObject = $scope.domainObject.useCapability('adapter');
        this.keyString = this.openmct.objects.makeKeyString(this.newStyleDomainObject.identifier);

        this.filterObserver = this.openmct.objects.observe(
            this.newStyleDomainObject,
            'configuration.filters',
            this.updateFiltersAndResubscribe.bind(this)
        );
    }

    eventHelpers.extend(PlotController.prototype);

    PlotController.prototype.followTimeConductor = function () {
        this.listenTo(this.openmct.time, 'bounds', this.updateDisplayBounds, this);
        this.listenTo(this.openmct.time, 'timeSystem', this.syncXAxisToTimeSystem, this);
        this.synchronized(true);
    };

    PlotController.prototype.loadSeriesData = function (series) {
        if (this.$element[0].offsetWidth === 0) {
            this.scheduleLoad(series);

            return;
        }

        this.startLoading();
        const options = {
            size: this.$element[0].offsetWidth,
            domain: this.config.xAxis.get('key')
        };

        series.load(options)
            .then(this.stopLoading.bind(this));
    };

    PlotController.prototype.scheduleLoad = function (series) {
        if (!this.scheduledLoads) {
            this.startLoading();
            this.scheduledLoads = [];
            this.checkForSize = setInterval(function () {
                if (this.$element[0].offsetWidth === 0) {
                    return;
                }

                this.stopLoading();
                this.scheduledLoads.forEach(this.loadSeriesData, this);
                delete this.scheduledLoads;
                clearInterval(this.checkForSize);
                delete this.checkForSize;
            }.bind(this));
        }

        if (this.scheduledLoads.indexOf(series) === -1) {
            this.scheduledLoads.push(series);
        }
    };

    PlotController.prototype.addSeries = function (series) {
        this.listenTo(series, 'change:xKey', (xKey) => {
            this.setDisplayRange(series, xKey);
        }, this);
        this.listenTo(series, 'change:yKey', () => {
            this.loadSeriesData(series);
        }, this);

        this.listenTo(series, 'change:interpolate', () => {
            this.loadSeriesData(series);
        }, this);

        this.loadSeriesData(series);
    };

    PlotController.prototype.setDisplayRange = function (series, xKey) {
        if (this.config.series.models.length !== 1) {
            return;
        }

        const displayRange = series.getDisplayRange(xKey);
        this.config.xAxis.set('range', displayRange);
    };

    PlotController.prototype.removeSeries = function (plotSeries) {
        this.stopListening(plotSeries);
    };

    PlotController.prototype.getConfig = function (domainObject) {
        const configId = domainObject.getId();
        let config = configStore.get(configId);
        if (!config) {
            const newDomainObject = domainObject.useCapability('adapter');
            config = new PlotConfigurationModel({
                id: configId,
                domainObject: newDomainObject,
                openmct: this.openmct
            });
            configStore.add(configId, config);
        }

        return config;
    };

    PlotController.prototype.syncXAxisToTimeSystem = function (timeSystem) {
        this.config.xAxis.set('key', timeSystem.key);
        this.config.xAxis.emit('resetSeries');
    };

    PlotController.prototype.destroy = function () {
        configStore.deleteStore(this.config.id);

        this.stopListening();
        if (this.checkForSize) {
            clearInterval(this.checkForSize);
            delete this.checkForSize;
        }

        if (this.filterObserver) {
            this.filterObserver();
        }
    };

    PlotController.prototype.loadMoreData = function (range, purge) {
        this.config.series.forEach(plotSeries => {
            this.startLoading();
            plotSeries.load({
                size: this.$element[0].offsetWidth,
                start: range.min,
                end: range.max,
                domain: this.config.xAxis.get('key')
            })
                .then(this.stopLoading());
            if (purge) {
                plotSeries.purgeRecordsOutsideRange(range);
            }
        });
    };

    /**
     * Track latest display bounds.  Forces update when not receiving ticks.
     */
    PlotController.prototype.updateDisplayBounds = function (bounds, isTick) {

        const xAxisKey = this.config.xAxis.get('key');
        const timeSystem = this.openmct.time.timeSystem();
        const newRange = {
            min: bounds.start,
            max: bounds.end
        };

        if (xAxisKey !== timeSystem.key) {
            this.syncXAxisToTimeSystem(timeSystem);
        }

        this.config.xAxis.set('range', newRange);
        if (!isTick) {
            this.skipReloadOnInteraction = true;
            this.$scope.$broadcast('plot:clearHistory');
            this.skipReloadOnInteraction = false;
            this.loadMoreData(newRange, true);
        } else {
            // Drop any data that is more than 1x (max-min) before min.
            // Limit these purges to once a second.
            if (!this.nextPurge || this.nextPurge < Date.now()) {
                const keepRange = {
                    min: newRange.min - (newRange.max - newRange.min),
                    max: newRange.max
                };
                this.config.series.forEach(function (series) {
                    series.purgeRecordsOutsideRange(keepRange);
                });
                this.nextPurge = Date.now() + 1000;
            }
        }
    };

    PlotController.prototype.startLoading = function () {
        this.$scope.pending += 1;
    };

    PlotController.prototype.stopLoading = function () {
        this.$scope.$evalAsync(() => {
            this.$scope.pending -= 1;
        });
    };

    /**
     * Getter/setter for "synchronized" value.  If not synchronized and
     * time conductor is in clock mode, will mark objects as unsynced so that
     * displays can update accordingly.
     * @private
     */
    PlotController.prototype.synchronized = function (value) {
        if (typeof value !== 'undefined') {
            this._synchronized = value;
            const isUnsynced = !value && this.openmct.time.clock();
            if (this.$scope.domainObject.getCapability('status')) {
                this.$scope.domainObject.getCapability('status')
                    .set('timeconductor-unsynced', isUnsynced);
            }
        }

        return this._synchronized;
    };

    /**
     * Handle end of user viewport change: load more data for current display
     * bounds, and mark view as synchronized if bounds match configured bounds.
     * @private
     */
    PlotController.prototype.onUserViewportChangeEnd = function () {
        const xDisplayRange = this.config.xAxis.get('displayRange');
        const xRange = this.config.xAxis.get('range');

        if (!this.skipReloadOnInteraction) {
            this.loadMoreData(xDisplayRange);
        }

        this.synchronized(xRange.min === xDisplayRange.min
                          && xRange.max === xDisplayRange.max);
    };

    PlotController.prototype.updateFiltersAndResubscribe = function (updatedFilters) {
        this.config.series.forEach(function (series) {
            series.updateFiltersAndRefresh(updatedFilters[series.keyString]);
        });
    };

    PlotController.prototype.clearData = function () {
        this.config.series.forEach(function (series) {
            series.reset();
        });
    };

    /**
     * Export view as JPG.
     */
    PlotController.prototype.exportJPG = function () {
        const plotElement = this.$element.children()[1];

        this.exportImageService.exportJPG(plotElement, 'plot.jpg', 'export-plot');
    };

    /**
     * Export view as PNG.
     */
    PlotController.prototype.exportPNG = function () {
        const plotElement = this.$element.children()[1];

        this.exportImageService.exportPNG(plotElement, 'plot.png', 'export-plot');
    };

    PlotController.prototype.toggleCursorGuide = function ($event) {
        this.cursorGuide = !this.cursorGuide;
        this.$scope.$broadcast('cursorguide', $event);
    };

    PlotController.prototype.toggleGridLines = function ($event) {
        this.gridLines = !this.gridLines;
        this.$scope.$broadcast('toggleGridLines', $event);
    };

    return PlotController;

});
