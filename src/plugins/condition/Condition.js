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
import uuid from 'uuid';
import TelemetryCriterion from "./criterion/TelemetryCriterion";
import { evaluateResults } from './utils/evaluator';
import { getLatestTimestamp } from './utils/time';
import AllTelemetryCriterion from "./criterion/AllTelemetryCriterion";
import {TRIGGER_CONJUNCTION, TRIGGER_LABEL} from "./utils/constants";

/*
* conditionConfiguration = {
*   id: uuid,
*   trigger: 'any'/'all'/'not','xor',
*   criteria: [
*       {
*           telemetry: '',
*           operation: '',
*           input: [],
*           metadata: ''
*       }
*   ]
* }
*/
export default class Condition extends EventEmitter {

    /**
     * Manages criteria and emits the result of - true or false - based on criteria evaluated.
     * @constructor
     * @param conditionConfiguration: {id: uuid,trigger: enum, criteria: Array of {id: uuid, operation: enum, input: Array, metaDataKey: string, key: {domainObject.identifier} }
     * @param openmct
     * @param conditionManager
     */
    constructor(conditionConfiguration, openmct, conditionManager) {
        super();

        this.openmct = openmct;
        this.conditionManager = conditionManager;
        this.id = conditionConfiguration.id;
        this.criteria = [];
        this.result = undefined;
        this.timeSystems = this.openmct.time.getAllTimeSystems();
        if (conditionConfiguration.configuration.criteria) {
            this.createCriteria(conditionConfiguration.configuration.criteria);
        }

        this.trigger = conditionConfiguration.configuration.trigger;
        this.description = '';
    }

    updateResult(datum) {
        if (!datum || !datum.id) {
            console.log('no data received');

            return;
        }

        // if all the criteria in this condition have no telemetry, we want to force the condition result to evaluate
        if (this.hasNoTelemetry() || this.isTelemetryUsed(datum.id)) {

            this.criteria.forEach(criterion => {
                if (this.isAnyOrAllTelemetry(criterion)) {
                    criterion.updateResult(datum, this.conditionManager.telemetryObjects);
                } else {
                    if (criterion.usesTelemetry(datum.id)) {
                        criterion.updateResult(datum);
                    }
                }
            });

            this.result = evaluateResults(this.criteria.map(criterion => criterion.result), this.trigger);
        }
    }

    isAnyOrAllTelemetry(criterion) {
        return (criterion.telemetry && (criterion.telemetry === 'all' || criterion.telemetry === 'any'));
    }

    hasNoTelemetry() {
        return this.criteria.every((criterion) => {
            return !this.isAnyOrAllTelemetry(criterion) && criterion.telemetry === '';
        });
    }

    isTelemetryUsed(id) {
        return this.criteria.some(criterion => {
            return this.isAnyOrAllTelemetry(criterion) || criterion.usesTelemetry(id);
        });
    }

    update(conditionConfiguration) {
        this.updateTrigger(conditionConfiguration.configuration.trigger);
        this.updateCriteria(conditionConfiguration.configuration.criteria);
    }

    updateTrigger(trigger) {
        if (this.trigger !== trigger) {
            this.trigger = trigger;
        }
    }

    generateCriterion(criterionConfiguration) {
        return {
            id: criterionConfiguration.id || uuid(),
            telemetry: criterionConfiguration.telemetry || '',
            telemetryObjects: this.conditionManager.telemetryObjects,
            operation: criterionConfiguration.operation || '',
            input: criterionConfiguration.input === undefined ? [] : criterionConfiguration.input,
            metadata: criterionConfiguration.metadata || ''
        };
    }

    createCriteria(criterionConfigurations) {
        criterionConfigurations.forEach((criterionConfiguration) => {
            this.addCriterion(criterionConfiguration);
        });
        this.updateDescription();
    }

    updateCriteria(criterionConfigurations) {
        this.destroyCriteria();
        this.createCriteria(criterionConfigurations);
    }

    updateTelemetryObjects() {
        this.criteria.forEach((criterion) => {
            criterion.updateTelemetryObjects(this.conditionManager.telemetryObjects);
        });
        this.updateDescription();
    }

    /**
     *  adds criterion to the condition.
     */
    addCriterion(criterionConfiguration) {
        let criterion;
        let criterionConfigurationWithId = this.generateCriterion(criterionConfiguration || null);
        if (criterionConfiguration.telemetry && (criterionConfiguration.telemetry === 'any' || criterionConfiguration.telemetry === 'all')) {
            criterion = new AllTelemetryCriterion(criterionConfigurationWithId, this.openmct);
        } else {
            criterion = new TelemetryCriterion(criterionConfigurationWithId, this.openmct);
        }

        criterion.on('criterionUpdated', (obj) => this.handleCriterionUpdated(obj));
        criterion.on('telemetryIsStale', (obj) => this.handleStaleCriterion(obj));
        if (!this.criteria) {
            this.criteria = [];
        }

        this.criteria.push(criterion);

        return criterionConfigurationWithId.id;
    }

