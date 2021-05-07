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

/**
 * A CouchDocument describes domain object model in a format
 * which is easily read-written to CouchDB. This includes
 * Couch's _id and _rev fields, as well as a separate
 * metadata field which contains a subset of information found
 * in the model itself (to support search optimization with
 * CouchDB views.)
 * @memberof platform/persistence/couch
 * @constructor
 * @param {string} id the id under which to store this mode
 * @param {object} model the model to store
 * @param {string} rev the revision to include (or undefined,
 *        if no revision should be noted for couch)
 * @param {boolean} whether or not to mark this document as
 *        deleted (see CouchDB docs for _deleted)
 */
export default function CouchDocument(id, model, rev, markDeleted) {
    return {
        "_id": id,
        "_rev": rev,
        "_deleted": markDeleted,
        "metadata": {
            "category": "domain object",
            "type": model.type,
            "owner": "admin",
            "name": model.name,
            "created": Date.now()
        },
        "model": model
    };
}
