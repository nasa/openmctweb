import objectLink from '../../../ui/mixins/object-link';

const TIME_BOUNDS = {
    START_BOUND: 'tc.startBound',
    END_BOUND: 'tc.endBound',
    START_DELTA: 'tc.startDelta',
    END_DELTA: 'tc.endDelta'
}

export const getHistoricLinkInFixedMode = (openmct, bounds, historicLink) => {
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

export const getNotebookDefaultEntries = (notebookStorage, domainObject) => {
    if (!notebookStorage || !domainObject) {
        return null;
    }

    const defaultSection = notebookStorage.section;
    const defaultPage = notebookStorage.page;
    if (!defaultSection || !defaultPage) {
        return null;
    }

    const configuration = domainObject.configuration;
    const entries = configuration.entries || {};

    let section = entries[defaultSection.id];
    if (!section) {
        section = {};
        entries[defaultSection.id] = section;
    }

    let page = entries[defaultSection.id][defaultPage.id];
    if (!page) {
        page = [];
        entries[defaultSection.id][defaultPage.id] = [];
    }

    return entries[defaultSection.id][defaultPage.id];
}

export const createNewEmbed = (snapshotMeta, snapshot = '') => {
    const {
        bounds,
        viewportBounds,
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
        : objectLink.computed.objectLink.call({ objectPath, openmct });
    const name = domainObject.name;
    const type = domainObject.identifier.key;

    return {
        bounds,
        viewportBounds,
        createdOn: date,
        cssClass,
        domainObject,
        historicLink,
        id: 'embed-' + date,
        name,
        snapshot,
        type,
        objectPath: JSON.stringify(objectPath)
    };
}

export const addNotebookEntry = (openmct, domainObject, notebookStorage, embed = null) => {
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

    const defaultEntries = getNotebookDefaultEntries(notebookStorage, domainObject);
    const id = `entry-${date}`;
    defaultEntries.push({
        id,
        createdOn: date,
        text: '',
        embeds
    });

    openmct.objects.mutate(domainObject, 'configuration.entries', entries);

    return id;
}

export const getNotebookEntries = (domainObject, selectedSection, selectedPage) => {
    if (!domainObject || !selectedSection || !selectedPage) {
        return null;
    }

    const configuration = domainObject.configuration;
    const entries = configuration.entries || {};

    let section = entries[selectedSection.id];
    if (!section) {
        return null;
    }

    let page = entries[selectedSection.id][selectedPage.id];
    if (!page) {
        return null;
    }

    return entries[selectedSection.id][selectedPage.id];
}

export const getEntryPosById = (entryId, domainObject, selectedSection, selectedPage) => {
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

export const deleteNotebookEntries = (openmct, domainObject, selectedSection, selectedPage) => {
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
    openmct.objects.mutate(domainObject, 'configuration.entries', entries);
}
