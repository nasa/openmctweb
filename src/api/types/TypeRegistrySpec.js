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

define(['./TypeRegistry', './Type'], function (TypeRegistry, Type) {
    describe('The Type API', function () {
        let typeRegistryInstance;

        beforeEach(function () {
            typeRegistryInstance = new TypeRegistry ();
            typeRegistryInstance.addType('testType', {
                name: 'Test Type',
                description: 'This is a test type.',
                creatable: true
            });
        });

        it('types can be standardized', function () {
            typeRegistryInstance.addType('standardizationTestType', {
                label: 'Test Type',
                description: 'This is a test type.',
                creatable: true
            });
            typeRegistryInstance.standardizeType(typeRegistryInstance.types.standardizationTestType);
            expect(typeRegistryInstance.get('standardizationTestType').definition.label).toBeUndefined();
            expect(typeRegistryInstance.get('standardizationTestType').definition.name).toBe('Test Type');
        });

        it('new types are registered successfully and can be retrieved', function () {
            expect(typeRegistryInstance.get('testType').definition.name).toBe('Test Type');
        });

        it('type registry contains new keys', function () {
            expect(typeRegistryInstance.listKeys ()).toContain('testType');
        });
    });
});
