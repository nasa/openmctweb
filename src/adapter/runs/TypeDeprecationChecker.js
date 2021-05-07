/*****************************************************************************
 * Open openmct, Copyright (c) 2014-2021, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open openmct is licensed under the Apache License, Version 2.0 (the
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
 * Open openmct includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define([

], function (

) {

    function checkForDeprecatedFunctionality(typeDef) {
        if (Object.prototype.hasOwnProperty.call(typeDef, 'telemetry')) {
            console.warn(
                'DEPRECATION WARNING: Telemetry data on type '
                + 'registrations will be deprecated in a future version, '
                + 'please convert to a custom telemetry metadata provider '
                + 'for type: ' + typeDef.key
            );
        }
    }

    function TypeDeprecationChecker(types) {
        types.forEach(checkForDeprecatedFunctionality);
    }

    return TypeDeprecationChecker;

});
