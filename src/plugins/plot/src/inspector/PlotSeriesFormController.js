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
    './PlotModelFormController',
    '../draw/MarkerShapes',
    'lodash'
], function (
    PlotModelFormController,
    MARKER_SHAPES,
    _
) {

    function dynamicPathForKey(key) {
        return function (object, model) {
            const modelIdentifier = model.get('identifier');
            const index = object.configuration.series.findIndex(s => {
                return _.isEqual(s.identifier, modelIdentifier);
            });

            return 'configuration.series[' + index + '].' + key;
        };
    }

    const PlotSeriesFormController = PlotModelFormController.extend({

        /**
         * Set the color for the current plot series.  If the new color was
         * already assigned to a different plot series, then swap the colors.
         */
        setColor: function (color) {
            const oldColor = this.model.get('color');
            const otherSeriesWithColor = this.model.collection.filter(function (s) {
                return s.get('color') === color;
            })[0];

            this.model.set('color', color);

            const getPath = dynamicPathForKey('color');
            const seriesColorPath = getPath(this.domainObject, this.model);

            this.openmct.objects.mutate(
                this.domainObject,
                seriesColorPath,
                color.asHexString()
            );

            if (otherSeriesWithColor) {
                otherSeriesWithColor.set('color', oldColor);

                const otherSeriesColorPath = getPath(
                    this.domainObject,
                    otherSeriesWithColor
                );

                this.openmct.objects.mutate(
                    this.domainObject,
                    otherSeriesColorPath,
                    oldColor.asHexString()
                );
            }
        },

        /**
         * Populate scope with options and add setColor callback.
         */
        initialize: function () {
            this.$scope.setColor = this.setColor.bind(this);

            const metadata = this.model.metadata;
            this.$scope.yKeyOptions = metadata
                .valuesForHints(['range'])
                .map(function (o) {
                    return {
                        name: o.key,
                        value: o.key
                    };
                });
            this.$scope.markerShapeOptions = Object.entries(MARKER_SHAPES)
                .map(([key, obj]) => {
                    return {
                        name: obj.label,
                        value: key
                    };
                });
        },

        fields: [
            {
                modelProp: 'yKey',
                objectPath: dynamicPathForKey('yKey')
            },
            {
                modelProp: 'interpolate',
                objectPath: dynamicPathForKey('interpolate')
            },
            {
                modelProp: 'markers',
                objectPath: dynamicPathForKey('markers')
            },
            {
                modelProp: 'markerShape',
                objectPath: dynamicPathForKey('markerShape')
            },
            {
                modelProp: 'markerSize',
                coerce: Number,
                objectPath: dynamicPathForKey('markerSize')
            },
            {
                modelProp: 'alarmMarkers',
                coerce: Boolean,
                objectPath: dynamicPathForKey('alarmMarkers')
            }
        ]
    });

    return PlotSeriesFormController;
});

