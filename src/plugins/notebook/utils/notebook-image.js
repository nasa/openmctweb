import uuid from 'uuid';

export const DEFAULT_SIZE = {
    width: 30,
    height: 30
};

export function createNotebookImageDomainObject(fullSizeImageURL) {
    const identifier = {
        key: uuid(),
        namespace: ''
    };
    const viewType = 'notebookSnapshotImage';

    return {
        name: 'Notebook Snapshot Image',
        type: viewType,
        identifier,
        configuration: {
            fullSizeImageURL
        }
    };
}

export function getThumbnailURLFromCanvas(canvas, size = DEFAULT_SIZE) {
    const thumbnailCanvas = document.createElement('canvas');
    thumbnailCanvas.setAttribute('width', size.width);
    thumbnailCanvas.setAttribute('height', size.height);
    const ctx = thumbnailCanvas.getContext('2d');
    ctx.globalCompositeOperation = "copy";
    ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, size.width, size.height);

    return thumbnailCanvas.toDataURL('image/png');
}

export function getThumbnailURLFromimageUrl(imageUrl, size = DEFAULT_SIZE) {
    return new Promise(resolve => {
        const image = new Image();

        const canvas = document.createElement('canvas');
        canvas.width = size.width;
        canvas.height = size.height;

        image.onload = function () {
            canvas.getContext('2d')
                .drawImage(image, 0, 0, size.width, size.height);

            resolve(canvas.toDataURL('image/png'));
        };

        image.src = imageUrl;
    });
}

export function saveNotebookImageDomainObject(openmct, object) {
    return new Promise((resolve, reject) => {
        openmct.objects.save(object)
            .then(result => {
                if (result) {
                    resolve(object);
                } else {
                    reject();
                }
            })
            .catch(e => {
                console.error(e);
                reject();
            });
    });
}

export function updateNotebookImageDomainObject(openmct, identifier, fullSizeImage) {
    openmct.objects.get(identifier)
        .then(domainObject => {
            const configuration = domainObject.configuration;
            configuration.fullSizeImageURL = fullSizeImage.src;

            openmct.objects.mutate(domainObject, 'configuration', configuration);
        });
}

export function updateNamespaceOfDomainObject(object, namespace) {
    object.identifier.namespace = namespace;

    return object;
}
