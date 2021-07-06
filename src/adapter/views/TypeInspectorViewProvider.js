define([

], function (

) {
    function TypeInspectorViewProvider(typeDefinition, openmct, convertToLegacyObject) {
        let representation = openmct.$injector.get('representations[]')
            .filter((r) => r.key === typeDefinition.inspector)[0];

        return {
            key: representation.key,
            name: representation.name,
            cssClass: representation.cssClass,
            description: representation.description,
            canView: function (selection) {
                if (selection.length !== 1 || selection[0].length === 0) {
                    return false;
                }

                let selectionContext = selection[0][0].context;

                if (!selectionContext.item) {
                    return false;
                }

                return selectionContext.item.type === typeDefinition.key;
            },
            view: function (selection) {
                let domainObject = selection[0][0].context.item;
                let $rootScope = openmct.$injector.get('$rootScope');
                let templateLinker = openmct.$injector.get('templateLinker');
                let scope = $rootScope.$new(true);
                let legacyObject = convertToLegacyObject(domainObject);
                let isDestroyed = false;
                let element;
                scope.domainObject = legacyObject;
                scope.model = legacyObject.getModel();

                return {
                    show: function (container) {
                        let child = document.createElement('div');
                        container.appendChild(child);
                        // TODO: implement "gestures" support ?
                        let uses = representation.uses || [];
                        let promises = [];
                        let results = uses.map(function (capabilityKey, i) {
                            let result = legacyObject.useCapability(capabilityKey);
                            if (result.then) {
                                promises.push(result.then(function (r) {
                                    results[i] = r;
                                }));
                            }

                            return result;
                        });

                        function link() {
                            if (isDestroyed) {
                                return;
                            }

                            uses.forEach(function (key, i) {
                                scope[key] = results[i];
                            });
                            element = openmct.$angular.element(child);
                            templateLinker.link(
                                scope,
                                element,
                                representation
                            );
                            container.style.height = '100%';
                        }

                        if (promises.length) {
                            Promise.all(promises)
                                .then(function () {
                                    link();
                                    scope.$digest();
                                });
                        } else {
                            link();
                        }
                    },
                    destroy: function () {
                        element.off();
                        element.remove();
                        scope.$destroy();
                        element = null;
                        scope = null;
                    }
                };
            }
        };
    }

    return TypeInspectorViewProvider;

});
