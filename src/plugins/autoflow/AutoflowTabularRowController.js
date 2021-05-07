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

define([], function () {
    /**
     * Controller for individual rows of an Autoflow Tabular View.
     * Subscribes to telemetry and updates row data.
     *
     * @param {DomainObject} domainObject the object being viewed
     * @param {*} data the view data
     * @param openmct a reference to the openmct application
     * @param {Function} callback a callback to invoke with "last updated" timestamps
     */
    function AutoflowTabularRowController(domainObject, data, openmct, callback) {
        this.domainObject = domainObject;
        this.data = data;
        this.openmct = openmct;
        this.callback = callback;

        this.metadata = this.openmct.telemetry.getMetadata(this.domainObject);
        this.ranges = this.metadata.valuesForHints(['range']);
        this.domains = this.metadata.valuesForHints(['domain']);
        this.rangeFormatter =
            this.openmct.telemetry.getValueFormatter(this.ranges[0]);
        this.domainFormatter =
            this.openmct.telemetry.getValueFormatter(this.domains[0]);
        this.evaluator =
            this.openmct.telemetry.limitEvaluator(this.domainObject);

        this.initialized = false;
    }

    /**
     * Update row to reflect incoming telemetry data.
     * @private
     */
    AutoflowTabularRowController.prototype.updateRowData = function (datum) {
        const violations = this.evaluator.evaluate(datum, this.ranges[0]);

        this.initialized = true;
        this.data.classes = violations ? violations.cssClass : "";
        this.data.value = this.rangeFormatter.format(datum);
        this.callback(this.domainFormatter.format(datum));
    };

    /**
     * Activate this controller; begin listening for changes.
     */
    AutoflowTabularRowController.prototype.activate = function () {
        this.unsubscribe = this.openmct.telemetry.subscribe(
            this.domainObject,
            this.updateRowData.bind(this)
        );

        this.openmct.telemetry.request(
            this.domainObject,
            { size: 1 }
        ).then(function (history) {
            if (!this.initialized && history.length > 0) {
                this.updateRowData(history[history.length - 1]);
            }
        }.bind(this));
    };

    /**
     * Destroy this controller; detach any associated resources.
     */
    AutoflowTabularRowController.prototype.destroy = function () {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    };

    return AutoflowTabularRowController;
});
