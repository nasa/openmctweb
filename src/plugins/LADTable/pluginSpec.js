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
import LadPlugin from './plugin.js';
import Vue from 'vue';
import {
    createOpenMct,
    getMockObjects,
    getMockTelemetry,
    getLatestTelemetry,
    resetApplicationState
} from 'utils/testing';

const TABLE_BODY_ROWS = '.js-lad-table__body__row';
const TABLE_BODY_FIRST_ROW = TABLE_BODY_ROWS + ':first-child';
const TABLE_BODY_FIRST_ROW_FIRST_DATA = TABLE_BODY_FIRST_ROW + ' .js-first-data';
const TABLE_BODY_FIRST_ROW_SECOND_DATA = TABLE_BODY_FIRST_ROW + ' .js-second-data';
const TABLE_BODY_FIRST_ROW_THIRD_DATA = TABLE_BODY_FIRST_ROW + ' .js-third-data';
const LAD_SET_TABLE_HEADERS = '.js-lad-table-set__table-headers';

function utcTimeFormat(value) {
    return new Date(value).toISOString().replace('T', ' ');
}

describe("The LAD Table", () => {
    const ladTableKey = 'LadTable';

    let openmct;
    let ladPlugin;
    let parent;
    let child;
    let telemetryCount = 3;
    let timeFormat = 'utc';
    let mockTelemetry = getMockTelemetry({
        count: telemetryCount,
        format: timeFormat
    });
    let mockObj = getMockObjects({
        objectKeyStrings: ['ladTable', 'telemetry'],
        format: timeFormat
    });
    let bounds = {
        start: 0,
        end: 4
    };

    // add telemetry object as composition in lad table
    mockObj.ladTable.composition.push(mockObj.telemetry.identifier);

    // this setups up the app
    beforeEach((done) => {
        const appHolder = document.createElement('div');
        appHolder.style.width = '640px';
        appHolder.style.height = '480px';

        openmct = createOpenMct();

        parent = document.createElement('div');
        child = document.createElement('div');
        parent.appendChild(child);

        spyOn(openmct.telemetry, 'request').and.returnValue(Promise.resolve([]));

        ladPlugin = new LadPlugin();
        openmct.install(ladPlugin);

        spyOn(openmct.objects, 'get').and.returnValue(Promise.resolve({}));

        openmct.time.bounds({
            start: bounds.start,
            end: bounds.end
        });

        openmct.on('start', done);
        openmct.startHeadless(appHolder);
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    it("should provide a table view only for lad table objects", () => {
        let applicableViews = openmct.objectViews.get(mockObj.ladTable, []);

        let ladTableView = applicableViews.find(
            (viewProvider) => viewProvider.key === ladTableKey
        );

        expect(applicableViews.length).toEqual(1);
        expect(ladTableView).toBeDefined();
    });

    describe('composition', () => {
        let ladTableCompositionCollection;

        beforeEach(() => {
            ladTableCompositionCollection = openmct.composition.get(mockObj.ladTable);
            ladTableCompositionCollection.load();
        });

        it("should accept telemetry producing objects", () => {
            expect(() => {
                ladTableCompositionCollection.add(mockObj.telemetry);
            }).not.toThrow();
        });

        it("should reject non-telemtry producing objects", () => {
            expect(() => {
                ladTableCompositionCollection.add(mockObj.ladTable);
            }).toThrow();
        });
    });

    describe("table view", () => {
        let applicableViews;
        let ladTableViewProvider;
        let ladTableView;
        let anotherTelemetryObj = getMockObjects({
            objectKeyStrings: ['telemetry'],
            overwrite: {
                telemetry: {
                    name: "New Telemetry Object",
                    identifier: {
                        namespace: "",
                        key: "another-telemetry-object"
                    }
                }
            }
        }).telemetry;

        // add another telemetry object as composition in lad table to test multi rows
        mockObj.ladTable.composition.push(anotherTelemetryObj.identifier);

        beforeEach(async () => {
            let telemetryRequestResolve;
            let telemetryObjectResolve;
            let anotherTelemetryObjectResolve;
            let telemetryRequestPromise = new Promise((resolve) => {
                telemetryRequestResolve = resolve;
            });
            let telemetryObjectPromise = new Promise((resolve) => {
                telemetryObjectResolve = resolve;
            });
            let anotherTelemetryObjectPromise = new Promise((resolve) => {
                anotherTelemetryObjectResolve = resolve;
            });

            openmct.telemetry.request.and.callFake(() => {
                telemetryRequestResolve(mockTelemetry);

                return telemetryRequestPromise;
            });
            openmct.objects.get.and.callFake((obj) => {
                if (obj.key === 'telemetry-object') {
                    telemetryObjectResolve(mockObj.telemetry);

                    return telemetryObjectPromise;
                } else {
                    anotherTelemetryObjectResolve(anotherTelemetryObj);

                    return anotherTelemetryObjectPromise;
                }
            });

            openmct.time.bounds({
                start: bounds.start,
                end: bounds.end
            });

            applicableViews = openmct.objectViews.get(mockObj.ladTable, []);
            ladTableViewProvider = applicableViews.find((viewProvider) => viewProvider.key === ladTableKey);
            ladTableView = ladTableViewProvider.view(mockObj.ladTable, [mockObj.ladTable]);
            ladTableView.show(child, true);

            await Promise.all([telemetryRequestPromise, telemetryObjectPromise, anotherTelemetryObjectPromise]);
            await Vue.nextTick();

            return;
        });

        it("should show one row per object in the composition", () => {
            const rowCount = parent.querySelectorAll(TABLE_BODY_ROWS).length;
            expect(rowCount).toBe(mockObj.ladTable.composition.length);
        });

        it("should show the most recent datum from the telemetry producing object", async () => {
            const latestDatum = getLatestTelemetry(mockTelemetry, { timeFormat });
            const expectedDate = utcTimeFormat(latestDatum[timeFormat]);
            await Vue.nextTick();
            const latestDate = parent.querySelector(TABLE_BODY_FIRST_ROW_SECOND_DATA).innerText;
            expect(latestDate).toBe(expectedDate);
        });

        it("should show the name provided for the the telemetry producing object", () => {
            const rowName = parent.querySelector(TABLE_BODY_FIRST_ROW_FIRST_DATA).innerText;

            const expectedName = mockObj.telemetry.name;
            expect(rowName).toBe(expectedName);
        });

        it("should show the correct values for the datum based on domain and range hints", async () => {
            const range = mockObj.telemetry.telemetry.values.find((val) => {
                return val.hints && val.hints.range !== undefined;
            }).key;
            const domain = mockObj.telemetry.telemetry.values.find((val) => {
                return val.hints && val.hints.domain !== undefined;
            }).key;
            const mostRecentTelemetry = getLatestTelemetry(mockTelemetry, { timeFormat });
            const rangeValue = mostRecentTelemetry[range];
            const domainValue = utcTimeFormat(mostRecentTelemetry[domain]);
            await Vue.nextTick();
            const actualDomainValue = parent.querySelector(TABLE_BODY_FIRST_ROW_SECOND_DATA).innerText;
            const actualRangeValue = parent.querySelector(TABLE_BODY_FIRST_ROW_THIRD_DATA).innerText;
            expect(actualRangeValue).toBe(rangeValue);
            expect(actualDomainValue).toBe(domainValue);
        });
    });
});

describe("The LAD Table Set", () => {
    const ladTableSetKey = 'LadTableSet';

    let openmct;
    let ladPlugin;
    let parent;
    let child;
    let telemetryCount = 3;
    let timeFormat = 'utc';

    let mockTelemetry = getMockTelemetry({
        count: telemetryCount,
        format: timeFormat
    });

    let mockObj = getMockObjects({
        objectKeyStrings: ['ladTable', 'ladTableSet', 'telemetry']
    });

    let bounds = {
        start: 0,
        end: 4
    };

    // add mock telemetry to lad table and lad table to lad table set (composition)
    mockObj.ladTable.composition.push(mockObj.telemetry.identifier);
    mockObj.ladTableSet.composition.push(mockObj.ladTable.identifier);

    beforeEach((done) => {
        const appHolder = document.createElement('div');

        appHolder.style.width = '640px';
        appHolder.style.height = '480px';

        openmct = createOpenMct();

        parent = document.createElement('div');
        child = document.createElement('div');
        parent.appendChild(child);

        spyOn(openmct.telemetry, 'request').and.returnValue(Promise.resolve([]));

        ladPlugin = new LadPlugin();
        openmct.install(ladPlugin);

        spyOn(openmct.objects, 'get').and.returnValue(Promise.resolve({}));

        openmct.time.bounds({
            start: bounds.start,
            end: bounds.end
        });

        openmct.on('start', done);
        openmct.start(appHolder);
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    it("should provide a lad table set view only for lad table set objects", () => {
        let applicableViews = openmct.objectViews.get(mockObj.ladTableSet, []);

        let ladTableSetView = applicableViews.find(
            (viewProvider) => viewProvider.key === ladTableSetKey
        );

        expect(applicableViews.length).toEqual(1);
        expect(ladTableSetView).toBeDefined();
    });

    describe('composition', () => {
        let ladTableSetCompositionCollection;

        beforeEach(() => {
            ladTableSetCompositionCollection = openmct.composition.get(mockObj.ladTableSet);
            ladTableSetCompositionCollection.load();
        });

        it("should accept lad table objects", () => {
            expect(() => {
                ladTableSetCompositionCollection.add(mockObj.ladTable);
            }).not.toThrow();
        });

        it("should reject non lad table objects", () => {
            expect(() => {
                ladTableSetCompositionCollection.add(mockObj.telemetry);
            }).toThrow();
        });
    });

    describe("table view", () => {
        let applicableViews;
        let ladTableSetViewProvider;
        let ladTableSetView;

        let otherObj = getMockObjects({
            objectKeyStrings: ['ladTable'],
            overwrite: {
                ladTable: {
                    name: "New LAD Table Object",
                    identifier: {
                        namespace: "",
                        key: "another-lad-object"
                    }
                }
            }
        });

        // add another lad table (with telemetry object) object to the lad table set for multi row test
        otherObj.ladTable.composition.push(mockObj.telemetry.identifier);
        mockObj.ladTableSet.composition.push(otherObj.ladTable.identifier);

        beforeEach(async () => {
            let telemetryRequestResolve;
            let ladObjectResolve;
            let anotherLadObjectResolve;

            let telemetryRequestPromise = new Promise((resolve) => {
                telemetryRequestResolve = resolve;
            });

            let ladObjectPromise = new Promise((resolve) => {
                ladObjectResolve = resolve;
            });

            let anotherLadObjectPromise = new Promise((resolve) => {
                anotherLadObjectResolve = resolve;
            });

            openmct.telemetry.request.and.callFake(() => {
                telemetryRequestResolve(mockTelemetry);

                return telemetryRequestPromise;
            });

            openmct.objects.get.and.callFake((obj) => {
                if (obj.key === 'lad-object') {
                    ladObjectResolve(mockObj.ladObject);

                    return ladObjectPromise;
                } else if (obj.key === 'another-lad-object') {
                    anotherLadObjectResolve(otherObj.ladObject);

                    return anotherLadObjectPromise;
                }

                return Promise.resolve({});
            });

            openmct.time.bounds({
                start: bounds.start,
                end: bounds.end
            });

            applicableViews = openmct.objectViews.get(mockObj.ladTableSet, []);
            ladTableSetViewProvider = applicableViews.find((viewProvider) => viewProvider.key === ladTableSetKey);
            ladTableSetView = ladTableSetViewProvider.view(mockObj.ladTableSet, [mockObj.ladTableSet]);
            ladTableSetView.show(child, true);

            await Promise.all([telemetryRequestPromise, ladObjectPromise, anotherLadObjectPromise]);
            await Vue.nextTick();

            return;
        });

        it("should show one row per lad table object in the composition", () => {
            const rowCount = parent.querySelectorAll(LAD_SET_TABLE_HEADERS).length;

            expect(rowCount).toBe(mockObj.ladTableSet.composition.length);
            pending();
        });
    });
});

