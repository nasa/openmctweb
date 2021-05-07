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
    'zepto',
    '../../res/templates/tree/node.html',
    './ToggleView',
    './TreeLabelView'
], function ($, nodeTemplate, ToggleView, TreeLabelView) {

    function TreeNodeView(gestureService, subtreeFactory, selectFn, openmct) {
        this.li = $('<li class="c-tree__item-h">');
        this.openmct = openmct;
        this.statusClasses = [];

        this.toggleView = new ToggleView(false);
        this.toggleView.observe(function (state) {
            if (state) {
                if (!this.subtreeView) {
                    this.subtreeView = subtreeFactory();
                    this.subtreeView.model(this.activeObject);
                    this.li.find('.c-tree__item-subtree').eq(0)
                        .append($(this.subtreeView.elements()));
                }

                $(this.subtreeView.elements()).removeClass('hidden');
            } else if (this.subtreeView) {
                $(this.subtreeView.elements()).addClass('hidden');
            }
        }.bind(this));

        this.labelView = new TreeLabelView(gestureService);

        $(this.labelView.elements()).on('click', function (event) {
            selectFn(this.activeObject, event);
        }.bind(this));

        this.li.append($(nodeTemplate));
        this.li.find('span').eq(0)
            .append($(this.toggleView.elements()))
            .append($(this.labelView.elements()));

        this.model(undefined);
    }

    TreeNodeView.prototype.updateStatusClasses = function (statuses) {
        this.statusClasses.forEach(function (statusClass) {
            this.li.removeClass(statusClass);
        }.bind(this));

        this.statusClasses = statuses.map(function (status) {
            return 's-status-' + status;
        });

        this.statusClasses.forEach(function (statusClass) {
            this.li.addClass(statusClass);
        }.bind(this));
    };

    TreeNodeView.prototype.model = function (domainObject) {
        if (this.unlisten) {
            this.unlisten();
        }

        this.activeObject = domainObject;
        if (domainObject && domainObject.hasCapability('adapter')) {
            var obj = domainObject.useCapability('adapter');
            var hasComposition = this.openmct.composition.get(obj) !== undefined;
            if (hasComposition) {
                $(this.toggleView.elements()).addClass('is-enabled');
            } else {
                $(this.toggleView.elements()).removeClass('is-enabled');
            }
        }

        if (domainObject && domainObject.hasCapability('status')) {
            this.unlisten = domainObject.getCapability('status')
                .listen(this.updateStatusClasses.bind(this));
            this.updateStatusClasses(
                domainObject.getCapability('status').list()
            );
        }

        this.labelView.model(domainObject);
        if (this.subtreeView) {
            this.subtreeView.model(domainObject);
        }
    };

    function getIdPath(domainObject) {
        var context = domainObject && domainObject.getCapability('context');

        function getId(domainObj) {
            return domainObj.getId();
        }

        return context ? context.getPath().map(getId) : [];
    }

    TreeNodeView.prototype.value = function (domainObject) {
        var activeIdPath = getIdPath(this.activeObject),
            selectedIdPath = getIdPath(domainObject);

        if (this.onSelectionPath) {
            this.li.find('.js-tree__item').eq(0).removeClass('is-selected');
            if (this.subtreeView) {
                this.subtreeView.value(undefined);
            }
        }

        this.onSelectionPath =
            Boolean(domainObject)
            && Boolean(this.activeObject)
            && (activeIdPath.length <= selectedIdPath.length)
                && activeIdPath.every(function (id, index) {
                    return selectedIdPath[index] === id;
                });

        if (this.onSelectionPath) {
            if (activeIdPath.length === selectedIdPath.length) {
                this.li.find('.js-tree__item').eq(0).addClass('is-selected');
            } else {
                // Expand to reveal the selection
                this.toggleView.value(true);
                this.subtreeView.value(domainObject);
            }
        }
    };

    /**
     *
     * @returns {HTMLElement[]}
     */
    TreeNodeView.prototype.elements = function () {
        return this.li;
    };

    return TreeNodeView;
});
