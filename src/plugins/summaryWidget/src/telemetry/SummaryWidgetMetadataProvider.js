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

], function (

) {

    function SummaryWidgetMetadataProvider(openmct) {
        this.openmct = openmct;
    }

    SummaryWidgetMetadataProvider.prototype.supportsMetadata = function (domainObject) {
        return domainObject.type === 'summary-widget';
    };

    SummaryWidgetMetadataProvider.prototype.getDomains = function (domainObject) {
        return this.openmct.time.getAllTimeSystems().map(function (ts, i) {
            return {
                key: ts.key,
                name: ts.name,
                format: ts.timeFormat,
                hints: {
                    domain: i
                }
            };
        });
    };

    SummaryWidgetMetadataProvider.prototype.getMetadata = function (domainObject) {
        const ruleOrder = domainObject.configuration.ruleOrder || [];
        const enumerations = ruleOrder
            .filter(function (ruleId) {
                return Boolean(domainObject.configuration.ruleConfigById[ruleId]);
            })
            .map(function (ruleId, ruleIndex) {
                return {
                    string: domainObject.configuration.ruleConfigById[ruleId].label,
                    value: ruleIndex
                };
            });

        const metadata = {
            // Generally safe assumption is that we have one domain per timeSystem.
            values: this.getDomains().concat([
                {
                    name: 'State',
                    key: 'state',
                    source: 'ruleIndex',
                    format: 'enum',
                    enumerations: enumerations,
                    hints: {
                        range: 1
                    }
                },
                {
                    name: 'Rule Label',
                    key: 'ruleLabel',
                    format: 'string'
                },
                {
                    name: 'Rule Name',
                    key: 'ruleName',
                    format: 'string'
                },
                {
                    name: 'Message',
                    key: 'message',
                    format: 'string'
                },
                {
                    name: 'Background Color',
                    key: 'backgroundColor',
                    format: 'string'
                },
                {
                    name: 'Text Color',
                    key: 'textColor',
                    format: 'string'
                },
                {
                    name: 'Border Color',
                    key: 'borderColor',
                    format: 'string'
                },
                {
                    name: 'Display Icon',
                    key: 'icon',
                    format: 'string'
                }
            ])
        };

        return metadata;
    };

    return SummaryWidgetMetadataProvider;

});
