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

import { createOpenMct, createMouseEvent, resetApplicationState } from 'utils/testing';
import NotebookPlugin from './plugin';
import Vue from 'vue';

let openmct;
let notebookDefinition;
let notebookPlugin;
let element;
let child;
let appHolder;

const notebookDomainObject = {
    identifier: {
        key: 'notebook',
        namespace: ''
    },
    type: 'notebook'
};

describe("Notebook plugin:", () => {
    beforeAll(done => {
        appHolder = document.createElement('div');
        appHolder.style.width = '640px';
        appHolder.style.height = '480px';

        openmct = createOpenMct();

        element = document.createElement('div');
        child = document.createElement('div');
        element.appendChild(child);

        notebookPlugin = new NotebookPlugin();
        openmct.install(notebookPlugin);

        notebookDefinition = openmct.types.get('notebook').definition;
        notebookDefinition.initialize(notebookDomainObject);

        openmct.on('start', done);
        openmct.start(appHolder);

        document.body.append(appHolder);
    });

    afterAll(() => {
        appHolder.remove();
        resetApplicationState(openmct);
    });

    it("has type as Notebook", () => {
        expect(notebookDefinition.name).toEqual('Notebook');
    });

    it("is creatable", () => {
        expect(notebookDefinition.creatable).toEqual(true);
    });

    describe("Notebook view:", () => {
        let notebookViewProvider;
        let notebookView;

        beforeEach(() => {
            const notebookViewObject = {
                ...notebookDomainObject,
                id: "test-object",
                name: 'Notebook',
                configuration: {
                    defaultSort: 'oldest',
                    entries: {},
                    pageTitle: 'Page',
                    sections: [],
                    sectionTitle: 'Section',
                    type: 'General'
                }
            };

            const notebookObject = {
                name: 'Notebook View',
                key: 'notebook-vue',
                creatable: true
            };

            const applicableViews = openmct.objectViews.get(notebookViewObject, []);
            notebookViewProvider = applicableViews.find(viewProvider => viewProvider.key === notebookObject.key);
            notebookView = notebookViewProvider.view(notebookViewObject);

            notebookView.show(child);

            return Vue.nextTick();
        });

        afterEach(() => {
            notebookView.destroy();
        });

        it("provides notebook view", () => {
            expect(notebookViewProvider).toBeDefined();
        });

        it("renders notebook element", () => {
            const notebookElement = element.querySelectorAll('.c-notebook');
            expect(notebookElement.length).toBe(1);
        });

        it("renders major elements", () => {
            const notebookElement = element.querySelector('.c-notebook');
            const searchElement = notebookElement.querySelector('.c-search');
            const sidebarElement = notebookElement.querySelector('.c-sidebar');
            const pageViewElement = notebookElement.querySelector('.c-notebook__page-view');
            const hasMajorElements = Boolean(searchElement && sidebarElement && pageViewElement);

            expect(hasMajorElements).toBe(true);
        });
    });

    describe("Notebook Snapshots view:", () => {
        let snapshotIndicator;
        let drawerElement;

        function clickSnapshotIndicator() {
            const indicator = element.querySelector('.icon-camera');
            const button = indicator.querySelector('button');
            const clickEvent = createMouseEvent('click');

            button.dispatchEvent(clickEvent);
        }

        beforeAll(() => {
            snapshotIndicator = openmct.indicators.indicatorObjects
                .find(indicator => indicator.key === 'notebook-snapshot-indicator').element;

            element.append(snapshotIndicator);

            return Vue.nextTick();
        });

        afterAll(() => {
            snapshotIndicator.remove();
            snapshotIndicator = undefined;

            if (drawerElement) {
                drawerElement.remove();
                drawerElement = undefined;
            }
        });

        beforeEach(() => {
            drawerElement = document.querySelector('.l-shell__drawer');
        });

        afterEach(() => {
            if (drawerElement) {
                drawerElement.classList.remove('is-expanded');
            }
        });

        it("has Snapshots indicator", () => {
            const hasSnapshotIndicator = snapshotIndicator !== null && snapshotIndicator !== undefined;
            expect(hasSnapshotIndicator).toBe(true);
        });

        it("snapshots container has class isExpanded", () => {
            let classes = drawerElement.classList;
            const isExpandedBefore = classes.contains('is-expanded');

            clickSnapshotIndicator();
            classes = drawerElement.classList;
            const isExpandedAfterFirstClick = classes.contains('is-expanded');

            expect(isExpandedBefore).toBeFalse();
            expect(isExpandedAfterFirstClick).toBeTrue();
        });

        it("snapshots container does not have class isExpanded", () => {
            let classes = drawerElement.classList;
            const isExpandedBefore = classes.contains('is-expanded');

            clickSnapshotIndicator();
            classes = drawerElement.classList;
            const isExpandedAfterFirstClick = classes.contains('is-expanded');

            clickSnapshotIndicator();
            classes = drawerElement.classList;
            const isExpandedAfterSecondClick = classes.contains('is-expanded');

            expect(isExpandedBefore).toBeFalse();
            expect(isExpandedAfterFirstClick).toBeTrue();
            expect(isExpandedAfterSecondClick).toBeFalse();
        });

        it("show notebook snapshots container text", () => {
            clickSnapshotIndicator();

            const notebookSnapshots = drawerElement.querySelector('.l-browse-bar__object-name');
            const snapshotsText = notebookSnapshots.textContent.trim();

            expect(snapshotsText).toBe('Notebook Snapshots');
        });
    });
});
