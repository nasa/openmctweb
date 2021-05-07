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

import EventEmitter from 'EventEmitter';

export default class StyleRuleManager extends EventEmitter {
    constructor(styleConfiguration, openmct, callback, suppressSubscriptionOnEdit) {
        super();
        this.openmct = openmct;
        this.callback = callback;
        if (suppressSubscriptionOnEdit) {
            this.openmct.editor.on('isEditing', this.toggleSubscription.bind(this));
            this.isEditing = this.openmct.editor.editing;
        }

        if (styleConfiguration) {
            this.initialize(styleConfiguration);
            if (styleConfiguration.conditionSetIdentifier) {
                this.subscribeToConditionSet();
            } else {
                this.applyStaticStyle();
            }
        }
    }

    toggleSubscription(isEditing) {
        this.isEditing = isEditing;
        if (this.isEditing) {
            if (this.stopProvidingTelemetry) {
                this.stopProvidingTelemetry();
                delete this.stopProvidingTelemetry;
            }

            if (this.conditionSetIdentifier) {
                this.applySelectedConditionStyle();
            }
        } else if (this.conditionSetIdentifier) {
            this.subscribeToConditionSet();
        }
    }

    initialize(styleConfiguration) {
        this.conditionSetIdentifier = styleConfiguration.conditionSetIdentifier;
        this.staticStyle = styleConfiguration.staticStyle;
        this.selectedConditionId = styleConfiguration.selectedConditionId;
        this.defaultConditionId = styleConfiguration.defaultConditionId;
        this.updateConditionStylesMap(styleConfiguration.styles || []);
    }

    subscribeToConditionSet() {
        if (this.stopProvidingTelemetry) {
            this.stopProvidingTelemetry();
            delete this.stopProvidingTelemetry;
        }

        this.openmct.objects.get(this.conditionSetIdentifier).then((conditionSetDomainObject) => {
            this.openmct.telemetry.request(conditionSetDomainObject)
                .then(output => {
                    if (output && output.length) {
                        this.handleConditionSetResultUpdated(output[0]);
                    }
                });
            this.stopProvidingTelemetry = this.openmct.telemetry.subscribe(conditionSetDomainObject, this.handleConditionSetResultUpdated.bind(this));
        });
    }

    updateObjectStyleConfig(styleConfiguration) {
        if (!styleConfiguration || !styleConfiguration.conditionSetIdentifier) {
            this.initialize(styleConfiguration || {});
            this.applyStaticStyle();
            this.destroy();
        } else {
            let isNewConditionSet = !this.conditionSetIdentifier
                                    || !this.openmct.objects.areIdsEqual(this.conditionSetIdentifier, styleConfiguration.conditionSetIdentifier);
            this.initialize(styleConfiguration);
            if (this.isEditing) {
                this.applySelectedConditionStyle();
            } else {
                //Only resubscribe if the conditionSet has changed.
                if (isNewConditionSet) {
                    this.subscribeToConditionSet();
                }
            }
        }
    }

    updateConditionStylesMap(conditionStyles) {
        let conditionStyleMap = {};
        conditionStyles.forEach((conditionStyle) => {
            if (conditionStyle.conditionId) {
                conditionStyleMap[conditionStyle.conditionId] = conditionStyle.style;
            } else {
                conditionStyleMap.static = conditionStyle.style;
            }
        });
        this.conditionalStyleMap = conditionStyleMap;
    }

    handleConditionSetResultUpdated(resultData) {
        let foundStyle = this.conditionalStyleMap[resultData.conditionId];
        if (foundStyle) {
            if (foundStyle !== this.currentStyle) {
                this.currentStyle = foundStyle;
            }

            this.updateDomainObjectStyle();
        } else {
            this.applyStaticStyle();
        }
    }

    updateDomainObjectStyle() {
        if (this.callback) {
            this.callback(Object.assign({}, this.currentStyle));
        }
    }

    applySelectedConditionStyle() {
        const conditionId = this.selectedConditionId || this.defaultConditionId;
        if (!conditionId) {
            this.applyStaticStyle();
        } else if (this.conditionalStyleMap[conditionId]) {
            this.currentStyle = this.conditionalStyleMap[conditionId];
            this.updateDomainObjectStyle();
        }
    }

    applyStaticStyle() {
        if (this.staticStyle) {
            this.currentStyle = this.staticStyle.style;
        } else {
            if (this.currentStyle) {
                Object.keys(this.currentStyle).forEach(key => {
                    this.currentStyle[key] = '__no_value';
                });
            }
        }

        this.updateDomainObjectStyle();
    }

    destroy() {
        if (this.stopProvidingTelemetry) {
            this.stopProvidingTelemetry();
            delete this.stopProvidingTelemetry;
        }

        this.conditionSetIdentifier = undefined;
    }

}
