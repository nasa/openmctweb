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

function observeDefaultNotebookObject(openmct, notebookMeta, domainObject) {
    if (currentNotebookObjectIdentifier
            && objectUtils.makeKeyString(currentNotebookObjectIdentifier) === objectUtils.makeKeyString(notebookMeta.identifier)) {
        return;
    }

    if (unlisten) {
        unlisten();
        unlisten = null;
    }

    unlisten = openmct.objects.observe(domainObject, '*', defaultNotebookObjectChanged);
}

function saveDefaultNotebook(notebookStorage) {
    window.localStorage.setItem(NOTEBOOK_LOCAL_STORAGE, JSON.stringify(notebookStorage));
}

export function clearDefaultNotebook() {
    currentNotebookObjectIdentifier = null;
    window.localStorage.setItem(NOTEBOOK_LOCAL_STORAGE, null);
}

export function getDefaultNotebook() {
    const notebookStorage = window.localStorage.getItem(NOTEBOOK_LOCAL_STORAGE);

    return JSON.parse(notebookStorage);
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
    const { page, section } = getDefaultNotebook();

    return `#/browse/${path}?sectionId=${section.id}&pageId=${page.id}`;
}

export function setDefaultNotebook(openmct, notebookStorage, domainObject) {
    observeDefaultNotebookObject(openmct, notebookStorage, domainObject);
    saveDefaultNotebook(notebookStorage);
}

export function setDefaultNotebookSection(section) {
    const notebookStorage = getDefaultNotebook();
    notebookStorage.section = section;
    saveDefaultNotebook(notebookStorage);
}

export function setDefaultNotebookPage(page) {
    const notebookStorage = getDefaultNotebook();
    notebookStorage.page = page;
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
