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

import * as NotebookStorage from './notebook-storage';
import { createOpenMct, resetApplicationState } from 'utils/testing';

const notebookSection = {
    id: 'temp-section',
    isDefault: false,
    isSelected: true,
    name: 'section',
    pages: [
        {
            id: 'temp-page',
            isDefault: false,
            isSelected: true,
            name: 'page',
            pageTitle: 'Page'
        }
    ],
    sectionTitle: 'Section'
};

const domainObject = {
    name: 'notebook',
    identifier: {
        namespace: '',
        key: 'test-notebook'
    },
    configuration: {
        sections: [
            notebookSection
        ]
    }
};

const notebookStorage = {
    name: 'notebook',
    identifier: {
        namespace: '',
        key: 'test-notebook'
    },
    defaultSectionId: 'temp-section',
    defaultPageId: 'temp-page'
};

let openmct;
let mockIdentifierService;

describe('Notebook Storage:', () => {
    beforeEach(() => {
        openmct = createOpenMct();
        openmct.$injector = jasmine.createSpyObj('$injector', ['get']);
        mockIdentifierService = jasmine.createSpyObj(
            'identifierService',
            ['parse']
        );
        mockIdentifierService.parse.and.returnValue({
            getSpace: () => {
                return '';
            }
        });

        openmct.$injector.get.and.returnValue(mockIdentifierService);
        window.localStorage.setItem('notebook-storage', null);
        openmct.objects.addProvider('', jasmine.createSpyObj('mockNotebookProvider', [
            'create',
            'update'
        ]));
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    it('has empty local Storage', () => {
        expect(window.localStorage).not.toBeNull();
    });

    it('has null notebookstorage on clearDefaultNotebook', () => {
        window.localStorage.setItem('notebook-storage', notebookStorage);
        NotebookStorage.clearDefaultNotebook();
        const defaultNotebook = NotebookStorage.getDefaultNotebook();

        expect(defaultNotebook).toBeNull();
    });

    it('has correct notebookstorage on setDefaultNotebook', () => {
        NotebookStorage.setDefaultNotebook(openmct, notebookStorage, domainObject);
        const defaultNotebook = NotebookStorage.getDefaultNotebook();

        expect(JSON.stringify(defaultNotebook)).toBe(JSON.stringify(notebookStorage));
    });

    it('has correct section on setDefaultNotebookSectionId', () => {
        const section = {
            id: 'new-temp-section',
            isDefault: true,
            isSelected: true,
            name: 'new section',
            pages: [],
            sectionTitle: 'Section'
        };

        NotebookStorage.setDefaultNotebook(openmct, notebookStorage, domainObject);
        NotebookStorage.setDefaultNotebookSectionId(section.id);

        const defaultNotebook = NotebookStorage.getDefaultNotebook();
        const defaultSectionId = defaultNotebook.defaultSectionId;
        expect(section.id).toBe(defaultSectionId);
    });

    it('has correct page on setDefaultNotebookPageId', () => {
        const page = {
            id: 'new-temp-page',
            isDefault: true,
            isSelected: true,
            name: 'new page',
            pageTitle: 'Page'
        };

        NotebookStorage.setDefaultNotebook(openmct, notebookStorage, domainObject);
        NotebookStorage.setDefaultNotebookPageId(page.id);

        const defaultNotebook = NotebookStorage.getDefaultNotebook();
        const newPageId = defaultNotebook.defaultPageId;
        expect(page.id).toBe(newPageId);
    });

    describe('is getNotebookSectionAndPage function searches and returns correct,', () => {
        let section;
        let page;

        beforeEach(() => {
            const sectionId = 'temp-section';
            const pageId = 'temp-page';

            const sectionAndpage = NotebookStorage.getNotebookSectionAndPage(domainObject, sectionId, pageId);
            section = sectionAndpage.section;
            page = sectionAndpage.page;
        });

        it('id for section from notebook domain object', () => {
            expect(section.id).toEqual('temp-section');
        });

        it('name for section from notebook domain object', () => {
            expect(section.name).toEqual('section');
        });

        it('sectionTitle for section from notebook domain object', () => {
            expect(section.sectionTitle).toEqual('Section');
        });

        it('number of pages for section from notebook domain object', () => {
            expect(section.pages.length).toEqual(1);
        });

        it('id for page from notebook domain object', () => {
            expect(page.id).toEqual('temp-page');
        });

        it('name for page from notebook domain object', () => {
            expect(page.name).toEqual('page');
        });

        it('pageTitle for page from notebook domain object', () => {
            expect(page.pageTitle).toEqual('Page');
        });
    });

    describe('is getNotebookSectionAndPage function clears default notebook when,', () => {
        let oldDefaultNotebook;

        beforeEach(() => {
            NotebookStorage.setDefaultNotebook(openmct, notebookStorage, domainObject);

            oldDefaultNotebook = NotebookStorage.getDefaultNotebook();
        });

        it('section is not found', () => {
            expect(oldDefaultNotebook).not.toBe(null);

            const pageId = 'temp-page';
            const { section, page } = NotebookStorage.getNotebookSectionAndPage(domainObject, null, pageId);
            expect(section).toBe(undefined);
            expect(page).toBe(undefined);

            const defaultNotebook = NotebookStorage.getDefaultNotebook();
            expect(defaultNotebook).toBe(null);
        });

        it('page not found', () => {
            expect(oldDefaultNotebook).not.toBe(null);

            const sectionId = 'temp-section';
            const { section, page } = NotebookStorage.getNotebookSectionAndPage(domainObject, sectionId, null);
            expect(section).not.toBe(undefined);
            expect(page).toBe(undefined);

            const defaultNotebook = NotebookStorage.getDefaultNotebook();
            expect(defaultNotebook).toBe(null);
        });
    });
});
