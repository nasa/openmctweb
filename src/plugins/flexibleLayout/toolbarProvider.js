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

function ToolbarProvider(openmct) {

    return {
        name: "Flexible Layout Toolbar",
        key: "flex-layout",
        description: "A toolbar for objects inside a Flexible Layout.",
        forSelection: function (selection) {
            let context = selection[0][0].context;

            return (context && context.type
                && (context.type === 'flexible-layout' || context.type === 'container' || context.type === 'frame'));
        },
        toolbar: function (selection) {
            let selectionPath = selection[0];
            let primary = selectionPath[0];
            let secondary = selectionPath[1];
            let tertiary = selectionPath[2];
            let deleteFrame;
            let toggleContainer;
            let deleteContainer;
            let addContainer;
            let toggleFrame;

            toggleContainer = {
                control: 'toggle-button',
                key: 'toggle-layout',
                domainObject: primary.context.item,
                property: 'configuration.rowsLayout',
                options: [
                    {
                        value: true,
                        icon: 'icon-columns',
                        title: 'Columns layout'
                    },
                    {
                        value: false,
                        icon: 'icon-rows',
                        title: 'Rows layout'
                    }
                ]
            };

            function getSeparator() {
                return {
                    control: "separator"
                };
            }

            if (primary.context.type === 'frame') {
                if (secondary.context.item.locked) {
                    return [];
                }

                let frameId = primary.context.frameId;
                let layoutObject = tertiary.context.item;
                let containers = layoutObject
                    .configuration
                    .containers;
                let container = containers
                    .filter(c => c.frames.some(f => f.id === frameId))[0];
                let containerIndex = containers.indexOf(container);
                let frame = container && container
                    .frames
                    .filter((f => f.id === frameId))[0];
                let frameIndex = container && container.frames.indexOf(frame);

                deleteFrame = {
                    control: "button",
                    domainObject: primary.context.item,
                    method: function () {
                        let deleteFrameAction = tertiary.context.deleteFrame;

                        let prompt = openmct.overlays.dialog({
                            iconClass: 'alert',
                            message: `This action will remove this frame from this Flexible Layout. Do you want to continue?`,
                            buttons: [
                                {
                                    label: 'Ok',
                                    emphasis: 'true',
                                    callback: function () {
                                        deleteFrameAction(primary.context.frameId);
                                        prompt.dismiss();
                                    }
                                },
                                {
                                    label: 'Cancel',
                                    callback: function () {
                                        prompt.dismiss();
                                    }
                                }
                            ]
                        });
                    },
                    key: "remove",
                    icon: "icon-trash",
                    title: "Remove Frame"
                };
                toggleFrame = {
                    control: "toggle-button",
                    domainObject: secondary.context.item,
                    property: `configuration.containers[${containerIndex}].frames[${frameIndex}].noFrame`,
                    options: [
                        {
                            value: false,
                            icon: 'icon-frame-hide',
                            title: "Frame hidden"
                        },
                        {
                            value: true,
                            icon: 'icon-frame-show',
                            title: "Frame visible"
                        }
                    ]
                };
                addContainer = {
                    control: "button",
                    domainObject: tertiary.context.item,
                    method: tertiary.context.addContainer,
                    key: "add",
                    icon: "icon-plus-in-rect",
                    title: 'Add Container'
                };

                toggleContainer.domainObject = secondary.context.item;

            } else if (primary.context.type === 'container') {
                if (primary.context.item.locked) {
                    return [];
                }

                deleteContainer = {
                    control: "button",
                    domainObject: primary.context.item,
                    method: function () {
                        let removeContainer = secondary.context.deleteContainer;
                        let containerId = primary.context.containerId;

                        let prompt = openmct.overlays.dialog({
                            iconClass: 'alert',
                            message: 'This action will permanently delete this container from this Flexible Layout',
                            buttons: [
                                {
                                    label: 'Ok',
                                    emphasis: 'true',
                                    callback: function () {
                                        removeContainer(containerId);
                                        prompt.dismiss();
                                    }
                                },
                                {
                                    label: 'Cancel',
                                    callback: function () {
                                        prompt.dismiss();
                                    }
                                }
                            ]
                        });
                    },
                    key: "remove",
                    icon: "icon-trash",
                    title: "Remove Container"
                };

                addContainer = {
                    control: "button",
                    domainObject: secondary.context.item,
                    method: secondary.context.addContainer,
                    key: "add",
                    icon: "icon-plus-in-rect",
                    title: 'Add Container'
                };

            } else if (primary.context.type === 'flexible-layout') {
                if (primary.context.item.locked) {
                    return [];
                }

                addContainer = {
                    control: "button",
                    domainObject: primary.context.item,
                    method: primary.context.addContainer,
                    key: "add",
                    icon: "icon-plus-in-rect",
                    title: 'Add Container'
                };

            }

            let toolbar = [
                toggleContainer,
                addContainer,
                toggleFrame ? getSeparator() : undefined,
                toggleFrame,
                deleteFrame || deleteContainer ? getSeparator() : undefined,
                deleteFrame,
                deleteContainer
            ];

            return toolbar.filter(button => button !== undefined);
        }
    };
}

export default ToolbarProvider;
