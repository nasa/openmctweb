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
import _ from 'lodash';
import Model from "./Model";
import { MARKER_SHAPES } from '../draw/MarkerShapes';

/**
 * Plot series handle interpreting telemetry metadata for a single telemetry
 * object, querying for that data, and formatting it for display purposes.
 *
 * Plot series emit both collection events and model events:
 * `change` when any property changes
 * `change:<prop_name>` when a specific property changes.
 * `destroy`: when series is destroyed
 * `add`: whenever a data point is added to a series
 * `remove`: whenever a data point is removed from a series.
 * `reset`: whenever the collection is emptied.
 *
 * Plot series have the following Model properties:
 *
 * `name`: name of series.
 * `identifier`: the Open MCT identifier for the telemetry source for this
 *               series.
 * `xKey`: the telemetry value key for x values fetched from this series.
 * `yKey`: the telemetry value key for y values fetched from this series.
 * `interpolate`: interpolate method, either `undefined` (no interpolation),
 *                `linear` (points are connected via straight lines), or
 *                `stepAfter` (points are connected by steps).
 * `markers`: boolean, whether or not this series should render with markers.
 * `markerShape`: string, shape of markers.
 * `markerSize`: number, size in pixels of markers for this series.
 * `alarmMarkers`: whether or not to display alarm markers for this series.
 * `stats`: An object that tracks the min and max y values observed in this
 *          series.  This property is checked and updated whenever data is
 *          added.
 *
 * Plot series have the following instance properties:
 *
 * `metadata`: the Open MCT Telemetry Metadata Manager for the associated
 *             telemetry point.
 * `formats`: the Open MCT format map for this telemetry point.
 */
export default class PlotSeries extends Model {
    constructor(options) {
        super(options);
        this.data = [];

        this.listenTo(this, 'change:xKey', this.onXKeyChange, this);
        this.listenTo(this, 'change:yKey', this.onYKeyChange, this);
        this.persistedConfig = options.persistedConfig;
        this.filters = options.filters;

        // Model.apply(this, arguments);
        this.onXKeyChange(this.get('xKey'));
        this.onYKeyChange(this.get('yKey'));
    }

    /**
     * Set defaults for telemetry series.
     */
    defaults(options) {
        this.metadata = options
            .openmct
            .telemetry
            .getMetadata(options.domainObject);
        this.formats = options
            .openmct
            .telemetry
            .getFormatMap(this.metadata);

        const range = this.metadata.valuesForHints(['range'])[0];

        return {
            name: options.domainObject.name,
            unit: range.unit,
            xKey: options.collection.plot.xAxis.get('key'),
            yKey: range.key,
            markers: true,
            markerShape: 'point',
            markerSize: 2.0,
            alarmMarkers: true
        };
    }

    /**
     * Remove real-time subscription when destroyed.
     */
    onDestroy(model) {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    initialize(options) {
        this.openmct = options.openmct;
        this.domainObject = options.domainObject;
        this.keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);
        this.limitEvaluator = this.openmct.telemetry.limitEvaluator(options.domainObject);
        this.on('destroy', this.onDestroy, this);
    }

