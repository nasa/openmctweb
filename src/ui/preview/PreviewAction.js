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
import Preview from './Preview.vue';
import Vue from 'vue';

export default class PreviewAction {
    constructor(openmct) {
        /**
         * Metadata
         */
        this.name = 'View';
        this.key = 'preview';
        this.description = 'View in large dialog';
        this.cssClass = 'icon-items-expand';
        this.group = 'windowing';
        this.priority = 1;

        /**
         * Dependencies
         */
        this._openmct = openmct;

        if (PreviewAction.isVisible === undefined) {
            PreviewAction.isVisible = false;
        }
    }

    invoke(objectPath) {
        let preview = new Vue({
            components: {
                Preview
            },
            provide: {
                openmct: this._openmct,
                objectPath: objectPath
            },
            template: '<Preview></Preview>'
        });
        preview.$mount();

        let overlay = this._openmct.overlays.overlay({
            element: preview.$el,
            size: 'large',
            buttons: [
                {
                    label: 'Done',
                    callback: () => overlay.dismiss()
                }
            ],
            onDestroy: () => {
                PreviewAction.isVisible = false;
                preview.$destroy();
            }
        });

        PreviewAction.isVisible = true;
    }

    appliesTo(objectPath) {
        return !PreviewAction.isVisible && !this._isNavigatedObject(objectPath);
    }

    _isNavigatedObject(objectPath) {
        let targetObject = objectPath[0];
        let navigatedObject = this._openmct.router.path[0];

        return this._openmct.objects.areIdsEqual(targetObject.identifier, navigatedObject.identifier);
    }
    _preventPreview(objectPath) {
        const noPreviewTypes = ['folder'];

        return noPreviewTypes.includes(objectPath[0].type);
    }
}
