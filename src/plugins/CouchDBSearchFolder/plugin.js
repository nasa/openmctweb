export default function (folderName, couchPlugin, searchFilter) {
    return function install(openmct) {
        const couchProvider = couchPlugin.couchProvider;

        openmct.objects.addRoot({
            namespace: 'couch-search',
            key: 'couch-search'
        });

        openmct.objects.addProvider('couch-search', {
            get(identifier) {
                if (identifier.key !== 'couch-search') {
                    return undefined;
                } else {
                    return Promise.resolve({
                        identifier,
                        type: 'folder',
                        name: folderName || "CouchDB Documents"
                    });
                }
            }
        });

        openmct.composition.addProvider({
            appliesTo(domainObject) {
                return domainObject.identifier.namespace === 'couch-search'
                    && domainObject.identifier.key === 'couch-search';
            },
            load() {
                return couchProvider.getObjectsByFilter(searchFilter).then(objects => {
                    return objects.map(object => object.identifier);
                });
            }
        });
    };

}
