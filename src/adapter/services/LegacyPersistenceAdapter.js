/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2020, United States Government
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

import objectUtils from 'objectUtils';

function LegacyPersistenceProvider(openmct) {
    this.openmct = openmct;
}

LegacyPersistenceProvider.prototype.listObjects = function () {
    return Promise.resolve([]);
};

LegacyPersistenceProvider.prototype.listSpaces = function () {
    return Promise.resolve(Object.keys(this.openmct.objects.providers));
};

LegacyPersistenceProvider.prototype.updateObject = function (legacyDomainObject) {
    return this.openmct.objects.save(legacyDomainObject.useCapability('adapter'));
};

LegacyPersistenceProvider.prototype.readObject = function (keystring) {
    let identifier = objectUtils.parseKeyString(keystring);

    return this.openmct.legacyObject(this.openmct.objects.get(identifier));
};

export default LegacyPersistenceProvider;