    locateOldObject(oldStyleParent) {
        return oldStyleParent.useCapability('composition')
            .then(function (children) {
                this.oldObject = children
                    .filter(function (child) {
                        return child.getId() === this.keyString;
                    }, this)[0];
            }.bind(this));
    }
    /**
     * Fetch historical data and establish a realtime subscription.  Returns
     * a promise that is resolved when all connections have been successfully
     * established.
     *
     * @returns {Promise}
     */
    fetch(options) {
        let strategy;

        if (this.model.interpolate !== 'none') {
            strategy = 'minmax';
        }

        options = Object.assign({}, {
            size: 1000,
            strategy,
            filters: this.filters
        }, options || {});

        if (!this.unsubscribe) {
            this.unsubscribe = this.openmct
                .telemetry
                .subscribe(
                    this.domainObject,
                    this.add.bind(this),
                    {
                        filters: this.filters
                    }
                );
        }

        /* eslint-disable you-dont-need-lodash-underscore/concat */
        return this.openmct
            .telemetry
            .request(this.domainObject, options)
            .then(function (points) {
                const newPoints = _(this.data)
                    .concat(points)
                    .sortBy(this.getXVal)
                    .uniq(true, point => [this.getXVal(point), this.getYVal(point)].join())
                    .value();
                this.reset(newPoints);
            }.bind(this));
        /* eslint-enable you-dont-need-lodash-underscore/concat */
    }
    /**
     * Update x formatter on x change.
     */
    onXKeyChange(xKey) {
        const format = this.formats[xKey];
        this.getXVal = format.parse.bind(format);
    }
    /**
     * Update y formatter on change, default to stepAfter interpolation if
     * y range is an enumeration.
     */
    onYKeyChange(newKey, oldKey) {
        if (newKey === oldKey) {
            return;
        }

        const valueMetadata = this.metadata.value(newKey);
        if (!this.persistedConfig || !this.persistedConfig.interpolate) {
            if (valueMetadata.format === 'enum') {
                this.set('interpolate', 'stepAfter');
            } else {
                this.set('interpolate', 'linear');
            }
        }

        this.evaluate = function (datum) {
            return this.limitEvaluator.evaluate(datum, valueMetadata);
        }.bind(this);
        const format = this.formats[newKey];
        this.getYVal = format.parse.bind(format);
    }

    formatX(point) {
        return this.formats[this.get('xKey')].format(point);
    }

    formatY(point) {
        return this.formats[this.get('yKey')].format(point);
    }

    /**
     * Clear stats and recalculate from existing data.
     */
    resetStats() {
        this.unset('stats');
        this.data.forEach(this.updateStats, this);
    }

    /**
     * Reset plot series.  If new data is provided, will add that
     * data to series after reset.
     */
    reset(newData) {
        this.data = [];
        this.resetStats();
        this.emit('reset');
        if (newData) {
            newData.forEach(function (point) {
                this.add(point, true);
            }, this);
        }
    }
    /**
     * Return the point closest to a given x value.
     */
    nearestPoint(xValue) {
        const insertIndex = this.sortedIndex(xValue);
        const lowPoint = this.data[insertIndex - 1];
        const highPoint = this.data[insertIndex];
        const indexVal = this.getXVal(xValue);
        const lowDistance = lowPoint
            ? indexVal - this.getXVal(lowPoint)
            : Number.POSITIVE_INFINITY;
        const highDistance = highPoint
            ? this.getXVal(highPoint) - indexVal
            : Number.POSITIVE_INFINITY;
        const nearestPoint = highDistance < lowDistance ? highPoint : lowPoint;

        return nearestPoint;
    }
    /**
     * Override this to implement plot series loading functionality.  Must return
     * a promise that is resolved when loading is completed.
     *
     * @private
     * @returns {Promise}
     */
    load(options) {
        return this.fetch(options)
            .then(function (res) {
                this.emit('load');

                return res;
            }.bind(this));
    }

