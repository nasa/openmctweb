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
    './SummaryWidgetRule',
    '../eventHelpers',
    'objectUtils',
    'lodash'
], function (
    SummaryWidgetRule,
    eventHelpers,
    objectUtils,
    _
) {

    /**
     * evaluates rules defined in a summary widget against either lad or
     * realtime state.
     *
     */
    function SummaryWidgetEvaluator(domainObject, openmct) {
        this.openmct = openmct;
        this.baseState = {};

        this.updateRules(domainObject);
        this.removeObserver = openmct.objects.observe(
            domainObject,
            '*',
            this.updateRules.bind(this)
        );

        const composition = openmct.composition.get(domainObject);

        this.listenTo(composition, 'add', this.addChild, this);
        this.listenTo(composition, 'remove', this.removeChild, this);

        this.loadPromise = composition.load();
    }

    eventHelpers.extend(SummaryWidgetEvaluator.prototype);

    /**
     * Subscribes to realtime telemetry for the given summary widget.
     */
    SummaryWidgetEvaluator.prototype.subscribe = function (callback) {
        let active = true;
        let unsubscribes = [];

        this.getBaseStateClone()
            .then(function (realtimeStates) {
                if (!active) {
                    return;
                }

                const updateCallback = function () {
                    const datum = this.evaluateState(
                        realtimeStates,
                        this.openmct.time.timeSystem().key
                    );
                    if (datum) {
                        callback(datum);
                    }
                }.bind(this);

                /* eslint-disable you-dont-need-lodash-underscore/map */
                unsubscribes = _.map(
                    realtimeStates,
                    this.subscribeToObjectState.bind(this, updateCallback)
                );
                /* eslint-enable you-dont-need-lodash-underscore/map */
            }.bind(this));

        return function () {
            active = false;
            unsubscribes.forEach(function (unsubscribe) {
                unsubscribe();
            });
        };
    };

    /**
     * Returns a promise for a telemetry datum obtained by evaluating the
     * current lad data.
     */
    SummaryWidgetEvaluator.prototype.requestLatest = function (options) {
        return this.getBaseStateClone()
            .then(function (ladState) {
                const promises = Object.values(ladState)
                    .map(this.updateObjectStateFromLAD.bind(this, options));

                return Promise.all(promises)
                    .then(function () {
                        return ladState;
                    });
            }.bind(this))
            .then(function (ladStates) {
                return this.evaluateState(ladStates, options.domain);
            }.bind(this));
    };

    SummaryWidgetEvaluator.prototype.updateRules = function (domainObject) {
        this.rules = domainObject.configuration.ruleOrder.map(function (ruleId) {
            return new SummaryWidgetRule(domainObject.configuration.ruleConfigById[ruleId]);
        });
    };

    SummaryWidgetEvaluator.prototype.addChild = function (childObject) {
        const childId = objectUtils.makeKeyString(childObject.identifier);
        const metadata = this.openmct.telemetry.getMetadata(childObject);
        const formats = this.openmct.telemetry.getFormatMap(metadata);

        this.baseState[childId] = {
            id: childId,
            domainObject: childObject,
            metadata: metadata,
            formats: formats
        };
    };

    SummaryWidgetEvaluator.prototype.removeChild = function (childObject) {
        const childId = objectUtils.makeKeyString(childObject.identifier);
        delete this.baseState[childId];
    };

    SummaryWidgetEvaluator.prototype.load = function () {
        return this.loadPromise;
    };

    /**
     * Return a promise for a 2-deep clone of the base state object: object
     * states are shallow cloned, and then assembled and returned as a new base
     * state.  Allows object states to be mutated while sharing telemetry
     * metadata and formats.
     */
    SummaryWidgetEvaluator.prototype.getBaseStateClone = function () {
        return this.load()
            .then(function () {
                /* eslint-disable you-dont-need-lodash-underscore/values */
                return _(this.baseState)
                    .values()
                    .map(_.clone)
                    .keyBy('id')
                    .value();
                /* eslint-enable you-dont-need-lodash-underscore/values */
            }.bind(this));
    };

    /**
     * Subscribes to realtime updates for a given objectState, and invokes
     * the supplied callback when objectState has been updated.  Returns
     * a function to unsubscribe.
     * @private.
     */
    SummaryWidgetEvaluator.prototype.subscribeToObjectState = function (callback, objectState) {
        return this.openmct.telemetry.subscribe(
            objectState.domainObject,
            function (datum) {
                objectState.lastDatum = datum;
                objectState.timestamps = this.getTimestamps(objectState.id, datum);
                callback();
            }.bind(this)
        );
    };

    /**
     * Given an object state, will return a promise that is resolved when the
     * object state has been updated from the LAD.
     * @private.
     */
    SummaryWidgetEvaluator.prototype.updateObjectStateFromLAD = function (options, objectState) {
        options = Object.assign({}, options, {
            strategy: 'latest',
            size: 1
        });

        return this.openmct
            .telemetry
            .request(
                objectState.domainObject,
                options
            )
            .then(function (results) {
                objectState.lastDatum = results[results.length - 1];
                objectState.timestamps = this.getTimestamps(
                    objectState.id,
                    objectState.lastDatum
                );
            }.bind(this));
    };

    /**
     * Returns an object containing all domain values in a datum.
     * @private.
     */
    SummaryWidgetEvaluator.prototype.getTimestamps = function (childId, datum) {
        const timestampedDatum = {};
        this.openmct.time.getAllTimeSystems().forEach(function (timeSystem) {
            timestampedDatum[timeSystem.key] =
                this.baseState[childId].formats[timeSystem.key].parse(datum);
        }, this);

        return timestampedDatum;
    };

    /**
     * Given a base datum(containing timestamps) and rule index, adds values
     * from the matching rule.
     * @private
     */
    SummaryWidgetEvaluator.prototype.makeDatumFromRule = function (ruleIndex, baseDatum) {
        const rule = this.rules[ruleIndex];

        baseDatum.ruleLabel = rule.label;
        baseDatum.ruleName = rule.name;
        baseDatum.message = rule.message;
        baseDatum.ruleIndex = ruleIndex;
        baseDatum.backgroundColor = rule.style['background-color'];
        baseDatum.textColor = rule.style.color;
        baseDatum.borderColor = rule.style['border-color'];
        baseDatum.icon = rule.icon;

        return baseDatum;
    };

    /**
     * Evaluate a `state` object and return a summary widget telemetry datum.
     * Datum timestamps will be taken from the "latest" datum in the `state`
     * where "latest" is the datum with the largest value for the given
     * `timestampKey`.
     * @private.
     */
    SummaryWidgetEvaluator.prototype.evaluateState = function (state, timestampKey) {
        const hasRequiredData = Object.keys(state).reduce(function (itDoes, k) {
            return itDoes && state[k].lastDatum;
        }, true);
        if (!hasRequiredData) {
            return;
        }

        let i;
        for (i = this.rules.length - 1; i > 0; i--) {
            if (this.rules[i].evaluate(state, false)) {
                break;
            }
        }

        /* eslint-disable you-dont-need-lodash-underscore/map */
        let latestTimestamp = _(state)
            .map('timestamps')
            .sortBy(timestampKey)
            .last();
        /* eslint-enable you-dont-need-lodash-underscore/map */

        if (!latestTimestamp) {
            latestTimestamp = {};
        }

        const baseDatum = _.clone(latestTimestamp);

        return this.makeDatumFromRule(i, baseDatum);
    };

    /**
     * remove all listeners and clean up any resources.
     */
    SummaryWidgetEvaluator.prototype.destroy = function () {
        this.stopListening();
        this.removeObserver();
    };

    return SummaryWidgetEvaluator;

});
