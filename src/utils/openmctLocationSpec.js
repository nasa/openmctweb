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
import {
    setSearchParam,
    deleteSearchParam,
    getAllSearchParams,
    getSearchParam,
    setAllSearchParams,
    getObjectPath,
    setObjectPath
} from './openmctLocation';

import {resetApplicationState} from 'utils/testing';

describe('the openmct location utility functions', () => {
    afterEach(() => resetApplicationState());

    it('The setSearchParam function sets an individual search parameters in the window location hash', () => {
        setSearchParam('testParam', 'testValue');
        expect(window.location.hash.includes('testParam=testValue')).toBe(true);
    });

    it('The deleteSearchParam function deletes an individual search paramater in the window location hash', () => {
        window.location.hash = '#/?testParam=testValue';
        deleteSearchParam('testParam');
        expect(window.location.hash.includes('testParam=testValue')).toBe(false);
    });

    it('The getSearchParam function returns the value of an individual search paramater in the window location hash', () => {
        window.location.hash = '#/?testParam=testValue';
        expect(getSearchParam('testParam')).toBe('testValue');
    });

    it('The getAllSearchParams function returns the values of all search paramaters in the window location hash', () => {
        window.location.hash = '#/?testParam1=testValue1&testParam2=testValue2&testParam3=testValue3';
        let searchParams = getAllSearchParams();
        expect(searchParams.get('testParam1')).toBe('testValue1');
        expect(searchParams.get('testParam2')).toBe('testValue2');
        expect(searchParams.get('testParam3')).toBe('testValue3');
    });

    it('The setAllSearchParams function replaces all search paramaters in the window location hash', () => {
        window.location.hash = '#/?testParam1=testValue1&testParam2=testValue2&testParam3=testValue3';
        let searchParams = getAllSearchParams();
        searchParams.delete('testParam3');
        searchParams.set('testParam1', 'updatedTestValue1');
        searchParams.set('newTestParam4', 'newTestValue4');
        setAllSearchParams(searchParams);
        expect(window.location.hash).toBe('#/?testParam1=updatedTestValue1&testParam2=testValue2&newTestParam4=newTestValue4');
    });

    it('The getObjectPath function returns the current object path', () => {
        window.location.hash = '#/some/object/path?someParameter=someValue';
        expect(getObjectPath()).toBe('/some/object/path');
    });

    it('The setObjectPath function allows the object path to be set to a given string', () => {
        window.location.hash = '#/some/object/path?someParameter=someValue';
        setObjectPath('/some/other/object/path');
        expect(window.location.hash).toBe('#/some/other/object/path?someParameter=someValue');
    });

    it('The setObjectPath function allows the object path to be set from an array of domain objects', () => {
        const OBJECT_PATH = [
            {
                identifier: {
                    namespace: 'namespace',
                    key: 'objectKey1'
                }
            },
            {
                identifier: {
                    namespace: 'namespace',
                    key: 'objectKey2'
                }
            },
            {
                identifier: {
                    namespace: 'namespace',
                    key: 'objectKey3'
                }
            }
        ];
        window.location.hash = '#/some/object/path?someParameter=someValue';
        setObjectPath(OBJECT_PATH);
        expect(window.location.hash).toBe('#/namespace:objectKey1/namespace:objectKey2/namespace:objectKey3?someParameter=someValue');
    });

    it('The setObjectPath function throws an error if called with anything other than a string or an array of domain objects', () => {
        expect(() => setObjectPath(["array", "of", "strings"])).toThrow();
        expect(() => setObjectPath([{}, {someKey: 'someValue'}])).toThrow();
    });
});

