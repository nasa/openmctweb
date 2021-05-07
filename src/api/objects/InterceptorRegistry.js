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
export default class InterceptorRegistry {
    /**
     * A InterceptorRegistry maintains the definitions for different interceptors that may be invoked on domain objects.
     * @interface InterceptorRegistry
     * @memberof module:openmct
     */
    constructor() {
        this.interceptors = [];
    }

    /**
     * @interface InterceptorDef
     * @property {function} appliesTo function that determines if this interceptor should be called for the given identifier/object
     * @property {function} invoke function that transforms the provided domain object and returns the transformed domain object
     * @property {function} priority the priority for this interceptor. A higher number returned has more weight than a lower number
     * @memberof module:openmct InterceptorRegistry#
     */

    /**
     * Register a new object interceptor.
     *
     * @param {module:openmct.InterceptorDef} interceptorDef the interceptor to add
     * @method addInterceptor
     * @memberof module:openmct.InterceptorRegistry#
     */
    addInterceptor(interceptorDef) {
        //TODO: sort by priority
        this.interceptors.push(interceptorDef);
    }

    /**
     * Retrieve all interceptors applicable to a domain object.
     * @method getInterceptors
     * @returns [module:openmct.InterceptorDef] the registered interceptors for this identifier/object
     * @memberof module:openmct.InterceptorRegistry#
     */
    getInterceptors(identifier, object) {
        return this.interceptors.filter(interceptor => {
            return typeof interceptor.appliesTo === 'function'
                && interceptor.appliesTo(identifier, object);
        });
    }

}

