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
    'objectUtils'
], function (
    utils
) {
    function ObjectServiceProvider(eventEmitter, objectService, instantiate, topic, $injector) {
        this.eventEmitter = eventEmitter;
        this.objectService = objectService;
        this.instantiate = instantiate;
        this.$injector = $injector;

        this.generalTopic = topic('mutation');
        this.bridgeEventBuses();
    }

    /**
     * Bridges old and new style mutation events to provide compatibility between the two APIs
     * @private
     */
    ObjectServiceProvider.prototype.bridgeEventBuses = function () {
        let removeGeneralTopicListener;
        let handleLegacyMutation;

        const handleMutation = function (newStyleObject) {
            const keyString = utils.makeKeyString(newStyleObject.identifier);
            const oldStyleObject = this.instantiate(utils.toOldFormat(newStyleObject), keyString);

            // Don't trigger self
            removeGeneralTopicListener();

            oldStyleObject.getCapability('mutation').mutate(function () {
                return utils.toOldFormat(newStyleObject);
            }, newStyleObject.modified);

            removeGeneralTopicListener = this.generalTopic.listen(handleLegacyMutation);
        }.bind(this);

        handleLegacyMutation = function (legacyObject) {
            const newStyleObject = utils.toNewFormat(legacyObject.getModel(), legacyObject.getId());
            const keystring = utils.makeKeyString(newStyleObject.identifier);

            this.eventEmitter.emit(keystring + ':$_synchronize_model', newStyleObject);
            this.eventEmitter.emit(keystring + ":*", newStyleObject);
            this.eventEmitter.emit('mutation', newStyleObject);
        }.bind(this);

        this.eventEmitter.on('mutation', handleMutation);
        removeGeneralTopicListener = this.generalTopic.listen(handleLegacyMutation);
    };

    ObjectServiceProvider.prototype.create = async function (object) {
        let model = utils.toOldFormat(object);

        let result = await this.getPersistenceService().createObject(
            this.getSpace(utils.makeKeyString(object.identifier)),
            object.identifier.key,
            model
        );

        return result;
    };

    ObjectServiceProvider.prototype.update = async function (object) {
        let model = utils.toOldFormat(object);

        let result = await this.getPersistenceService().updateObject(
            this.getSpace(utils.makeKeyString(object.identifier)),
            object.identifier.key,
            model
        );

        return result;
    };

    /**
     * Get the space in which this domain object is persisted;
     * this is useful when, for example, decided which space a
     * newly-created domain object should be persisted to (by
     * default, this should be the space of its containing
     * object.)
     *
     * @returns {string} the name of the space which should
     *          be used to persist this object
     */
    ObjectServiceProvider.prototype.getSpace = function (keystring) {
        return this.getIdentifierService().parse(keystring).getSpace();
    };

    ObjectServiceProvider.prototype.getIdentifierService = function () {
        if (this.identifierService === undefined) {
            this.identifierService = this.$injector.get('identifierService');
        }

        return this.identifierService;
    };

    ObjectServiceProvider.prototype.getPersistenceService = function () {
        if (this.persistenceService === undefined) {
            this.persistenceService = this.$injector.get('persistenceService');
        }

        return this.persistenceService;
    };

    ObjectServiceProvider.prototype.delete = function (object) {
        // TODO!
    };

    ObjectServiceProvider.prototype.get = function (key) {
        let keyString = utils.makeKeyString(key);

        return this.objectService.getObjects([keyString])
            .then(function (results) {
                let model = results[keyString].getModel();

                return utils.toNewFormat(model, key);
            });
    };

    ObjectServiceProvider.prototype.superSecretFallbackSearch = function (query, abortSignal) {
        const searchService = this.$injector.get('searchService');

        // need to pass the abortSignal down, so need to
        // pass in undefined for maxResults and filter on query
        return searchService.query(query, undefined, undefined, abortSignal);
    };

    // Injects new object API as a decorator so that it hijacks all requests.
    // Object providers implemented on new API should just work, old API should just work, many things may break.
    function LegacyObjectAPIInterceptor(openmct, ROOTS, instantiate, topic, objectService) {
        const eventEmitter = openmct.objects.eventEmitter;

        this.getObjects = function (keys, abortSignal) {
            const results = {};

            const promises = keys.map(function (keyString) {
                const key = utils.parseKeyString(keyString);

                return openmct.objects.get(key, abortSignal)
                    .then(function (object) {
                        object = utils.toOldFormat(object);
                        results[keyString] = instantiate(object, keyString);
                    });
            });

            return Promise.all(promises)
                .then(function () {
                    return results;
                });
        };

        openmct.objects.supersecretSetFallbackProvider(
            new ObjectServiceProvider(
                eventEmitter,
                objectService,
                instantiate,
                topic,
                openmct.$injector
            )
        );

        ROOTS.forEach(function (r) {
            openmct.objects.addRoot(utils.parseKeyString(r.id));
        });

        return this;
    }

    return LegacyObjectAPIInterceptor;
});
