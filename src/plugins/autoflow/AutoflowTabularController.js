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
    './AutoflowTabularRowController'
], function (AutoflowTabularRowController) {
    /**
     * Controller for an Autoflow Tabular View. Subscribes to telemetry
     * associated with children of the domain object and passes that
     * information on to the view.
     *
     * @param {DomainObject} domainObject the object being viewed
     * @param {*} data the view data
     * @param openmct a reference to the openmct application
     */
    function AutoflowTabularController(domainObject, data, openmct) {
        this.composition = openmct.composition.get(domainObject);
        this.data = data;
        this.openmct = openmct;

        this.rows = {};
        this.controllers = {};

        this.addRow = this.addRow.bind(this);
        this.removeRow = this.removeRow.bind(this);
    }

    /**
     * Set the "Last Updated" value to be displayed.
     * @param {String} value the value to display
     * @private
     */
    AutoflowTabularController.prototype.trackLastUpdated = function (value) {
        this.data.updated = value;
    };

    /**
     * Respond to an `add` event from composition by adding a new row.
     * @private
     */
    AutoflowTabularController.prototype.addRow = function (childObject) {
        const identifier = childObject.identifier;
        const id = [identifier.namespace, identifier.key].join(":");

        if (!this.rows[id]) {
            this.rows[id] = {
                classes: "",
                name: childObject.name,
                value: undefined
            };
            this.controllers[id] = new AutoflowTabularRowController(
                childObject,
                this.rows[id],
                this.openmct,
                this.trackLastUpdated.bind(this)
            );
            this.controllers[id].activate();
            this.data.items.push(this.rows[id]);
        }
    };

    /**
     * Respond to an `remove` event from composition by removing any
     * related row.
     * @private
     */
    AutoflowTabularController.prototype.removeRow = function (identifier) {
        const id = [identifier.namespace, identifier.key].join(":");

        if (this.rows[id]) {
            this.data.items = this.data.items.filter(function (item) {
                return item !== this.rows[id];
            }.bind(this));
            this.controllers[id].destroy();
            delete this.controllers[id];
            delete this.rows[id];
        }
    };

    /**
     * Activate this controller; begin listening for changes.
     */
    AutoflowTabularController.prototype.activate = function () {
        this.composition.on('add', this.addRow);
        this.composition.on('remove', this.removeRow);
        this.composition.load();
    };

    /**
     * Destroy this controller; detach any associated resources.
     */
    AutoflowTabularController.prototype.destroy = function () {
        Object.keys(this.controllers).forEach(function (id) {
            this.controllers[id].destroy();
        }.bind(this));
        this.controllers = {};
        this.composition.off('add', this.addRow);
        this.composition.off('remove', this.removeRow);
    };

    return AutoflowTabularController;
});
