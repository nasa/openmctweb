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

import { OPERATIONS } from "./operations";
let isOneOfOperation = OPERATIONS.find((operation) => operation.name === 'isOneOf');
let isNotOneOfOperation = OPERATIONS.find((operation) => operation.name === 'isNotOneOf');
let isBetween = OPERATIONS.find((operation) => operation.name === 'between');
let isNotBetween = OPERATIONS.find((operation) => operation.name === 'notBetween');
let enumIsOperation = OPERATIONS.find((operation) => operation.name === 'enumValueIs');
let enumIsNotOperation = OPERATIONS.find((operation) => operation.name === 'enumValueIsNot');

describe('operations', function () {

    it('should evaluate isOneOf to true for number inputs', () => {
        const inputs = [45, "5,6,45,8"];
        expect(Boolean(isOneOfOperation.operation(inputs))).toBeTrue();
    });

    it('should evaluate isOneOf to true for string inputs', () => {
        const inputs = ["45", " 45, 645, 4,8 "];
        expect(Boolean(isOneOfOperation.operation(inputs))).toBeTrue();
    });

    it('should evaluate isNotOneOf to true for number inputs', () => {
        const inputs = [45, "5,6,4,8"];
        expect(Boolean(isNotOneOfOperation.operation(inputs))).toBeTrue();
    });

    it('should evaluate isNotOneOf to true for string inputs', () => {
        const inputs = ["45", " 5,645, 4,8 "];
        expect(Boolean(isNotOneOfOperation.operation(inputs))).toBeTrue();
    });

    it('should evaluate isOneOf to false for number inputs', () => {
        const inputs = [4, "5, 6, 7, 8"];
        expect(Boolean(isOneOfOperation.operation(inputs))).toBeFalse();
    });

    it('should evaluate isOneOf to false for string inputs', () => {
        const inputs = ["4", "5,645 ,7,8"];
        expect(Boolean(isOneOfOperation.operation(inputs))).toBeFalse();
    });

    it('should evaluate isNotOneOf to false for number inputs', () => {
        const inputs = [4, "5,4, 7,8"];
        expect(Boolean(isNotOneOfOperation.operation(inputs))).toBeFalse();
    });

    it('should evaluate isNotOneOf to false for string inputs', () => {
        const inputs = ["4", "5,46,4,8"];
        expect(Boolean(isNotOneOfOperation.operation(inputs))).toBeFalse();
    });

    it('should evaluate isBetween to true', () => {
        const inputs = ["4", "3", "89"];
        expect(Boolean(isBetween.operation(inputs))).toBeTrue();
    });

    it('should evaluate isNotBetween to true', () => {
        const inputs = ["45", "100", "89"];
        expect(Boolean(isNotBetween.operation(inputs))).toBeTrue();
    });

    it('should evaluate isBetween to false', () => {
        const inputs = ["4", "100", "89"];
        expect(Boolean(isBetween.operation(inputs))).toBeFalse();
    });

    it('should evaluate isNotBetween to false', () => {
        const inputs = ["45", "30", "50"];
        expect(Boolean(isNotBetween.operation(inputs))).toBeFalse();
    });

    it('should evaluate enumValueIs to true for number inputs', () => {
        const inputs = [1, "1"];
        expect(Boolean(enumIsOperation.operation(inputs))).toBeTrue();
    });

    it('should evaluate enumValueIs to true for string inputs', () => {
        const inputs = ["45", "45"];
        expect(Boolean(enumIsOperation.operation(inputs))).toBeTrue();
    });

    it('should evaluate enumValueIsNot to true for number inputs', () => {
        const inputs = [45, "46"];
        expect(Boolean(enumIsNotOperation.operation(inputs))).toBeTrue();
    });

    it('should evaluate enumValueIsNot to true for string inputs', () => {
        const inputs = ["45", "46"];
        expect(Boolean(enumIsNotOperation.operation(inputs))).toBeTrue();
    });

    it('should evaluate enumValueIs to false for number inputs', () => {
        const inputs = [1, "2"];
        expect(Boolean(enumIsOperation.operation(inputs))).toBeFalse();
    });

    it('should evaluate enumValueIs to false for string inputs', () => {
        const inputs = ["45", "46"];
        expect(Boolean(enumIsOperation.operation(inputs))).toBeFalse();
    });

    it('should evaluate enumValueIsNot to false for number inputs', () => {
        const inputs = [45, "45"];
        expect(Boolean(enumIsNotOperation.operation(inputs))).toBeFalse();
    });

    it('should evaluate enumValueIsNot to false for string inputs', () => {
        const inputs = ["45", "45"];
        expect(Boolean(enumIsNotOperation.operation(inputs))).toBeFalse();
    });

    it('should evaluate enumValueIs to false for undefined input', () => {
        const inputs = [undefined, "45"];
        expect(Boolean(enumIsOperation.operation(inputs))).toBeFalse();
    });

    it('should evaluate enumValueIsNot to true for undefined input', () => {
        const inputs = [undefined, "45"];
        expect(Boolean(enumIsNotOperation.operation(inputs))).toBeTrue();
    });
});
