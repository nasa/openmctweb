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
    './SummaryWidgetEvaluator',
    'objectUtils'
], function (
    SummaryWidgetEvaluator,
    objectUtils
) {

    function EvaluatorPool(openmct) {
        this.openmct = openmct;
        this.byObjectId = {};
        this.byEvaluator = new WeakMap();
    }

    EvaluatorPool.prototype.get = function (domainObject) {
        const objectId = objectUtils.makeKeyString(domainObject.identifier);
        let poolEntry = this.byObjectId[objectId];
        if (!poolEntry) {
            poolEntry = {
                leases: 0,
                objectId: objectId,
                evaluator: new SummaryWidgetEvaluator(domainObject, this.openmct)
            };
            this.byEvaluator.set(poolEntry.evaluator, poolEntry);
            this.byObjectId[objectId] = poolEntry;
        }

        poolEntry.leases += 1;

        return poolEntry.evaluator;
    };

    EvaluatorPool.prototype.release = function (evaluator) {
        const poolEntry = this.byEvaluator.get(evaluator);
        poolEntry.leases -= 1;
        if (poolEntry.leases === 0) {
            evaluator.destroy();
            this.byEvaluator.delete(evaluator);
            delete this.byObjectId[poolEntry.objectId];
        }
    };

    return EvaluatorPool;
});
