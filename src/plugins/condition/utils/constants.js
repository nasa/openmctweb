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

export const TRIGGER = {
    ANY: 'any',
    ALL: 'all',
    NOT: 'not',
    XOR: 'xor'
};

export const TRIGGER_LABEL = {
    'any': 'any criteria are met',
    'all': 'all criteria are met',
    'not': 'no criteria are met',
    'xor': 'only one criterion is met'
};

export const TRIGGER_CONJUNCTION = {
    'any': 'or',
    'all': 'and',
    'not': 'and',
    'xor': 'or'
};

export const STYLE_CONSTANTS = {
    isStyleInvisible: 'is-style-invisible',
    borderColorTitle: 'Set border color',
    textColorTitle: 'Set text color',
    backgroundColorTitle: 'Set background color',
    imagePropertiesTitle: 'Edit image properties',
    visibilityHidden: 'Hidden',
    visibilityVisible: 'Visible'
};

export const ERROR = {
    'TELEMETRY_NOT_FOUND': {
        errorText: 'Telemetry not found for criterion'
    },
    'CONDITION_NOT_FOUND': {
        errorText: 'Condition not found'
    }
};
