/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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
    '../lib/eventHelpers',
    '../lib/constants',
    'zepto'
], function (
    _,
    PlotConfigurationModel,
    configStore,
    eventHelpers,
    constants,
    $
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
        $location,
        formatService,
        openmct,
        objectService,
        exportImageService,
        viewportService
    ) {
        this.$scope = $scope;
        this.$element = $element;
        this.$location = $location;
        this.formatService = formatService;
        this.openmct = openmct;
        this.objectService = objectService;
        this.exportImageService = exportImageService;
        this.viewportService = viewportService;
        this.cursorGuide = false;

        $scope.pending = 0;

        this.clearData = this.clearData.bind(this);

        this.listenTo($scope, 'user:viewport:change:end', this.onUserViewportChangeEnd, this);
        this.listenTo($scope, '$destroy', this.destroy, this);
        this.listenTo($scope, 'clearData', this.clearData);
        this.listenTo($scope, '$locationChangeSuccess', this.setAxisDisplayRange, this);

        this.config = this.getConfig(this.$scope.domainObject);
        this.listenTo(this.config.series, 'add', this.addSeries, this);
        this.listenTo(this.config.series, 'remove', this.removeSeries, this);
        this.config.series.forEach(this.addSeries, this);

        this.followTimeConductor();

        this.newStyleDomainObject = $scope.domainObject.useCapability('adapter');
        this.keyString = this.openmct.objects.makeKeyString(this.newStyleDomainObject.identifier);

        this.setAxisDisplayRange();

        this.filterObserver = this.openmct.objects.observe(
            this.newStyleDomainObject,
            'configuration.filters',
            this.updateFiltersAndResubscribe.bind(this)
        );
    }

    eventHelpers.extend(PlotController.prototype);

    PlotController.prototype.followTimeConductor = function () {
        this.listenTo(this.openmct.time, 'bounds', this.updateDisplayBounds, this);
        this.listenTo(this.openmct.time, 'timeSystem', this.onTimeSystemChange, this);
        this.synchronized(true);
    };

    PlotController.prototype.loadSeriesData = function (series) {
        if (this.$element[0].offsetWidth === 0) {
            this.scheduleLoad(series);
            return;
        }
        this.startLoading();
        var options = {
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
        this.listenTo(series, 'change:yKey', function () {
            this.loadSeriesData(series);
        }, this);

        this.listenTo(series, 'change:interpolate', function () {
            this.loadSeriesData(series);
        }, this);

        this.loadSeriesData(series);
    };

    PlotController.prototype.removeSeries = function (plotSeries) {
        this.stopListening(plotSeries);
    };

    PlotController.prototype.getConfig = function (domainObject) {
        var configId = domainObject.getId();
        var config = configStore.get(configId);
        if (!config) {
            var newDomainObject = domainObject.useCapability('adapter');
            config = new PlotConfigurationModel({
                id: configId,
                domainObject: newDomainObject,
                openmct: this.openmct
            });
            configStore.add(configId, config);
        }
        return config;
    };

    PlotController.prototype.onTimeSystemChange = function (timeSystem) {
        this.config.xAxis.set('key', timeSystem.key);
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
        this.config.series.map(function (plotSeries) {
            this.startLoading();
            plotSeries.load({
                size: this.$element[0].offsetWidth,
                start: range.min,
                end: range.max
            })
                .then(this.stopLoading.bind(this));
            if (purge) {
                plotSeries.purgeRecordsOutsideRange(range);
            }
        }, this);
    };

    /**
     * Track latest display bounds.  Forces update when not receiving ticks.
     */
    PlotController.prototype.updateDisplayBounds = function (bounds, isTick) {
        var newRange = {
            min: bounds.start,
            max: bounds.end
        };
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
                var keepRange = {
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
            var isUnsynced = !value && this.openmct.time.clock();
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
        var xDisplayRange = this.config.xAxis.get('displayRange');
        var yDisplayRange = this.config.yAxis.get('displayRange');
        var xRange = this.config.xAxis.get('range');

        //add viewport x and y axes to URL
        if (xDisplayRange && !isNaN(parseInt(xDisplayRange.min, 0xA)) && !isNaN(parseInt(xDisplayRange.max, 0xA)) &&
            yDisplayRange && !isNaN(parseFloat(yDisplayRange.min, 0xA)) && !isNaN(parseFloat(yDisplayRange.max, 0xA))) {
            let newBounds = {
                x: {
                    min: parseInt(xDisplayRange.min, 0xA),
                    max: parseInt(xDisplayRange.max, 0xA)
                },
                y: {
                    min: parseFloat(yDisplayRange.min, 0xA),
                    max: parseFloat(yDisplayRange.max, 0xA)
                }
            };

            let childIndex = this.getChildIndex();
            this.viewportService.setBounds(childIndex, newBounds);
        }

        if (!this.skipReloadOnInteraction) {
            this.loadMoreData(xDisplayRange);
        }

        this.synchronized(xRange.min === xDisplayRange.min &&
                          xRange.max === xDisplayRange.max);
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

    PlotController.prototype.getChildIndex = function () {
        let activePlot = $(this.$element[0]).find("mct-plot")[0];
        let parent = document.querySelector('.c-overlay__contents')
            || document.getElementsByClassName('l-shell__main-container')[0];

        return $(parent).find('mct-plot').index(activePlot);
    };

    /**
     * Export view as JPG.
     */
    PlotController.prototype.exportJPG = function () {
        var plotElement = this.$element.children()[1];

        this.exportImageService.exportJPG(plotElement, 'plot.jpg', 'export-plot');
    };

    /**
     * Export view as PNG.
     */
    PlotController.prototype.exportPNG = function () {
        var plotElement = this.$element.children()[1];

        this.exportImageService.exportPNG(plotElement, 'plot.png', 'export-plot');
    };

    PlotController.prototype.toggleCursorGuide = function ($event) {
        this.cursorGuide = !this.cursorGuide;
        this.$scope.$broadcast('cursorguide', $event);
    };

    PlotController.prototype.setAxisDisplayRange = function () {
        let childIndex = this.getChildIndex();
        var searchParams = _.pick(this.$location.search(), Object.keys(this.$location.search()).filter(function (item) {
            return item.startsWith("viewportX["+childIndex+"]")||item.startsWith("viewportY["+childIndex+"]");
        }));

        let xParamVal = searchParams[constants.QUERY_PARAM_NAMES.VIEWPORT_X+"["+childIndex+"]"];
        let xParamBounds = xParamVal ? xParamVal.split(',') : [];

        let yParamVal = searchParams[constants.QUERY_PARAM_NAMES.VIEWPORT_Y+"["+childIndex+"]"];
        let yParamBounds = yParamVal ? yParamVal.split(',') : [];

        if(xParamBounds.length !== 2 || yParamBounds.length !== 2) {
            return;
        }

        //set X-axis viewport
        if (!isNaN(parseInt(xParamBounds[0], 0xA)) &&
            !isNaN(parseInt(xParamBounds[1], 0xA))) {
            this.config.xAxis.set('autoscale', false);
            this.config.xAxis.set('displayRange', {
                min:parseInt(xParamBounds[0], 0xA),
                max:parseInt(xParamBounds[1], 0xA)
            });
        }

        //set y-axis viewport
        if (!isNaN(parseFloat(yParamBounds[0], 0xA)) &&
            !isNaN(parseFloat(yParamBounds[1], 0xA))) {
            this.config.yAxis.set('autoscale', false);
            this.config.yAxis.set('displayRange', {
                min:parseFloat(yParamBounds[0], 0xA),
                max:parseFloat(yParamBounds[1], 0xA)
            });
        }
    };

    return PlotController;

});
