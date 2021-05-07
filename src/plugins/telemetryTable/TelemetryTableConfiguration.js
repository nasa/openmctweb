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
    'lodash',
    'EventEmitter'
], function (_, EventEmitter) {

    class TelemetryTableConfiguration extends EventEmitter {
        constructor(domainObject, openmct) {
            super();

            this.domainObject = domainObject;
            this.openmct = openmct;
            this.columns = {};

            this.removeColumnsForObject = this.removeColumnsForObject.bind(this);
            this.objectMutated = this.objectMutated.bind(this);
            //Make copy of configuration, otherwise change detection is impossible if shared instance is being modified.
            this.oldConfiguration = JSON.parse(JSON.stringify(this.getConfiguration()));
        }

        getConfiguration() {
            let configuration = this.domainObject.configuration || {};
            configuration.hiddenColumns = configuration.hiddenColumns || {};
            configuration.columnWidths = configuration.columnWidths || {};
            configuration.columnOrder = configuration.columnOrder || [];
            configuration.cellFormat = configuration.cellFormat || {};
            configuration.autosize = configuration.autosize === undefined ? true : configuration.autosize;

            return configuration;
        }

        updateConfiguration(configuration) {
            this.openmct.objects.mutate(this.domainObject, 'configuration', configuration);
        }

        /**
         * @private
         * @param {*} object
         */
        objectMutated(object) {
            //Synchronize domain object reference. Duplicate object otherwise change detection becomes impossible.
            this.domainObject = object;
            //Was it the configuration that changed?
            if (object.configuration !== undefined && !_.eq(object.configuration, this.oldConfiguration)) {
                //Make copy of configuration, otherwise change detection is impossible if shared instance is being modified.
                this.oldConfiguration = JSON.parse(JSON.stringify(this.getConfiguration()));
                this.emit('change', object.configuration);
            }
        }

        addSingleColumnForObject(telemetryObject, column, position) {
            let objectKeyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
            this.columns[objectKeyString] = this.columns[objectKeyString] || [];
            position = position || this.columns[objectKeyString].length;
            this.columns[objectKeyString].splice(position, 0, column);
        }

        removeColumnsForObject(objectIdentifier) {
            let objectKeyString = this.openmct.objects.makeKeyString(objectIdentifier);
            let columnsToRemove = this.columns[objectKeyString];

            delete this.columns[objectKeyString];

            let configuration = this.domainObject.configuration;
            let configurationChanged = false;
            columnsToRemove.forEach((column) => {
                //There may be more than one column with the same key (eg. time system columns)
                if (!this.hasColumnWithKey(column.getKey())) {
                    delete configuration.hiddenColumns[column.getKey()];
                    configurationChanged = true;
                }
            });
            if (configurationChanged) {
                this.updateConfiguration(configuration);
            }
        }

        hasColumnWithKey(columnKey) {
            return _.flatten(Object.values(this.columns))
                .some(column => column.getKey() === columnKey);
        }

        getColumns() {
            return this.columns;
        }

        getAllHeaders() {
            let flattenedColumns = _.flatten(Object.values(this.columns));
            /* eslint-disable you-dont-need-lodash-underscore/uniq */
            let headers = _.uniq(flattenedColumns, false, column => column.getKey())
                .reduce(fromColumnsToHeadersMap, {});
            /* eslint-enable you-dont-need-lodash-underscore/uniq */
            function fromColumnsToHeadersMap(headersMap, column) {
                headersMap[column.getKey()] = column.getTitle();

                return headersMap;
            }

            return headers;
        }

        getVisibleHeaders() {
            let allHeaders = this.getAllHeaders();
            let configuration = this.getConfiguration();

            let orderedColumns = this.getColumnOrder();
            let unorderedColumns = _.difference(Object.keys(allHeaders), orderedColumns);

            return orderedColumns.concat(unorderedColumns)
                .filter((headerKey) => {
                    return configuration.hiddenColumns[headerKey] !== true;
                })
                .reduce((headers, headerKey) => {
                    headers[headerKey] = allHeaders[headerKey];

                    return headers;
                }, {});
        }

        getColumnWidths() {
            let configuration = this.getConfiguration();

            return configuration.columnWidths;
        }

        setColumnWidths(columnWidths) {
            let configuration = this.getConfiguration();
            configuration.columnWidths = columnWidths;
            this.updateConfiguration(configuration);
        }

        getColumnOrder() {
            let configuration = this.getConfiguration();

            return configuration.columnOrder;
        }

        setColumnOrder(columnOrder) {
            let configuration = this.getConfiguration();
            configuration.columnOrder = columnOrder;
            this.updateConfiguration(configuration);
        }

        destroy() {}
    }

    return TelemetryTableConfiguration;
});
