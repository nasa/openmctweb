define([

], function (

) {
    const DEFAULT_VIEW_PRIORITY = 100;

    const PRIORITY_LEVELS = {
        "fallback": Number.NEGATIVE_INFINITY,
        "default": -100,
        "none": 0,
        "optional": DEFAULT_VIEW_PRIORITY,
        "preferred": 1000,
        "mandatory": Number.POSITIVE_INFINITY
    };

    function LegacyViewProvider(legacyView, openmct, convertToLegacyObject) {
        return {
            key: legacyView.key,
            name: legacyView.name,
            cssClass: legacyView.cssClass,
            description: legacyView.description,
            canEdit: function () {
                return legacyView.editable === true;
            },
            canView: function (domainObject) {
                if (!domainObject || !domainObject.identifier) {
                    return false;
                }

                if (legacyView.type) {
                    return domainObject.type === legacyView.type;
                }

                let legacyObject = convertToLegacyObject(domainObject);
                if (legacyView.needs) {
                    let meetsNeeds = legacyView.needs.every(k => legacyObject.hasCapability(k));
                    if (!meetsNeeds) {
                        return false;
                    }
                }

                return openmct.$injector.get('policyService').allow(
                    'view', legacyView, legacyObject
                );
            },
            view: function (domainObject) {
                let $rootScope = openmct.$injector.get('$rootScope');
                let templateLinker = openmct.$injector.get('templateLinker');
                let scope = $rootScope.$new(true);
                let legacyObject = convertToLegacyObject(domainObject);
                let isDestroyed = false;
                let unlistenToStatus;
                let element;
                scope.domainObject = legacyObject;
                scope.model = legacyObject.getModel();
                let child;
                let parent;

                return {
                    show: function (container) {
                        parent = container;
                        child = document.createElement('div');
                        parent.appendChild(child);
                        let statusCapability = legacyObject.getCapability('status');
                        unlistenToStatus = statusCapability.listen((newStatus) => {
                            child.classList.remove('s-status-timeconductor-unsynced');

                            if (newStatus.includes('timeconductor-unsynced')) {
                                child.classList.add('s-status-timeconductor-unsynced');
                            }
                        });

                        // TODO: implement "gestures" support ?
                        let uses = legacyView.uses || [];
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
                                legacyView
                            );
                            child.classList.add('u-contents');
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
                    onClearData() {
                        scope.$broadcast('clearData');
                    },
                    destroy: function () {
                        element.off();
                        element.remove();
                        scope.$destroy();
                        element = null;
                        scope = null;
                        unlistenToStatus();
                    }
                };
            },
            priority: function () {
                let priority = legacyView.priority || DEFAULT_VIEW_PRIORITY;
                if (typeof priority === 'string') {
                    priority = PRIORITY_LEVELS[priority];
                }

                return priority;
            }
        };
    }

    return LegacyViewProvider;

});
