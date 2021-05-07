/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define([
    'EventEmitter',
    'uuid',
    './BundleRegistry',
    './installDefaultBundles',
    './api/api',
    './api/overlays/OverlayAPI',
    './selection/Selection',
    'objectUtils',
    './plugins/plugins',
    './adapter/indicators/legacy-indicators-plugin',
    './plugins/buildInfo/plugin',
    './ui/registries/ViewRegistry',
    './plugins/imagery/plugin',
    './ui/registries/InspectorViewRegistry',
    './ui/registries/ToolbarRegistry',
    './ui/router/ApplicationRouter',
    './ui/router/Browse',
    '../platform/framework/src/Main',
    './ui/layout/Layout.vue',
    '../platform/core/src/objects/DomainObjectImpl',
    '../platform/core/src/capabilities/ContextualDomainObject',
    './ui/preview/plugin',
    './api/Branding',
    './plugins/licenses/plugin',
    './plugins/remove/plugin',
    './plugins/move/plugin',
    './plugins/duplicate/plugin',
    'vue'
], function (
    EventEmitter,
    uuid,
    BundleRegistry,
    installDefaultBundles,
    api,
    OverlayAPI,
    Selection,
    objectUtils,
    plugins,
    LegacyIndicatorsPlugin,
    buildInfoPlugin,
    ViewRegistry,
    ImageryPlugin,
    InspectorViewRegistry,
    ToolbarRegistry,
    ApplicationRouter,
    Browse,
    Main,
    Layout,
    DomainObjectImpl,
    ContextualDomainObject,
    PreviewPlugin,
    BrandingAPI,
    LicensesPlugin,
    RemoveActionPlugin,
    MoveActionPlugin,
    DuplicateActionPlugin,
    Vue
) {
    /**
     * Open MCT is an extensible web application for building mission
     * control user interfaces. This module is itself an instance of
     * [MCT]{@link module:openmct.MCT}, which provides an interface for
     * configuring and executing the application.
     *
     * @exports openmct
     */

    /**
     * The Open MCT application. This may be configured by installing plugins
     * or registering extensions before the application is started.
     * @class MCT
     * @memberof module:openmct
     * @augments {EventEmitter}
     */
    function MCT() {
        EventEmitter.call(this);
        /* eslint-disable no-undef */
        this.buildInfo = {
            version: __OPENMCT_VERSION__,
            buildDate: __OPENMCT_BUILD_DATE__,
            revision: __OPENMCT_REVISION__,
            branch: __OPENMCT_BUILD_BRANCH__
        };
        /* eslint-enable no-undef */

        this.legacyBundle = {
            extensions: {
                services: [
                    {
                        key: "openmct",
                        implementation: function ($injector) {
                            this.$injector = $injector;

                            return this;
                        }.bind(this),
                        depends: ['$injector']
                    }
                ]
            }
        };

        /**
         * Tracks current selection state of the application.
         * @private
         */
        this.selection = new Selection(this);

        /**
         * MCT's time conductor, which may be used to synchronize view contents
         * for telemetry- or time-based views.
         * @type {module:openmct.TimeConductor}
         * @memberof module:openmct.MCT#
         * @name conductor
         */
        this.time = new api.TimeAPI();

        /**
         * An interface for interacting with the composition of domain objects.
         * The composition of a domain object is the list of other domain
         * objects it "contains" (for instance, that should be displayed
         * beneath it in the tree.)
         *
         * `composition` may be called as a function, in which case it acts
         * as [`composition.get`]{@link module:openmct.CompositionAPI#get}.
         *
         * @type {module:openmct.CompositionAPI}
         * @memberof module:openmct.MCT#
         * @name composition
         */
        this.composition = new api.CompositionAPI(this);

        /**
         * Registry for views of domain objects which should appear in the
         * main viewing area.
         *
         * @type {module:openmct.ViewRegistry}
         * @memberof module:openmct.MCT#
         * @name objectViews
         */
        this.objectViews = new ViewRegistry();

        /**
         * Registry for views which should appear in the Inspector area.
         * These views will be chosen based on the selection state.
         *
         * @type {module:openmct.InspectorViewRegistry}
         * @memberof module:openmct.MCT#
         * @name inspectorViews
         */
        this.inspectorViews = new InspectorViewRegistry();

        /**
         * Registry for views which should appear in Edit Properties
         * dialogs, and similar user interface elements used for
         * modifying domain objects external to its regular views.
         *
         * @type {module:openmct.ViewRegistry}
         * @memberof module:openmct.MCT#
         * @name propertyEditors
         */
        this.propertyEditors = new ViewRegistry();

        /**
         * Registry for views which should appear in the status indicator area.
         * @type {module:openmct.ViewRegistry}
         * @memberof module:openmct.MCT#
         * @name indicators
         */
        this.indicators = new ViewRegistry();

        /**
         * Registry for views which should appear in the toolbar area while
         * editing. These views will be chosen based on the selection state.
         *
         * @type {module:openmct.ToolbarRegistry}
         * @memberof module:openmct.MCT#
         * @name toolbars
         */
        this.toolbars = new ToolbarRegistry();

        /**
         * Registry for domain object types which may exist within this
         * instance of Open MCT.
         *
         * @type {module:openmct.TypeRegistry}
         * @memberof module:openmct.MCT#
         * @name types
         */
        this.types = new api.TypeRegistry();

        /**
         * An interface for interacting with domain objects and the domain
         * object hierarchy.
         *
         * @type {module:openmct.ObjectAPI}
         * @memberof module:openmct.MCT#
         * @name objects
         */
        this.objects = new api.ObjectAPI.default(this.types, this);

        /**
         * An interface for retrieving and interpreting telemetry data associated
         * with a domain object.
         *
         * @type {module:openmct.TelemetryAPI}
         * @memberof module:openmct.MCT#
         * @name telemetry
         */
        this.telemetry = new api.TelemetryAPI(this);

        /**
         * An interface for creating new indicators and changing them dynamically.
         *
         * @type {module:openmct.IndicatorAPI}
         * @memberof module:openmct.MCT#
         * @name indicators
         */
        this.indicators = new api.IndicatorAPI(this);

        this.notifications = new api.NotificationAPI();

        this.editor = new api.EditorAPI.default(this);

        this.overlays = new OverlayAPI.default();

        this.menus = new api.MenuAPI(this);

        this.actions = new api.ActionsAPI(this);

        this.status = new api.StatusAPI(this);

        this.router = new ApplicationRouter();

        this.branding = BrandingAPI.default;

        this.legacyRegistry = new BundleRegistry();
        installDefaultBundles(this.legacyRegistry);

        // Plugins that are installed by default

        this.install(this.plugins.Plot());
        this.install(this.plugins.TelemetryTable());
        this.install(PreviewPlugin.default());
        this.install(LegacyIndicatorsPlugin());
        this.install(LicensesPlugin.default());
        this.install(RemoveActionPlugin.default());
        this.install(MoveActionPlugin.default());
        this.install(DuplicateActionPlugin.default());
        this.install(this.plugins.FolderView());
        this.install(this.plugins.Tabs());
        this.install(ImageryPlugin.default());
        this.install(this.plugins.FlexibleLayout());
        this.install(this.plugins.GoToOriginalAction());
        this.install(this.plugins.ImportExport());
        this.install(this.plugins.WebPage());
        this.install(this.plugins.Condition());
        this.install(this.plugins.ConditionWidget());
        this.install(this.plugins.URLTimeSettingsSynchronizer());
        this.install(this.plugins.NotificationIndicator());
        this.install(this.plugins.NewFolderAction());
        this.install(this.plugins.ViewDatumAction());
        this.install(this.plugins.ObjectInterceptors());
        this.install(this.plugins.NonEditableFolder());
    }

    MCT.prototype = Object.create(EventEmitter.prototype);

    MCT.prototype.MCT = MCT;

    MCT.prototype.legacyExtension = function (category, extension) {
        this.legacyBundle.extensions[category] =
            this.legacyBundle.extensions[category] || [];
        this.legacyBundle.extensions[category].push(extension);
    };

    /**
     * Return a legacy object, for compatibility purposes only.  This method
     * will be deprecated and removed in the future.
     * @private
     */
    MCT.prototype.legacyObject = function (domainObject) {
        let capabilityService = this.$injector.get('capabilityService');

        function instantiate(model, keyString) {
            const capabilities = capabilityService.getCapabilities(model, keyString);
            model.id = keyString;

            return new DomainObjectImpl(keyString, model, capabilities);
        }

        if (Array.isArray(domainObject)) {
            // an array of domain objects. [object, ...ancestors] representing
            // a single object with a given chain of ancestors.  We instantiate
            // as a single contextual domain object.
            return domainObject
                .map((o) => {
                    let keyString = objectUtils.makeKeyString(o.identifier);
                    let oldModel = objectUtils.toOldFormat(o);

                    return instantiate(oldModel, keyString);
                })
                .reverse()
                .reduce((parent, child) => {
                    return new ContextualDomainObject(child, parent);
                });

        } else {
            let keyString = objectUtils.makeKeyString(domainObject.identifier);
            let oldModel = objectUtils.toOldFormat(domainObject);

            return instantiate(oldModel, keyString);
        }
    };

    /**
     * Set path to where assets are hosted.  This should be the path to main.js.
     * @memberof module:openmct.MCT#
     * @method setAssetPath
     */
    MCT.prototype.setAssetPath = function (assetPath) {
        this._assetPath = assetPath;
    };

    /**
     * Get path to where assets are hosted.
     * @memberof module:openmct.MCT#
     * @method getAssetPath
     */
    MCT.prototype.getAssetPath = function () {
        const assetPathLength = this._assetPath && this._assetPath.length;
        if (!assetPathLength) {
            return '/';
        }

        if (this._assetPath[assetPathLength - 1] !== '/') {
            return this._assetPath + '/';
        }

        return this._assetPath;
    };

    /**
     * Start running Open MCT. This should be called only after any plugins
     * have been installed.
     * @fires module:openmct.MCT~start
     * @memberof module:openmct.MCT#
     * @method start
     * @param {HTMLElement} [domElement] the DOM element in which to run
     *        MCT; if undefined, MCT will be run in the body of the document
     */
    MCT.prototype.start = function (domElement = document.body, isHeadlessMode = false) {
        if (this.types.get('layout') === undefined) {
            this.install(this.plugins.DisplayLayout({
                showAsView: ['summary-widget']
            }));
        }

        this.element = domElement;

        this.legacyExtension('runs', {
            depends: ['navigationService'],
            implementation: function (navigationService) {
                navigationService
                    .addListener(this.emit.bind(this, 'navigation'));
            }.bind(this)
        });

        // TODO: remove with legacy types.
        this.types.listKeys().forEach(function (typeKey) {
            const type = this.types.get(typeKey);
            const legacyDefinition = type.toLegacyDefinition();
            legacyDefinition.key = typeKey;
            this.legacyExtension('types', legacyDefinition);
        }.bind(this));

        this.legacyRegistry.register('adapter', this.legacyBundle);
        this.legacyRegistry.enable('adapter');

        this.router.route(/^\/$/, () => {
            this.router.setPath('/browse/');
        });

        /**
         * Fired by [MCT]{@link module:openmct.MCT} when the application
         * is started.
         * @event start
         * @memberof module:openmct.MCT~
         */
        const startPromise = new Main();
        startPromise.run(this)
            .then(function (angular) {
                this.$angular = angular;
                // OpenMCT Object provider doesn't operate properly unless
                // something has depended upon objectService.  Cool, right?
                this.$injector.get('objectService');

                if (!isHeadlessMode) {
                    const appLayout = new Vue({
                        components: {
                            'Layout': Layout.default
                        },
                        provide: {
                            openmct: this
                        },
                        template: '<Layout ref="layout"></Layout>'
                    });
                    domElement.appendChild(appLayout.$mount().$el);

                    this.layout = appLayout.$refs.layout;
                    Browse(this);
                }

                this.router.start();
                this.emit('start');
            }.bind(this));
    };

    MCT.prototype.startHeadless = function () {
        let unreachableNode = document.createElement('div');

        return this.start(unreachableNode, true);
    };

    /**
     * Install a plugin in MCT.
     *
     * @param {Function} plugin a plugin install function which will be
     *     invoked with the mct instance.
     * @memberof module:openmct.MCT#
     */
    MCT.prototype.install = function (plugin) {
        plugin(this);
    };

    MCT.prototype.destroy = function () {
        this.emit('destroy');
        this.router.destroy();
    };

    MCT.prototype.plugins = plugins;

    return MCT;
});
