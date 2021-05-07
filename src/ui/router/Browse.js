define([

], function (

) {

    return function install(openmct) {
        let navigateCall = 0;
        let browseObject;
        let unobserve = undefined;
        let currentObjectPath;
        let isRoutingInProgress = false;
        let mutable;

        openmct.router.route(/^\/browse\/?$/, navigateToFirstChildOfRoot);

        openmct.router.route(/^\/browse\/(.*)$/, (path, results, params) => {
            isRoutingInProgress = true;
            let navigatePath = results[1];
            clearMutationListeners();
            navigateToPath(navigatePath, params.view);
            onParamsChanged(null, null, params);
        });

        openmct.router.on('change:params', onParamsChanged);

        function onParamsChanged(newParams, oldParams, changed) {
            if (isRoutingInProgress) {
                return;
            }

            if (changed.view && browseObject) {
                let provider = openmct
                    .objectViews
                    .getByProviderKey(changed.view);
                viewObject(browseObject, provider);
            }
        }

        function viewObject(object, viewProvider) {
            if (mutable) {
                openmct.objects.destroyMutable(mutable);
                mutable = undefined;
            }

            if (openmct.objects.supportsMutation(object.identifier)) {
                mutable = openmct.objects._toMutable(object);
            }

            currentObjectPath = openmct.router.path;

            if (mutable !== undefined) {
                openmct.layout.$refs.browseObject.show(mutable, viewProvider.key, true, currentObjectPath);
                openmct.layout.$refs.browseBar.domainObject = mutable;
            } else {
                openmct.layout.$refs.browseObject.show(object, viewProvider.key, true, currentObjectPath);
                openmct.layout.$refs.browseBar.domainObject = object;
            }

            openmct.layout.$refs.browseBar.viewKey = viewProvider.key;
        }

        function navigateToPath(path, currentViewKey) {
            navigateCall++;
            let currentNavigation = navigateCall;

            if (unobserve) {
                unobserve();
                unobserve = undefined;
            }

            //Split path into object identifiers
            if (!Array.isArray(path)) {
                path = path.split('/');
            }

            return pathToObjects(path).then(objects => {
                isRoutingInProgress = false;

                if (currentNavigation !== navigateCall) {
                    return; // Prevent race.
                }

                objects = objects.reverse();

                openmct.router.path = objects;
                browseObject = objects[0];

                openmct.layout.$refs.browseBar.domainObject = browseObject;

                if (!browseObject) {
                    openmct.layout.$refs.browseObject.clear();

                    return;
                }

                let currentProvider = openmct
                    .objectViews
                    .getByProviderKey(currentViewKey);

                document.title = browseObject.name; //change document title to current object in main view

                if (currentProvider && currentProvider.canView(browseObject, openmct.router.path)) {
                    viewObject(browseObject, currentProvider);

                    return;
                }

                let defaultProvider = openmct.objectViews.get(browseObject, openmct.router.path)[0];
                if (defaultProvider) {
                    openmct.router.updateParams({
                        view: defaultProvider.key
                    });
                } else {
                    openmct.router.updateParams({
                        view: undefined
                    });
                    openmct.layout.$refs.browseObject.clear();
                }
            });
        }

        function pathToObjects(path) {
            return Promise.all(path.map((keyString) => {
                let identifier = openmct.objects.parseKeyString(keyString);

                if (openmct.objects.supportsMutation(identifier)) {
                    return openmct.objects.getMutable(identifier);
                } else {
                    return openmct.objects.get(identifier);
                }
            }));
        }

        function navigateToFirstChildOfRoot() {
            openmct.objects.get('ROOT').then(rootObject => {
                openmct.composition.get(rootObject).load()
                    .then(children => {
                        let lastChild = children[children.length - 1];
                        if (!lastChild) {
                            console.error('Unable to navigate to anything. No root objects found.');
                        } else {
                            let lastChildId = openmct.objects.makeKeyString(lastChild.identifier);
                            openmct.router.setPath(`#/browse/${lastChildId}`);
                        }
                    });
            });
        }

        function clearMutationListeners() {
            if (openmct.router.path !== undefined) {
                openmct.router.path.forEach((pathObject) => {
                    if (pathObject.isMutable) {
                        openmct.objects.destroyMutable(pathObject);
                    }
                });
            }
        }
    };
});