    /**
     * Find the insert index for a given point to maintain sort order.
     * @private
     */
    sortedIndex(point) {
        return _.sortedIndexBy(this.data, point, this.getXVal);
    }
    /**
     * Update min/max stats for the series.
     * @private
     */
    updateStats(point) {
        const value = this.getYVal(point);
        let stats = this.get('stats');
        let changed = false;
        if (!stats) {
            stats = {
                minValue: value,
                minPoint: point,
                maxValue: value,
                maxPoint: point
            };
            changed = true;
        } else {
            if (stats.maxValue < value) {
                stats.maxValue = value;
                stats.maxPoint = point;
                changed = true;
            }

            if (stats.minValue > value) {
                stats.minValue = value;
                stats.minPoint = point;
                changed = true;
            }
        }

        if (changed) {
            this.set('stats', {
                minValue: stats.minValue,
                minPoint: stats.minPoint,
                maxValue: stats.maxValue,
                maxPoint: stats.maxPoint
            });
        }
    }
    /**
     * Add a point to the data array while maintaining the sort order of
     * the array and preventing insertion of points with a duplicate x
     * value. Can provide an optional argument to append a point without
     * maintaining sort order and dupe checks, which improves performance
     * when adding an array of points that are already properly sorted.
     *
     * @private
     * @param {Object} point a telemetry datum.
     * @param {Boolean} [appendOnly] default false, if true will append
     *                  a point to the end without dupe checking.
     */
    add(point, appendOnly) {
        let insertIndex = this.data.length;
        const currentYVal = this.getYVal(point);
        const lastYVal = this.getYVal(this.data[insertIndex - 1]);

        if (this.isValueInvalid(currentYVal) && this.isValueInvalid(lastYVal)) {
            console.warn('[Plot] Invalid Y Values detected');

            return;
        }

        if (!appendOnly) {
            insertIndex = this.sortedIndex(point);
            if (this.getXVal(this.data[insertIndex]) === this.getXVal(point)) {
                return;
            }

            if (this.getXVal(this.data[insertIndex - 1]) === this.getXVal(point)) {
                return;
            }
        }

        this.updateStats(point);
        point.mctLimitState = this.evaluate(point);
        this.data.splice(insertIndex, 0, point);
        this.emit('add', point, insertIndex, this);
    }

    /**
     *
     * @private
     */
    isValueInvalid(val) {
        return Number.isNaN(val) || val === undefined;
    }

    /**
     * Remove a point from the data array and notify listeners.
     * @private
     */
    remove(point) {
        const index = this.data.indexOf(point);
        this.data.splice(index, 1);
        this.emit('remove', point, index, this);
    }
    /**
     * Purges records outside a given x range.  Changes removal method based
     * on number of records to remove: for large purge, reset data and
     * rebuild array.  for small purge, removes points and emits updates.
     *
     * @public
     * @param {Object} range
     * @param {number} range.min minimum x value to keep
     * @param {number} range.max maximum x value to keep.
     */
    purgeRecordsOutsideRange(range) {
        const startIndex = this.sortedIndex(range.min);
        const endIndex = this.sortedIndex(range.max) + 1;
        const pointsToRemove = startIndex + (this.data.length - endIndex + 1);
        if (pointsToRemove > 0) {
            if (pointsToRemove < 1000) {
                this.data.slice(0, startIndex).forEach(this.remove, this);
                this.data.slice(endIndex, this.data.length).forEach(this.remove, this);
                this.resetStats();
            } else {
                const newData = this.data.slice(startIndex, endIndex);
                this.reset(newData);
            }
        }

    }
    /**
     * Updates filters, clears the plot series, unsubscribes and resubscribes
     * @public
     */
    updateFiltersAndRefresh(updatedFilters) {
        if (updatedFilters === undefined) {
            return;
        }

        let deepCopiedFilters = JSON.parse(JSON.stringify(updatedFilters));

        if (this.filters && !_.isEqual(this.filters, deepCopiedFilters)) {
            this.filters = deepCopiedFilters;
            this.reset();
            if (this.unsubscribe) {
                this.unsubscribe();
                delete this.unsubscribe;
            }

            this.fetch();
        } else {
            this.filters = deepCopiedFilters;
        }
    }
    getDisplayRange(xKey) {
        const unsortedData = this.data;
        this.data = [];
        unsortedData.forEach(point => this.add(point, false));

        const minValue = this.getXVal(this.data[0]);
        const maxValue = this.getXVal(this.data[this.data.length - 1]);

        return {
            min: minValue,
            max: maxValue
        };
    }
    markerOptionsDisplayText() {
        const showMarkers = this.get('markers');
        if (!showMarkers) {
            return "Disabled";
        }

        const markerShapeKey = this.get('markerShape');
        const markerShape = MARKER_SHAPES[markerShapeKey].label;
        const markerSize = this.get('markerSize');

        return `${markerShape}: ${markerSize}px`;
    }
    nameWithUnit() {
        let unit = this.get('unit');

        return this.get('name') + (unit ? ' ' + unit : '');
    }
}
