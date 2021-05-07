/*****************************************************************************
 * Open openmct, Copyright (c) 2014-2021, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open openmct is licensed under the Apache License, Version 2.0 (the
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
 * Open openmct includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define([
    'lodash'
], function (
    _
) {

    /**
     * This is the default metadata provider; for any object with a "telemetry"
     * property, this provider will return the value of that property as the
     * telemetry metadata.
     *
     * This provider also implements legacy support for telemetry metadata
     * defined on the type.  Telemetry metadata definitions on type will be
     * depreciated in the future.
     */
    function DefaultMetadataProvider(openmct) {
        this.openmct = openmct;
    }

    /**
     * Applies to any domain object with a telemetry property, or whose type
     * definition has a telemetry property.
     */
    DefaultMetadataProvider.prototype.supportsMetadata = function (domainObject) {
        return Boolean(domainObject.telemetry) || Boolean(this.typeHasTelemetry(domainObject));
    };

    /**
     * Retrieves valueMetadata from legacy metadata.
     * @private
     */
    function valueMetadatasFromOldFormat(metadata) {
        const valueMetadatas = [];

        valueMetadatas.push({
            key: 'name',
            name: 'Name'
        });

        metadata.domains.forEach(function (domain, index) {
            const valueMetadata = _.clone(domain);
            valueMetadata.hints = {
                domain: index + 1
            };
            valueMetadatas.push(valueMetadata);
        });

        metadata.ranges.forEach(function (range, index) {
            const valueMetadata = _.clone(range);
            valueMetadata.hints = {
                range: index,
                priority: index + metadata.domains.length + 1
            };

            if (valueMetadata.type === 'enum') {
                valueMetadata.key = 'enum';
                valueMetadata.hints.y -= 10;
                valueMetadata.hints.range -= 10;
                valueMetadata.enumerations =
                    _.sortBy(valueMetadata.enumerations.map(function (e) {
                        return {
                            string: e.string,
                            value: Number(e.value)
                        };
                    }), 'e.value');
                valueMetadata.values = valueMetadata.enumerations.map(e => e.value);
                valueMetadata.max = Math.max(valueMetadata.values);
                valueMetadata.min = Math.min(valueMetadata.values);
            }

            valueMetadatas.push(valueMetadata);
        });

        return valueMetadatas;
    }

    /**
     * Returns telemetry metadata for a given domain object.
     */
    DefaultMetadataProvider.prototype.getMetadata = function (domainObject) {
        const metadata = domainObject.telemetry || {};
        if (this.typeHasTelemetry(domainObject)) {
            const typeMetadata = this.typeService.getType(domainObject.type).typeDef.telemetry;
            Object.assign(metadata, typeMetadata);
            if (!metadata.values) {
                metadata.values = valueMetadatasFromOldFormat(metadata);
            }
        }

        return metadata;
    };

    /**
     * @private
     */
    DefaultMetadataProvider.prototype.typeHasTelemetry = function (domainObject) {
        if (!this.typeService) {
            this.typeService = this.openmct.$injector.get('typeService');
        }

        return Boolean(this.typeService.getType(domainObject.type).typeDef.telemetry);
    };

    return DefaultMetadataProvider;

});
