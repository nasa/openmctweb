import { createNotebookImageDomainObject, getThumbnailURLFromimageUrl, saveNotebookImageDomainObject, updateNamespaceOfDomainObject } from './notebook-image';
import { mutateObject } from './notebook-entries';

const IMAGE_MIGRATION_VER = "v1";

export function notebookImageMigration(openmct, domainObject) {
    const configuration = domainObject.configuration;
    const notebookEntries = configuration.entries;

    const imageMigrationVer = configuration.imageMigrationVer;
    if (imageMigrationVer && imageMigrationVer === IMAGE_MIGRATION_VER) {
        return;
    }

    configuration.imageMigrationVer = IMAGE_MIGRATION_VER;

    // to avoid muliple notebookImageMigration calls updating images.
    mutateObject(openmct, domainObject, 'configuration', configuration);

    configuration.sections.forEach(section => {
        const sectionId = section.id;
        section.pages.forEach(page => {
            const pageId = page.id;
            const notebookSection = notebookEntries && notebookEntries[sectionId] || {};
            const pageEntries = notebookSection && notebookSection[pageId] || [];
            pageEntries.forEach(entry => {
                entry.embeds.forEach(async (embed) => {
                    const snapshot = embed.snapshot;
                    const fullSizeImageURL = snapshot.src;
                    if (fullSizeImageURL) {
                        const thumbnailImageURL = await getThumbnailURLFromimageUrl(fullSizeImageURL);
                        const object = createNotebookImageDomainObject(fullSizeImageURL);
                        const notebookImageDomainObject = updateNamespaceOfDomainObject(object, domainObject.identifier.namespace);
                        embed.snapshot = {
                            fullSizeImageObjectIdentifier: notebookImageDomainObject.identifier,
                            thumbnailImage: { src: thumbnailImageURL || '' }
                        };

                        mutateObject(openmct, domainObject, 'configuration.entries', notebookEntries);

                        saveNotebookImageDomainObject(openmct, notebookImageDomainObject);
                    }
                });
            });
        });
    });
}
