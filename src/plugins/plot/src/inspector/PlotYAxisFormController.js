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
    './PlotModelFormController'
], function (
    PlotModelFormController
) {

    const PlotYAxisFormController = PlotModelFormController.extend({
        fields: [
            {
                modelProp: 'label',
                objectPath: 'configuration.yAxis.label'
            },
            {
                modelProp: 'autoscale',
                coerce: Boolean,
                objectPath: 'configuration.yAxis.autoscale'
            },
            {
                modelProp: 'autoscalePadding',
                coerce: Number,
                objectPath: 'configuration.yAxis.autoscalePadding'
            },
            {
                modelProp: 'range',
                objectPath: 'configuration.yAxis.range',
                coerce: function coerceRange(range) {
                    if (!range) {
                        return {
                            min: 0,
                            max: 0
                        };
                    }

                    const newRange = {};
                    if (typeof range.min !== 'undefined' && range.min !== null) {
                        newRange.min = Number(range.min);
                    }

                    if (typeof range.max !== 'undefined' && range.max !== null) {
                        newRange.max = Number(range.max);
                    }

                    return newRange;
                },
                validate: function validateRange(range, model) {
                    if (!range) {
                        return 'Need range';
                    }

                    if (range.min === '' || range.min === null || typeof range.min === 'undefined') {
                        return 'Must specify Minimum';
                    }

                    if (range.max === '' || range.max === null || typeof range.max === 'undefined') {
                        return 'Must specify Maximum';
                    }

                    if (Number.isNaN(Number(range.min))) {
                        return 'Minimum must be a number.';
                    }

                    if (Number.isNaN(Number(range.max))) {
                        return 'Maximum must be a number.';
                    }

                    if (Number(range.min) > Number(range.max)) {
                        return 'Minimum must be less than Maximum.';
                    }

                    if (model.get('autoscale')) {
                        return false;
                    }

                    return true;
                }
            }
        ]
    });

    return PlotYAxisFormController;
});

