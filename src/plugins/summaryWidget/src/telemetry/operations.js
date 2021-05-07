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
    const OPERATIONS = {
        equalTo: {
            operation: function (input) {
                return input[0] === input[1];
            },
            text: 'is equal to',
            appliesTo: ['number'],
            inputCount: 1,
            getDescription: function (values) {
                return ' == ' + values[0];
            }
        },
        notEqualTo: {
            operation: function (input) {
                return input[0] !== input[1];
            },
            text: 'is not equal to',
            appliesTo: ['number'],
            inputCount: 1,
            getDescription: function (values) {
                return ' != ' + values[0];
            }
        },
        greaterThan: {
            operation: function (input) {
                return input[0] > input[1];
            },
            text: 'is greater than',
            appliesTo: ['number'],
            inputCount: 1,
            getDescription: function (values) {
                return ' > ' + values[0];
            }
        },
        lessThan: {
            operation: function (input) {
                return input[0] < input[1];
            },
            text: 'is less than',
            appliesTo: ['number'],
            inputCount: 1,
            getDescription: function (values) {
                return ' < ' + values[0];
            }
        },
        greaterThanOrEq: {
            operation: function (input) {
                return input[0] >= input[1];
            },
            text: 'is greater than or equal to',
            appliesTo: ['number'],
            inputCount: 1,
            getDescription: function (values) {
                return ' >= ' + values[0];
            }
        },
        lessThanOrEq: {
            operation: function (input) {
                return input[0] <= input[1];
            },
            text: 'is less than or equal to',
            appliesTo: ['number'],
            inputCount: 1,
            getDescription: function (values) {
                return ' <= ' + values[0];
            }
        },
        between: {
            operation: function (input) {
                return input[0] > input[1] && input[0] < input[2];
            },
            text: 'is between',
            appliesTo: ['number'],
            inputCount: 2,
            getDescription: function (values) {
                return ' between ' + values[0] + ' and ' + values[1];
            }
        },
        notBetween: {
            operation: function (input) {
                return input[0] < input[1] || input[0] > input[2];
            },
            text: 'is not between',
            appliesTo: ['number'],
            inputCount: 2,
            getDescription: function (values) {
                return ' not between ' + values[0] + ' and ' + values[1];
            }
        },
        textContains: {
            operation: function (input) {
                return input[0] && input[1] && input[0].includes(input[1]);
            },
            text: 'text contains',
            appliesTo: ['string'],
            inputCount: 1,
            getDescription: function (values) {
                return ' contains ' + values[0];
            }
        },
        textDoesNotContain: {
            operation: function (input) {
                return input[0] && input[1] && !input[0].includes(input[1]);
            },
            text: 'text does not contain',
            appliesTo: ['string'],
            inputCount: 1,
            getDescription: function (values) {
                return ' does not contain ' + values[0];
            }
        },
        textStartsWith: {
            operation: function (input) {
                return input[0].startsWith(input[1]);
            },
            text: 'text starts with',
            appliesTo: ['string'],
            inputCount: 1,
            getDescription: function (values) {
                return ' starts with ' + values[0];
            }
        },
        textEndsWith: {
            operation: function (input) {
                return input[0].endsWith(input[1]);
            },
            text: 'text ends with',
            appliesTo: ['string'],
            inputCount: 1,
            getDescription: function (values) {
                return ' ends with ' + values[0];
            }
        },
        textIsExactly: {
            operation: function (input) {
                return input[0] === input[1];
            },
            text: 'text is exactly',
            appliesTo: ['string'],
            inputCount: 1,
            getDescription: function (values) {
                return ' is exactly ' + values[0];
            }
        },
        isUndefined: {
            operation: function (input) {
                return typeof input[0] === 'undefined';
            },
            text: 'is undefined',
            appliesTo: ['string', 'number', 'enum'],
            inputCount: 0,
            getDescription: function () {
                return ' is undefined';
            }
        },
        isDefined: {
            operation: function (input) {
                return typeof input[0] !== 'undefined';
            },
            text: 'is defined',
            appliesTo: ['string', 'number', 'enum'],
            inputCount: 0,
            getDescription: function () {
                return ' is defined';
            }
        },
        enumValueIs: {
            operation: function (input) {
                return input[0] === input[1];
            },
            text: 'is',
            appliesTo: ['enum'],
            inputCount: 1,
            getDescription: function (values) {
                return ' == ' + values[0];
            }
        },
        enumValueIsNot: {
            operation: function (input) {
                return input[0] !== input[1];
            },
            text: 'is not',
            appliesTo: ['enum'],
            inputCount: 1,
            getDescription: function (values) {
                return ' != ' + values[0];
            }
        }
    };

    return OPERATIONS;
});