    findCriterion(id) {
        let criterion;

        for (let i = 0, ii = this.criteria.length; i < ii; i++) {
            if (this.criteria[i].id === id) {
                criterion = {
                    item: this.criteria[i],
                    index: i
                };
            }
        }

        return criterion;
    }

    updateCriterion(id, criterionConfiguration) {
        let found = this.findCriterion(id);
        if (found) {
            const newCriterionConfiguration = this.generateCriterion(criterionConfiguration);
            let newCriterion = new TelemetryCriterion(newCriterionConfiguration, this.openmct);
            newCriterion.on('criterionUpdated', (obj) => this.handleCriterionUpdated(obj));
            newCriterion.on('telemetryIsStale', (obj) => this.handleStaleCriterion(obj));

            let criterion = found.item;
            criterion.unsubscribe();
            criterion.off('criterionUpdated', (obj) => this.handleCriterionUpdated(obj));
            criterion.off('telemetryIsStale', (obj) => this.handleStaleCriterion(obj));
            this.criteria.splice(found.index, 1, newCriterion);
            this.updateDescription();
        }
    }

    destroyCriterion(id) {
        let found = this.findCriterion(id);
        if (found) {
            let criterion = found.item;
            criterion.off('criterionUpdated', (obj) => {
                this.handleCriterionUpdated(obj);
            });
            criterion.off('telemetryIsStale', (obj) => {
                this.handleStaleCriterion(obj);
            });
            criterion.destroy();
            this.criteria.splice(found.index, 1);
            this.updateDescription();

            return true;
        }

        return false;
    }

    handleCriterionUpdated(criterion) {
        let found = this.findCriterion(criterion.id);
        if (found) {
            this.criteria[found.index] = criterion.data;
            this.updateDescription();
        }
    }

    handleStaleCriterion(updatedCriterion) {
        this.result = evaluateResults(this.criteria.map(criterion => criterion.result), this.trigger);
        let latestTimestamp = {};
        latestTimestamp = getLatestTimestamp(
            latestTimestamp,
            updatedCriterion.data,
            this.timeSystems,
            this.openmct.time.timeSystem()
        );
        this.conditionManager.updateCurrentCondition(latestTimestamp);
    }

    updateDescription() {
        const triggerDescription = this.getTriggerDescription();
        let description = '';
        this.criteria.forEach((criterion, index) => {
            if (!index) {
                description = `Match if ${triggerDescription.prefix}`;
            }

            description = `${description} ${criterion.getDescription()} ${(index < this.criteria.length - 1) ? triggerDescription.conjunction : ''}`;
        });
        this.description = description;
        this.conditionManager.updateConditionDescription(this);
    }

    getTriggerDescription() {
        if (this.trigger) {
            return {
                conjunction: TRIGGER_CONJUNCTION[this.trigger],
                prefix: `${TRIGGER_LABEL[this.trigger]}: `
            };
        } else {
            return {
                conjunction: '',
                prefix: ''
            };
        }
    }

    requestLADConditionResult() {
        let latestTimestamp;
        let criteriaResults = {};
        const criteriaRequests = this.criteria
            .map(criterion => criterion.requestLAD(this.conditionManager.telemetryObjects));

        return Promise.all(criteriaRequests)
            .then(results => {
                results.forEach(resultObj => {
                    const { id, data, data: { result } } = resultObj;
                    if (this.findCriterion(id)) {
                        criteriaResults[id] = Boolean(result);
                    }

                    latestTimestamp = getLatestTimestamp(
                        latestTimestamp,
                        data,
                        this.timeSystems,
                        this.openmct.time.timeSystem()
                    );
                });

                return {
                    id: this.id,
                    data: Object.assign(
                        {},
                        latestTimestamp,
                        { result: evaluateResults(Object.values(criteriaResults), this.trigger) }
                    )
                };
            });
    }

    getCriteria() {
        return this.criteria;
    }

    destroyCriteria() {
        let success = true;
        //looping through the array backwards since destroyCriterion modifies the criteria array
        for (let i = this.criteria.length - 1; i >= 0; i--) {
            success = success && this.destroyCriterion(this.criteria[i].id);
        }

        return success;
    }

    destroy() {
        this.destroyCriteria();
    }
}
