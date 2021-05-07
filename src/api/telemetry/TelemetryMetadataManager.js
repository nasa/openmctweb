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
    'lodash'
], function (
    _
) {

    function applyReasonableDefaults(valueMetadata, index) {
        valueMetadata.source = valueMetadata.source || valueMetadata.key;
        valueMetadata.hints = valueMetadata.hints || {};

        if (Object.prototype.hasOwnProperty.call(valueMetadata.hints, 'x')) {
            console.warn(
                'DEPRECATION WARNING: `x` hints should be replaced with '
                + '`domain` hints moving forward.  '
                + 'https://github.com/nasa/openmct/issues/1546'
            );
            if (!Object.prototype.hasOwnProperty.call(valueMetadata.hints, 'domain')) {
                valueMetadata.hints.domain = valueMetadata.hints.x;
            }

            delete valueMetadata.hints.x;
        }

        if (Object.prototype.hasOwnProperty.call(valueMetadata.hints, 'y')) {
            console.warn(
                'DEPRECATION WARNING: `y` hints should be replaced with '
                + '`range` hints moving forward.  '
                + 'https://github.com/nasa/openmct/issues/1546'
            );
            if (!Object.prototype.hasOwnProperty.call(valueMetadata.hints, 'range')) {
                valueMetadata.hints.range = valueMetadata.hints.y;
            }

            delete valueMetadata.hints.y;
        }

        if (valueMetadata.format === 'enum') {
            if (!valueMetadata.values) {
                valueMetadata.values = valueMetadata.enumerations.map(e => e.value);
            }

            if (!Object.prototype.hasOwnProperty.call(valueMetadata, 'max')) {
                valueMetadata.max = Math.max(valueMetadata.values) + 1;
            }

            if (!Object.prototype.hasOwnProperty.call(valueMetadata, 'min')) {
                valueMetadata.min = Math.min(valueMetadata.values) - 1;
            }
        }

        if (!Object.prototype.hasOwnProperty.call(valueMetadata.hints, 'priority')) {
            valueMetadata.hints.priority = index;
        }

        return valueMetadata;
    }

    /**
     * Utility class for handling and inspecting telemetry metadata.  Applies
     * reasonable defaults to simplify the task of providing metadata, while
     * also providing methods for interrogating telemetry metadata.
     */
    function TelemetryMetadataManager(metadata) {
        this.metadata = metadata;

        this.valueMetadatas = this.metadata.values ? this.metadata.values.map(applyReasonableDefaults) : [];
    }

    /**
     * Get value metadata for a single key.
     */
    TelemetryMetadataManager.prototype.value = function (key) {
        return this.valueMetadatas.filter(function (metadata) {
            return metadata.key === key;
        })[0];
    };

    /**
     * Returns all value metadatas, sorted by priority.
     */
    TelemetryMetadataManager.prototype.values = function () {
        return this.valuesForHints(['priority']);
    };

    /**
     * Get an array of valueMetadatas that posess all hints requested.
     * Array is sorted based on hint priority.
     *
     */
    TelemetryMetadataManager.prototype.valuesForHints = function (
        hints
    ) {
        function hasHint(hint) {
            // eslint-disable-next-line no-invalid-this
            return Object.prototype.hasOwnProperty.call(this.hints, hint);
        }

        function hasHints(metadata) {
            return hints.every(hasHint, metadata);
        }

        const matchingMetadata = this.valueMetadatas.filter(hasHints);
        let iteratees = hints.map(hint => {
            return (metadata) => {
                return metadata.hints[hint];
            };
        });

        return _.sortBy(matchingMetadata, ...iteratees);
    };

    TelemetryMetadataManager.prototype.getFilterableValues = function () {
        return this.valueMetadatas.filter(metadatum => metadatum.filters && metadatum.filters.length > 0);
    };

    TelemetryMetadataManager.prototype.getDefaultDisplayValue = function () {
        let valueMetadata = this.valuesForHints(['range'])[0];

        if (valueMetadata === undefined) {
            valueMetadata = this.values().filter(values => {
                return !(values.hints.domain);
            })[0];
        }

        if (valueMetadata === undefined) {
            valueMetadata = this.values()[0];
        }

        return valueMetadata.key;
    };

    return TelemetryMetadataManager;

});
