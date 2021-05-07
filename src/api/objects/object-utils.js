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

    /**
     * Utility for checking if a thing is an Open MCT Identifier.
     * @private
     */
    function isIdentifier(thing) {
        return typeof thing === 'object'
            && Object.prototype.hasOwnProperty.call(thing, 'key')
            && Object.prototype.hasOwnProperty.call(thing, 'namespace');
    }

    /**
     * Utility for checking if a thing is a key string.  Not perfect.
     * @private
     */
    function isKeyString(thing) {
        return typeof thing === 'string';
    }

    /**
     * Convert a keyString into an Open MCT Identifier, ex:
     * 'scratch:root' ==> {namespace: 'scratch', key: 'root'}
     *
     * Idempotent.
     *
     * @param keyString
     * @returns identifier
     */
    function parseKeyString(keyString) {
        if (isIdentifier(keyString)) {
            return keyString;
        }

        let namespace = '';
        let key = keyString;
        for (let i = 0; i < key.length; i++) {
            if (key[i] === "\\" && key[i + 1] === ":") {
                i++; // skip escape character.
            } else if (key[i] === ":") {
                key = key.slice(i + 1);
                break;
            }

            namespace += key[i];
        }

        if (keyString === namespace) {
            namespace = '';
        }

        return {
            namespace: namespace,
            key: key
        };
    }

    /**
     * Convert an Open MCT Identifier into a keyString, ex:
     * {namespace: 'scratch', key: 'root'} ==> 'scratch:root'
     *
     * Idempotent
     *
     * @param identifier
     * @returns keyString
     */
    function makeKeyString(identifier) {
        if (isKeyString(identifier)) {
            return identifier;
        }

        if (!identifier.namespace) {
            return identifier.key;
        }

        return [
            identifier.namespace.replace(/:/g, '\\:'),
            identifier.key
        ].join(':');
    }

    /**
     * Convert a new domain object into an old format model, removing the
     * identifier and converting the composition array from Open MCT Identifiers
     * to old format keyStrings.
     *
     * @param domainObject
     * @returns oldFormatModel
     */
    function toOldFormat(model) {
        model = JSON.parse(JSON.stringify(model));
        delete model.identifier;
        if (model.composition) {
            model.composition = model.composition.map(makeKeyString);
        }

        return model;
    }

    /**
     * Convert an old format domain object model into a new format domain
     * object.  Adds an identifier using the provided keyString, and converts
     * the composition array to utilize Open MCT Identifiers.
     *
     * @param model
     * @param keyString
     * @returns domainObject
     */
    function toNewFormat(model, keyString) {
        model = JSON.parse(JSON.stringify(model));
        model.identifier = parseKeyString(keyString);
        if (model.composition) {
            model.composition = model.composition.map(parseKeyString);
        }

        return model;
    }

    /**
     * Compare two Open MCT Identifiers, returning true if they are equal.
     *
     * @param identifier
     * @param otherIdentifier
     * @returns Boolean true if identifiers are equal.
     */
    function identifierEquals(a, b) {
        return a.key === b.key && a.namespace === b.namespace;
    }

    /**
     * Compare two domain objects, return true if they're the same object.
     * Equality is determined by identifier.
     *
     * @param domainObject
     * @param otherDomainOBject
     * @returns Boolean true if objects are equal.
     */
    function objectEquals(a, b) {
        return identifierEquals(a.identifier, b.identifier);
    }

    return {
        toOldFormat: toOldFormat,
        toNewFormat: toNewFormat,
        makeKeyString: makeKeyString,
        parseKeyString: parseKeyString,
        equals: objectEquals,
        identifierEquals: identifierEquals
    };
});
