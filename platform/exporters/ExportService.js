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

/**
 * @namespace platform/exporters
 */
define(['csv'], function (CSV) {

    /**
     * Callback used to initiate saving files from the export service;
     * typical implementation is
     * [FileSaver.js](https://github.com/eligrey/FileSaver.js/).
     * @callback platform/exporters.ExportService~saveAs
     * @param {Blob} blob the contents of the file to export
     * @param {string} filename the name of the file to export
     */

    /**
     * The `exportService` provides a means to initiate downloads of
     * structured data in the CSV format.
     * @param {platform/exporters.ExportService~saveAs} saveAs function
     *        used to initiate saving files
     * @constructor
     * @memberof platform/exporters
     */
    function ExportService(saveAs) {
        this.saveAs = saveAs;
    }

    /**
     * Export a set of data as comma-separated values. Triggers a download
     * using the function provided when the ExportService was instantiated.
     *
     * @param {Object[]} rows an array of objects containing key-value pairs,
     *        where keys are header names, and values are values
     * @param {ExportOptions} [options] additional parameters for the file
     *        export
     */
    ExportService.prototype.exportCSV = function (rows, options) {
        var headers = (options && options.headers)
                || (Object.keys((rows[0] || {})).sort()),
            filename = (options && options.filename) || "export.csv",
            csvText = new CSV(rows, { header: headers }).encode(),
            blob = new Blob([csvText], { type: "text/csv" });
        this.saveAs(blob, filename);
    };

    /**
     * Export an object as a JSON file. Triggers a download using the function
     * provided when the ExportService was instantiated.
     *
     * @param {Object} obj an object to be exported as JSON
     * @param {ExportOptions} [options] additional parameters for the file
     *        export
     */
    ExportService.prototype.exportJSON = function (obj, options) {
        var filename = (options && options.filename) || "test-export.json";
        var jsonText = JSON.stringify(obj);
        var blob = new Blob([jsonText], {type: "application/json"});
        this.saveAs(blob, filename);
    };
    /**
     * Additional parameters for file export.
     * @typedef ExportOptions
     * @property {string} filename the name of the file to write
     * @property {string[]} headers column header names, both as they
     *           should appear in the output and as they should be
     *           used to look up values from the data set. Defaults
     *           to the keys in the first object in the data set.
     */

    return ExportService;
});
