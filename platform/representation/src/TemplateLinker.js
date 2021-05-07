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

define(
    [],
    function () {

        /**
         * The `templateLinker` service is intended for internal use by
         * the `mct-include` and `mct-representation` directives. It is
         * used to support common behavior of directives; specifically,
         * loading templates and inserting them into a specified element,
         * and/or removing that element from the DOM when there is no
         * template to populate it with.
         *
         * @param {Function} $templateRequest Angular's `$templateRequest`
         *        service
         * @param $sce Angular's `$sce` service
         * @param {Function} $compile Angular's `$compile` service
         * @param $log Angular's `$log` service
         * @private
         */
        function TemplateLinker($templateRequest, $sce, $compile, $log) {
            this.$templateRequest = $templateRequest;
            this.$sce = $sce;
            this.$compile = $compile;
            this.$log = $log;
        }

        /**
         * Load a template from the given URL. This request will be handled
         * via `$templateRequest` to ensure caching et cetera.
         * @param {string} the URL for the template
         * @returns {Promise.<string>} a promise for the HTML content of
         *          the template
         */
        TemplateLinker.prototype.load = function (templateUrl) {
            return this.$templateRequest(
                this.$sce.trustAsResourceUrl(templateUrl),
                false
            );
        };

        /**
         * Get a path to a template from an extension definition fo
         * a template, representation, or view.
         * @param {TemplateDefinition} extensionDefinition the definition
         *        of the template/representation/view to resolve
         */
        TemplateLinker.prototype.getPath = function (extensionDefinition) {
            return [
                extensionDefinition.bundle.path,
                extensionDefinition.bundle.resources,
                extensionDefinition.templateUrl
            ].join('/');
        };

        /**
         * Populate the given element with templates, within the given scope;
         * intended to support the `link` function of the supported directives.
         *
         * @param {Scope} scope the Angular scope to use when rendering
         *        templates
         * @param element the jqLite-wrapped element into which templates
         *        should be inserted
         * @param {TemplateDefinition} extensionDefinition the definition
         *        of the template/representation/view to display initially
         * @returns {Function} a function which can be called with a template's
         *          extension definition to switch templates, or `undefined`
         *          to remove.
         */
        TemplateLinker.prototype.link = function (scope, element, ext) {
            var activeElement = element,
                activeTemplateUrl,
                comment = this.$compile('<!-- hidden mct element -->')(scope),
                activeScope,
                self = this;

            function destroyScope() {
                if (activeScope) {
                    activeScope.$destroy();
                    activeScope = undefined;
                }
            }

            function removeElement() {
                if (activeElement !== comment) {
                    destroyScope();
                    activeElement.replaceWith(comment);
                    activeElement = comment;
                }
            }

            function addElement() {
                if (activeElement !== element) {
                    activeElement.replaceWith(element);
                    activeElement = element;
                    activeElement.empty();
                }
            }

            function populateElement(template) {
                destroyScope();
                activeScope = scope.$new(false);
                element.html(template);
                self.$compile(element.contents())(activeScope);
            }

            function showTemplate(template) {
                addElement();
                populateElement(template);
                activeTemplateUrl = undefined;
            }

            function badTemplateUrl(templateUrl) {
                self.$log.warn("Couldn't load template at " + templateUrl);
                removeElement();
            }

            function changeTemplateUrl(templateUrl) {
                if (templateUrl) {
                    destroyScope();
                    addElement();
                    self.load(templateUrl).then(function (template) {
                        // Avoid race conditions
                        if (templateUrl === activeTemplateUrl) {
                            populateElement(template);
                        }
                    }, function () {
                        badTemplateUrl(templateUrl);
                    });
                } else {
                    removeElement();
                }

                activeTemplateUrl = templateUrl;
            }

            function changeTemplate(templateExt) {
                templateExt = templateExt || {};
                if (templateExt.templateUrl) {
                    changeTemplateUrl(self.getPath(templateExt));
                } else if (templateExt.template) {
                    showTemplate(templateExt.template);
                } else {
                    removeElement();
                }
            }

            changeTemplate(ext);

            return changeTemplate;
        };

        return TemplateLinker;
    }
);

