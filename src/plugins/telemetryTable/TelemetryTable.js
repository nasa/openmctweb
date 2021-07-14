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
    'EventEmitter',
    'lodash',
    './collections/TableRowCollection',
    './TelemetryTableNameColumn',
    './TelemetryTableColumn',
    './TelemetryTableUnitColumn',
    './TelemetryTableConfiguration'
], function (
    EventEmitter,
    _,
    TableRowCollection,
    TelemetryTableNameColumn,
    TelemetryTableColumn,
    TelemetryTableUnitColumn,
    TelemetryTableConfiguration
) {
    class TelemetryTable extends EventEmitter {
        constructor(domainObject, openmct) {
            super();

            this.domainObject = domainObject;
            this.openmct = openmct;
            this.rowCount = 100;
            this.tableComposition = undefined;
            this.datumCache = [];
            this.configuration = new TelemetryTableConfiguration(domainObject, openmct);
            this.paused = false;
            this.keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);
            this.telemetryCollections = {};

            this.addTelemetryObject = this.addTelemetryObject.bind(this);
            this.removeTelemetryObject = this.removeTelemetryObject.bind(this);
            this.isTelemetryObject = this.isTelemetryObject.bind(this);
            this.refreshData = this.refreshData.bind(this);
            this.updateFilters = this.updateFilters.bind(this);

            this.filterObserver = undefined;

            this.createTableRowCollections();

            openmct.time.on('bounds', this.refreshData);
            openmct.time.on('timeSystem', this.refreshData);
        }

        /**
         * @private
         */
        addNameColumn(telemetryObject, metadataValues) {
            let metadatum = metadataValues.find(m => m.key === 'name');
            if (!metadatum) {
                metadatum = {
                    format: 'string',
                    key: 'name',
                    name: 'Name'
                };
            }

            const column = new TelemetryTableNameColumn(this.openmct, telemetryObject, metadatum);

            this.configuration.addSingleColumnForObject(telemetryObject, column);
        }

        initialize() {
            if (this.domainObject.type === 'table') {
                this.filterObserver = this.openmct.objects.observe(this.domainObject, 'configuration.filters', this.updateFilters);
                this.filters = this.domainObject.configuration.filters;
                this.loadComposition();
            } else {
                this.addTelemetryObject(this.domainObject);
            }
        }

        createTableRowCollections() {
            this.tableRows = new TableRowCollection(this.openmct, this.domainObject, this.configuration);

            //Fetch any persisted default sort
            let sortOptions = this.configuration.getConfiguration().sortOptions;

            //If no persisted sort order, default to sorting by time system, ascending.
            sortOptions = sortOptions || {
                key: this.openmct.time.timeSystem().key,
                direction: 'asc'
            };

            this.tableRows.sortBy(sortOptions);
        }

        loadComposition() {
            this.tableComposition = this.openmct.composition.get(this.domainObject);

            if (this.tableComposition !== undefined) {
                this.tableComposition.load().then((composition) => {

                    composition = composition.filter(this.isTelemetryObject);
                    composition.forEach(this.addTelemetryObject);

                    this.tableComposition.on('add', this.addTelemetryObject);
                    this.tableComposition.on('remove', this.removeTelemetryObject);
                });
            }
        }

        addTelemetryObject(telemetryObject) {
            this.addColumnsForObject(telemetryObject, true);
            this.tableRows.addObject(telemetryObject);

            this.emit('object-added', telemetryObject);
        }

        updateFilters(updatedFilters) {
            let deepCopiedFilters = JSON.parse(JSON.stringify(updatedFilters));

            if (this.filters && !_.isEqual(this.filters, deepCopiedFilters)) {
                this.filters = deepCopiedFilters;
                this.tableRows.clearAndResubscribe();
            } else {
                this.filters = deepCopiedFilters;
            }
        }

        removeTelemetryObject(objectIdentifier) {
            this.configuration.removeColumnsForObject(objectIdentifier, true);
            this.tableRows.removeObject(objectIdentifier);

            this.emit('object-removed', objectIdentifier);
        }

        refreshData(bounds, isTick) {
            if (!isTick && this.tableRows.outstandingRequests === 0) {
                this.tableRows.clear();
                this.tableRows.sortBy({
                    key: this.openmct.time.timeSystem().key,
                    direction: 'asc'
                });
                this.tableRows.resubscribe();
            }
        }

        clearData() {
            this.tableRows.clear();
            this.emit('refresh');
        }

        addColumnsForObject(telemetryObject) {
            let metadataValues = this.openmct.telemetry.getMetadata(telemetryObject).values();

            this.addNameColumn(telemetryObject, metadataValues);
            metadataValues.forEach(metadatum => {
                if (metadatum.key === 'name') {
                    return;
                }

                let column = this.createColumn(metadatum);
                this.configuration.addSingleColumnForObject(telemetryObject, column);
                // add units column if available
                if (metadatum.unit !== undefined) {
                    let unitColumn = this.createUnitColumn(metadatum);
                    this.configuration.addSingleColumnForObject(telemetryObject, unitColumn);
                }
            });
        }

        createColumn(metadatum) {
            return new TelemetryTableColumn(this.openmct, metadatum);
        }

        createUnitColumn(metadatum) {
            return new TelemetryTableUnitColumn(this.openmct, metadatum);
        }

        isTelemetryObject(domainObject) {
            return Object.prototype.hasOwnProperty.call(domainObject, 'telemetry');
        }

        sortBy(sortOptions) {
            this.tableRows.sortBy(sortOptions);

            if (this.openmct.editor.isEditing()) {
                let configuration = this.configuration.getConfiguration();
                configuration.sortOptions = sortOptions;
                this.configuration.updateConfiguration(configuration);
            }
        }

        pause() {
            this.paused = true;
            this.tableRows.pause();
        }

        unpause() {
            this.paused = false;
            this.tableRows.unpause();
        }

        destroy() {
            this.tableRows.destroy();

            this.openmct.time.off('bounds', this.refreshData);
            this.openmct.time.off('timeSystem', this.refreshData);

            if (this.filterObserver) {
                this.filterObserver();
            }

            if (this.tableComposition !== undefined) {
                this.tableComposition.off('add', this.addTelemetryObject);
                this.tableComposition.off('remove', this.removeTelemetryObject);
            }
        }
    }

    return TelemetryTable;
});
