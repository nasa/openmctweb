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
        './DrawWebGL',
        './Draw2D'
    ],
    function (DrawWebGL, Draw2D) {

        const CHARTS = [
            {
                MAX_INSTANCES: 16,
                API: DrawWebGL,
                ALLOCATIONS: []
            },
            {
                MAX_INSTANCES: Number.POSITIVE_INFINITY,
                API: Draw2D,
                ALLOCATIONS: []
            }
        ];

        /**
         * Draw loader attaches a draw API to a canvas element and returns the
         * draw API.
         */
        return {
            /**
             * Return the first draw API available.  Returns
             * `undefined` if a draw API could not be constructed.
             *.
             * @param {CanvasElement} canvas - The canvas eelement to attach
                      the draw API to.
             */
            getDrawAPI: function (canvas, overlay) {
                let api;

                CHARTS.forEach(function (CHART_TYPE) {
                    if (api) {
                        return;
                    }

                    if (CHART_TYPE.ALLOCATIONS.length
                        >= CHART_TYPE.MAX_INSTANCES) {
                        return;
                    }

                    try {
                        api = new CHART_TYPE.API(canvas, overlay);
                        CHART_TYPE.ALLOCATIONS.push(api);
                    } catch (e) {
                        console.warn([
                            "Could not instantiate chart",
                            CHART_TYPE.API.name,
                            ";",
                            e.message
                        ].join(" "));
                    }
                });

                if (!api) {
                    console.warn("Cannot initialize mct-chart.");
                }

                return api;
            },

            /**
             * Returns a fallback draw api.
             */
            getFallbackDrawAPI: function (canvas, overlay) {
                const api = new CHARTS[1].API(canvas, overlay);
                CHARTS[1].ALLOCATIONS.push(api);

                return api;
            },

            releaseDrawAPI: function (api) {
                CHARTS.forEach(function (CHART_TYPE) {
                    if (api instanceof CHART_TYPE.API) {
                        CHART_TYPE.ALLOCATIONS.splice(CHART_TYPE.ALLOCATIONS.indexOf(api), 1);
                    }
                });
                if (api.destroy) {
                    api.destroy();
                }
            }
        };
    }
);
