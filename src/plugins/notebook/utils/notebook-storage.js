import objectUtils from 'objectUtils';

const NOTEBOOK_LOCAL_STORAGE = 'notebook-storage';
let currentNotebookObjectIdentifier = null;
let unlisten = null;

function defaultNotebookObjectChanged(newDomainObject) {
    if (newDomainObject.location !== null) {
        currentNotebookObjectIdentifier = newDomainObject.identifier;

        return;
    }

    if (unlisten) {
        unlisten();
        unlisten = null;
    }

    clearDefaultNotebook();
}

function observeDefaultNotebookObject(openmct, notebookStorage, domainObject) {
    if (currentNotebookObjectIdentifier
            && objectUtils.makeKeyString(currentNotebookObjectIdentifier) === objectUtils.makeKeyString(notebookStorage.identifier)) {
        return;
    }

    removeListener();

    unlisten = openmct.objects.observe(domainObject, '*', defaultNotebookObjectChanged);
}

function removeListener() {
    if (unlisten) {
        unlisten();
        unlisten = null;
    }
}

function saveDefaultNotebook(notebookStorage) {
    window.localStorage.setItem(NOTEBOOK_LOCAL_STORAGE, JSON.stringify(notebookStorage));
}

export function clearDefaultNotebook() {
    currentNotebookObjectIdentifier = null;
    removeListener();

    window.localStorage.setItem(NOTEBOOK_LOCAL_STORAGE, null);
}

export function getDefaultNotebook() {
    const notebookStorage = window.localStorage.getItem(NOTEBOOK_LOCAL_STORAGE);

    return JSON.parse(notebookStorage);
}

export function getNotebookSectionAndPage(domainObject, sectionId, pageId) {
    const section = domainObject.configuration.sections.find(s => s.id === sectionId);
    const page = section && section.pages.find(p => p.id === pageId);

    if (!section || !page) {
        console.warn('Clearing default notebook due to missing Section or Page from default Notebook');
        console.warn('Section:', section);
        console.warn('Page:', page);

        clearDefaultNotebook();
    }

    return {
        section,
        page
    };
}

export async function getDefaultNotebookLink(openmct, domainObject = null) {
    if (!domainObject) {
        return null;
    }

    const path = await openmct.objects.getOriginalPath(domainObject.identifier)
        .then(objectPath => objectPath
            .map(o => o && openmct.objects.makeKeyString(o.identifier))
            .reverse()
            .join('/')
        );
    const { defaultPageId, defaultSectionId } = getDefaultNotebook();

    return `#/browse/${path}?sectionId=${defaultSectionId}&pageId=${defaultPageId}`;
}

export function setDefaultNotebook(openmct, notebookStorage, domainObject) {
    observeDefaultNotebookObject(openmct, notebookStorage, domainObject);
    saveDefaultNotebook(notebookStorage);
}

export function setDefaultNotebookSectionId(sectionId) {
    const notebookStorage = getDefaultNotebook();
    notebookStorage.defaultSectionId = sectionId;
    saveDefaultNotebook(notebookStorage);
}

export function setDefaultNotebookPageId(pageId) {
    const notebookStorage = getDefaultNotebook();
    notebookStorage.defaultPageId = pageId;
    saveDefaultNotebook(notebookStorage);
}

export function validateNotebookStorageObject() {
    const notebookStorage = getDefaultNotebook();

    let valid = false;
    if (notebookStorage) {
        Object.entries(notebookStorage).forEach(([key, value]) => {
            const validKey = key !== undefined && key !== null;
            const validValue = value !== undefined && value !== null;
            valid = validKey && validValue;
        });
    }

    if (valid) {
        return notebookStorage;
    }

    console.warn('Invalid Notebook object, clearing default notebook storage');

    clearDefaultNotebook();
}
