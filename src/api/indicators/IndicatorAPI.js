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
    './SimpleIndicator',
    'lodash'
], function (
    SimpleIndicator,
    _
) {
    function IndicatorAPI(openmct) {
        this.openmct = openmct;
        this.indicatorObjects = [];
    }

    IndicatorAPI.prototype.simpleIndicator = function () {
        return new SimpleIndicator(this.openmct);
    };

    /**
     * Accepts an indicator object, which is a simple object
     * with a single attribute, 'element' which has an HTMLElement
     * as its value.
     *
     * We provide .simpleIndicator() as a convenience function
     * which will create a default Open MCT indicator that can
     * be passed to .add(indicator). This indicator also exposes
     * functions for changing its appearance to support customization
     * and dynamic behavior.
     *
     * Eg.
     * var myIndicator = openmct.indicators.simpleIndicator();
     * openmct.indicators.add(myIndicator);
     *
     * myIndicator.text("Hello World!");
     * myIndicator.iconClass("icon-info");
     *
     */
    IndicatorAPI.prototype.add = function (indicator) {
        this.indicatorObjects.push(indicator);
    };

    return IndicatorAPI;

});
