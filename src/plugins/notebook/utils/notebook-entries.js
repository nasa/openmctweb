import objectLink from '../../../ui/mixins/object-link';

export const DEFAULT_CLASS = 'notebook-default';
const TIME_BOUNDS = {
    START_BOUND: 'tc.startBound',
    END_BOUND: 'tc.endBound',
    START_DELTA: 'tc.startDelta',
    END_DELTA: 'tc.endDelta'
};

export function addEntryIntoPage(notebookStorage, entries, entry) {
    const defaultSectionId = notebookStorage.defaultSectionId;
    const defaultPageId = notebookStorage.defaultPageId;
    if (!defaultSectionId || !defaultPageId) {
        return;
    }

    const newEntries = JSON.parse(JSON.stringify(entries));
    let section = newEntries[defaultSectionId];
    if (!section) {
        newEntries[defaultSectionId] = {};
    }

    let page = newEntries[defaultSectionId][defaultPageId];
    if (!page) {
        newEntries[defaultSectionId][defaultPageId] = [];
    }

    newEntries[defaultSectionId][defaultPageId].push(entry);

    return newEntries;
}

export function getHistoricLinkInFixedMode(openmct, bounds, historicLink) {
    if (historicLink.includes('tc.mode=fixed')) {
        return historicLink;
    }

    openmct.time.getAllClocks().forEach(clock => {
        if (historicLink.includes(`tc.mode=${clock.key}`)) {
            historicLink.replace(`tc.mode=${clock.key}`, 'tc.mode=fixed');

            return;
        }
    });

    const params = historicLink.split('&').map(param => {
        if (param.includes(TIME_BOUNDS.START_BOUND)
                || param.includes(TIME_BOUNDS.START_DELTA)) {
            param = `${TIME_BOUNDS.START_BOUND}=${bounds.start}`;
        }

        if (param.includes(TIME_BOUNDS.END_BOUND)
                || param.includes(TIME_BOUNDS.END_DELTA)) {
            param = `${TIME_BOUNDS.END_BOUND}=${bounds.end}`;
        }

        return param;
    });

    return params.join('&');
}

export function createNewEmbed(snapshotMeta, snapshot = '') {
    const {
        bounds,
        link,
        objectPath,
        openmct
    } = snapshotMeta;
    const domainObject = objectPath[0];
    const domainObjectType = openmct.types.get(domainObject.type);

    const cssClass = domainObjectType && domainObjectType.definition
        ? domainObjectType.definition.cssClass
        : 'icon-object-unknown';
    const date = Date.now();
    const historicLink = link
        ? getHistoricLinkInFixedMode(openmct, bounds, link)
        : objectLink.computed.objectLink.call({
            objectPath,
            openmct
        });
    const name = domainObject.name;
    const type = domainObject.identifier.key;

    return {
        bounds,
        createdOn: date,
        cssClass,
        domainObject,
        historicLink,
        id: 'embed-' + date,
        name,
        snapshot,
        type
    };
}

export function addNotebookEntry(openmct, domainObject, notebookStorage, embed = null, entryText = '') {
    if (!openmct || !domainObject || !notebookStorage) {
        return;
    }

    const date = Date.now();
    const configuration = domainObject.configuration;
    const entries = configuration.entries || {};

    if (!entries) {
        return;
    }

    const embeds = embed
        ? [embed]
        : [];

    const id = `entry-${date}`;
    const entry = {
        id,
        createdOn: date,
        text: entryText,
        embeds
    };

    const newEntries = addEntryIntoPage(notebookStorage, entries, entry);

    addDefaultClass(domainObject, openmct);
    openmct.objects.mutate(domainObject, 'configuration.entries', newEntries);

    return id;
}

export function getNotebookEntries(domainObject, selectedSection, selectedPage) {
    if (!domainObject || !selectedSection || !selectedPage) {
        return;
    }

    const configuration = domainObject.configuration;
    const entries = configuration.entries || {};

    let section = entries[selectedSection.id];
    if (!section) {
        return;
    }

    let page = entries[selectedSection.id][selectedPage.id];
    if (!page) {
        return;
    }

    return entries[selectedSection.id][selectedPage.id];
}

export function getEntryPosById(entryId, domainObject, selectedSection, selectedPage) {
    if (!domainObject || !selectedSection || !selectedPage) {
        return;
    }

    const entries = getNotebookEntries(domainObject, selectedSection, selectedPage);
    let foundId = -1;
    entries.forEach((element, index) => {
        if (element.id === entryId) {
            foundId = index;

            return;
        }
    });

    return foundId;
}

export function deleteNotebookEntries(openmct, domainObject, selectedSection, selectedPage) {
    if (!domainObject || !selectedSection) {
        return;
    }

    const configuration = domainObject.configuration;
    const entries = configuration.entries || {};

    // Delete entire section
    if (!selectedPage) {
        delete entries[selectedSection.id];

        return;
    }

    let section = entries[selectedSection.id];
    if (!section) {
        return;
    }

    delete entries[selectedSection.id][selectedPage.id];

    mutateObject(openmct, domainObject, 'configuration.entries', entries);
}

export function mutateObject(openmct, object, key, value) {
    openmct.objects.mutate(object, key, value);
}

function addDefaultClass(domainObject, openmct) {
    openmct.status.set(domainObject.identifier, DEFAULT_CLASS);
}
