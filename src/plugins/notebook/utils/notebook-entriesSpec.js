/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * 'License'); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
import * as NotebookEntries from './notebook-entries';
import { createOpenMct, resetApplicationState } from 'utils/testing';

const notebookStorage = {
    notebookMeta: {
        name: 'notebook',
        identifier: {
            namespace: '',
            key: 'test-notebook'
        }
    },
    section: {
        id: '03a79b6a-971c-4e56-9892-ec536332c3f0',
        isDefault: true,
        isSelected: true,
        name: 'section',
        pages: [],
        sectionTitle: 'Section'
    },
    page: {
        id: '8b548fd9-2b8a-4b02-93a9-4138e22eba00',
        isDefault: true,
        isSelected: true,
        name: 'page',
        pageTitle: 'Page'
    }
};

const notebookEntries = {
    '03a79b6a-971c-4e56-9892-ec536332c3f0': {
        '8b548fd9-2b8a-4b02-93a9-4138e22eba00': []
    }
};

const notebookDomainObject = {
    identifier: {
        key: 'notebook',
        namespace: ''
    },
    type: 'notebook',
    configuration: {
        defaultSort: 'oldest',
        entries: notebookEntries,
        pageTitle: 'Page',
        sections: [],
        sectionTitle: 'Section',
        type: 'General'
    }
};

const selectedSection = {
    id: '03a79b6a-971c-4e56-9892-ec536332c3f0',
    isDefault: false,
    isSelected: true,
    name: 'Day 1',
    pages: [
        {
            id: '54deb3d5-8267-4be4-95e9-3579ed8c082d',
            isDefault: false,
            isSelected: false,
            name: 'Shift 1',
            pageTitle: 'Page'
        },
        {
            id: '2ea41c78-8e60-4657-a350-53f1a1fa3021',
            isDefault: false,
            isSelected: false,
            name: 'Shift 2',
            pageTitle: 'Page'
        },
        {
            id: '8b548fd9-2b8a-4b02-93a9-4138e22eba00',
            isDefault: false,
            isSelected: true,
            name: 'Unnamed Page',
            pageTitle: 'Page'
        }
    ],
    sectionTitle: 'Section'
};

const selectedPage = {
    id: '8b548fd9-2b8a-4b02-93a9-4138e22eba00',
    isDefault: false,
    isSelected: true,
    name: 'Unnamed Page',
    pageTitle: 'Page'
};

let openmct;
let mockIdentifierService;

describe('Notebook Entries:', () => {
    beforeEach(done => {
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
        openmct.types.addType('notebook', {
            creatable: true
        });
        openmct.objects.addProvider('', jasmine.createSpyObj('mockNotebookProvider', [
            'create',
            'update'
        ]));
        window.localStorage.setItem('notebook-storage', null);

        done();
    });

    afterEach(() => {
        notebookDomainObject.configuration.entries[selectedSection.id][selectedPage.id] = [];
        resetApplicationState(openmct);
    });

    it('getNotebookEntries has no entries', () => {
        const entries = NotebookEntries.getNotebookEntries(notebookDomainObject, selectedSection, selectedPage);

        expect(entries.length).toEqual(0);
    });

    it('addNotebookEntry adds entry', (done) => {
        const unlisten = openmct.objects.observe(notebookDomainObject, '*', (object) => {
            const entries = NotebookEntries.getNotebookEntries(notebookDomainObject, selectedSection, selectedPage);

            expect(entries.length).toEqual(1);
            done();
            unlisten();
        });

        NotebookEntries.addNotebookEntry(openmct, notebookDomainObject, notebookStorage);
    });

    it('getEntryPosById returns valid position', () => {
        const entryId1 = NotebookEntries.addNotebookEntry(openmct, notebookDomainObject, notebookStorage);
        const position1 = NotebookEntries.getEntryPosById(entryId1, notebookDomainObject, selectedSection, selectedPage);

        const entryId2 = NotebookEntries.addNotebookEntry(openmct, notebookDomainObject, notebookStorage);
        const position2 = NotebookEntries.getEntryPosById(entryId2, notebookDomainObject, selectedSection, selectedPage);

        const entryId3 = NotebookEntries.addNotebookEntry(openmct, notebookDomainObject, notebookStorage);
        const position3 = NotebookEntries.getEntryPosById(entryId3, notebookDomainObject, selectedSection, selectedPage);

        const success = position1 === 0
                && position2 === 1
                && position3 === 2;

        expect(success).toBe(true);
    });

    it('deleteNotebookEntries deletes correct page entries', () => {
        NotebookEntries.addNotebookEntry(openmct, notebookDomainObject, notebookStorage);
        NotebookEntries.addNotebookEntry(openmct, notebookDomainObject, notebookStorage);

        NotebookEntries.deleteNotebookEntries(openmct, notebookDomainObject, selectedSection, selectedPage);
        const afterEntries = NotebookEntries.getNotebookEntries(notebookDomainObject, selectedSection, selectedPage);

        expect(afterEntries).toEqual(undefined);
    });
});
