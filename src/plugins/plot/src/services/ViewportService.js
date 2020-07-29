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
define([
    "../lib/constants",
    "zepto"
], function (
    constants,
    $
) {
    function ViewportService(openmct) {
        this.openmct = openmct;
    }

    ViewportService.prototype.getBounds = function () {
        let mainContainer = document.getElementsByClassName('l-shell__main-container')[0];
        if (!mainContainer) {
            return;
        }

        let returnData = {};
        let plots = $(mainContainer).find("mct-plot");
        for(let i=0, len=plots.length; i<len; i++) {
            let scope = this.openmct.$angular.element(plots.get(i)).scope();
            if (!scope || !scope.config) {
                continue;
            }

            let id = scope.config.id ? scope.config.id : null;
            if(!id) {
                continue;
            }

            let model = scope.config.model ? scope.config.model : null;
            if (!model) {
                continue;
            }

            let xAxis = model.xAxis ? model.xAxis : null;
            let yAxis = model.yAxis ? model.yAxis : null;
            if (!xAxis || !yAxis || !xAxis.displayRange || !yAxis.displayRange) {
                continue;
            }

            returnData[i] = {
                x: xAxis.displayRange,
                y: yAxis.displayRange
            };
        }

        return returnData;
    }

    ViewportService.prototype.setBounds = function (childIndex, viewportBounds) {
        let index = parseInt(childIndex);
        if (index >= 0 && 'x' in viewportBounds && 'y' in viewportBounds) {
            this.openmct.router.updateParams({
                [constants.QUERY_PARAM_NAMES.VIEWPORT_X+"["+childIndex+"]"]: viewportBounds.x.min+','+viewportBounds.x.max,
                [constants.QUERY_PARAM_NAMES.VIEWPORT_Y+"["+childIndex+"]"]: viewportBounds.y.min+','+viewportBounds.y.max
            });
        }
    }

    return ViewportService;
});
