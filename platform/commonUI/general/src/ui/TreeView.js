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
    './TreeNodeView',
    '../../res/templates/tree/wait-node.html'
], function ($, TreeNodeView, spinnerTemplate) {

    function TreeView(gestureService, openmct, selectFn) {
        this.ul = $('<ul class="c-tree"></ul>');
        this.nodeViews = [];
        this.callbacks = [];
        this.selectFn = selectFn || this.value.bind(this);
        this.gestureService = gestureService;
        this.pending = false;
        this.openmct = openmct;
    }

    TreeView.prototype.newTreeView = function () {
        return new TreeView(this.gestureService, this.openmct, this.selectFn);
    };

    TreeView.prototype.setSize = function (sz) {
        var nodeView;

        while (this.nodeViews.length < sz) {
            nodeView = new TreeNodeView(
                this.gestureService,
                this.newTreeView.bind(this),
                this.selectFn,
                this.openmct
            );
            this.nodeViews.push(nodeView);
            this.ul.append($(nodeView.elements()));
        }

        while (this.nodeViews.length > sz) {
            nodeView = this.nodeViews.pop();
            $(nodeView.elements()).remove();
        }
    };

    TreeView.prototype.loadComposition = function () {
        var self = this,
            domainObject = this.activeObject;

        function addNode(domainObj, index) {
            self.nodeViews[index].model(domainObj);
        }

        function addNodes(domainObjects) {
            if (self.pending) {
                self.pending = false;
                self.nodeViews = [];
                self.ul.empty();
            }

            if (domainObject === self.activeObject) {
                self.setSize(domainObjects.length);
                domainObjects.forEach(addNode);
                self.updateNodeViewSelection();
            }
        }

        domainObject.useCapability('composition')
            .then(addNodes);
    };

    TreeView.prototype.model = function (domainObject) {
        if (this.unlisten) {
            this.unlisten();
        }

        this.activeObject = domainObject;
        this.ul.empty();

        if (domainObject && domainObject.hasCapability('composition')) {
            this.pending = true;
            this.ul.append($(spinnerTemplate));
            this.unlisten = domainObject.getCapability('mutation')
                .listen(this.loadComposition.bind(this));
            this.loadComposition(domainObject);
        } else {
            this.setSize(0);
        }
    };

    TreeView.prototype.updateNodeViewSelection = function () {
        this.nodeViews.forEach(function (nodeView) {
            nodeView.value(this.selectedObject);
        }.bind(this));
    };

    TreeView.prototype.value = function (domainObject, event) {
        this.selectedObject = domainObject;
        this.updateNodeViewSelection();
        this.callbacks.forEach(function (callback) {
            callback(domainObject, event);
        });
    };

    TreeView.prototype.observe = function (callback) {
        this.callbacks.push(callback);

        return function () {
            this.callbacks = this.callbacks.filter(function (c) {
                return c !== callback;
            });
        }.bind(this);
    };

    /**
     *
     * @returns {HTMLElement[]}
     */
    TreeView.prototype.elements = function () {
        return this.ul;
    };

    return TreeView;
});
