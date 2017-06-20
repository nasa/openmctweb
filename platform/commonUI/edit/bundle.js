/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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
    "./src/controllers/EditActionController",
    "./src/controllers/EditPanesController",
    "./src/controllers/EditNotesController",
    "./src/controllers/ElementsController",
    "./src/controllers/EditObjectController",
    "./src/actions/EditAndComposeAction",
    "./src/actions/EditAction",
    "./src/actions/PropertiesAction",
    "./src/actions/RemoveAction",
    "./src/actions/SaveAction",
    "./src/actions/SaveAndStopEditingAction",
    "./src/actions/SaveAsAction",
    "./src/actions/CancelAction",
    "./src/policies/EditActionPolicy",
    "./src/policies/EditPersistableObjectsPolicy",
    "./src/policies/EditableLinkPolicy",
    "./src/policies/EditableMovePolicy",
    "./src/policies/EditContextualActionPolicy",
    "./src/representers/EditRepresenter",
    "./src/representers/EditToolbarRepresenter",
    "./src/capabilities/EditorCapability",
    "./src/capabilities/TransactionCapabilityDecorator",
    "./src/services/EditNotesService",
    "./src/services/TransactionManager",
    "./src/services/TransactionService",
    "./src/creation/CreateMenuController",
    "./src/creation/LocatorController",
    "./src/creation/CreationPolicy",
    "./src/creation/CreateActionProvider",
    "./src/creation/AddActionProvider",
    "./src/creation/CreationService",
    "text!./res/templates/create/locator.html",
    "text!./res/templates/create/create-button.html",
    "text!./res/templates/create/create-menu.html",
    "text!./res/templates/library.html",
    "text!./res/templates/edit-object.html",
    "text!./res/templates/edit-action-buttons.html",
    "text!./res/templates/edit-notes.html",
    "text!./res/templates/elements.html",
    "text!./res/templates/topbar-edit.html",
    'legacyRegistry'
], function (
    EditActionController,
    EditPanesController,
    EditNotesController,
    ElementsController,
    EditObjectController,
    EditAndComposeAction,
    EditAction,
    PropertiesAction,
    RemoveAction,
    SaveAction,
    SaveAndStopEditingAction,
    SaveAsAction,
    CancelAction,
    EditActionPolicy,
    EditPersistableObjectsPolicy,
    EditableLinkPolicy,
    EditableMovePolicy,
    EditContextualActionPolicy,
    EditRepresenter,
    EditToolbarRepresenter,
    EditorCapability,
    TransactionCapabilityDecorator,
    EditNotesService,
    TransactionManager,
    TransactionService,
    CreateMenuController,
    LocatorController,
    CreationPolicy,
    CreateActionProvider,
    AddActionProvider,
    CreationService,
    locatorTemplate,
    createButtonTemplate,
    createMenuTemplate,
    libraryTemplate,
    editObjectTemplate,
    editActionButtonsTemplate,
    editNotesTemplate,
    elementsTemplate,
    topbarEditTemplate,
    legacyRegistry
) {

    legacyRegistry.register("platform/commonUI/edit", {
        "extensions": {
            "controllers": [
                {
                    "key": "EditActionController",
                    "implementation": EditActionController,
                    "depends": [
                        "$scope"
                    ]
                },
                {
                    "key": "EditPanesController",
                    "implementation": EditPanesController,
                    "depends": [
                        "$scope"
                    ]
                },
                {
                    "key": "EditNotesController",
                    "implementation": EditNotesController,
                    "depends": [
                        "$scope",
                        "editNotesService"
                    ]
                },
                {
                    "key": "ElementsController",
                    "implementation": ElementsController,
                    "depends": [
                        "$scope"
                    ]
                },
                {
                    "key": "EditObjectController",
                    "implementation": EditObjectController,
                    "depends": [
                        "$scope",
                        "$location",
                        "navigationService"
                    ]
                },
                {
                    "key": "CreateMenuController",
                    "implementation": CreateMenuController,
                    "depends": [
                        "$scope"
                    ]
                },
                {
                    "key": "LocatorController",
                    "implementation": LocatorController,
                    "depends": [
                        "$scope",
                        "$timeout",
                        "objectService"
                    ]
                }
            ],
            "actions": [
                {
                    "key": "compose",
                    "implementation": EditAndComposeAction
                },
                {
                    "key": "edit",
                    "implementation": EditAction,
                    "depends": [
                        "$location",
                        "navigationService",
                        "$log"
                    ],
                    "description": "Edit",
                    "category": "view-control",
                    "cssClass": "major icon-pencil"
                },
                {
                    "key": "properties",
                    "category": [
                        "contextual",
                        "view-control"
                    ],
                    "implementation": PropertiesAction,
                    "cssClass": "major icon-pencil",
                    "name": "Edit Properties...",
                    "description": "Edit properties of this object.",
                    "depends": [
                        "dialogService"
                    ]
                },
                {
                    "key": "remove",
                    "category": "contextual",
                    "implementation": RemoveAction,
                    "cssClass": "icon-trash",
                    "name": "Remove",
                    "description": "Remove this object from its containing object.",
                    "depends": [
                        "navigationService"
                    ]
                },
                {
                    "key": "save-and-stop-editing",
                    "category": "save",
                    "implementation": SaveAndStopEditingAction,
                    "name": "Save and Finish Editing",
                    "cssClass": "icon-save labeled",
                    "description": "Save changes made to these objects.",
                    "depends": [
                        "dialogService",
                        "notificationService",
                        "editNotesService"
                    ]
                },
                {
                    "key": "save",
                    "category": "save",
                    "implementation": SaveAction,
                    "name": "Save and Continue Editing",
                    "cssClass": "icon-save labeled",
                    "description": "Save changes made to these objects.",
                    "depends": [
                        "dialogService",
                        "notificationService",
                        "editNotesService"
                    ]
                },
                {
                    "key": "save-as",
                    "category": "save",
                    "implementation": SaveAsAction,
                    "name": "Save As...",
                    "cssClass": "icon-save labeled",
                    "description": "Save changes made to these objects.",
                    "depends": [
                        "$injector",
                        "policyService",
                        "dialogService",
                        "copyService",
                        "notificationService"
                    ],
                    "priority": "mandatory"
                },
                {
                    "key": "cancel",
                    "category": "conclude-editing",
                    "implementation": CancelAction,
                    // Because we use the name as label for edit buttons and mct-control buttons need
                    // the label to be set to undefined in order to not apply the labeled CSS rule.
                    "name": undefined,
                    "cssClass": "icon-x no-label",
                    "description": "Discard changes made to these objects.",
                    "depends": []
                }
            ],
            "policies": [
                {
                    "category": "action",
                    "implementation": EditActionPolicy
                },
                {
                    "category": "action",
                    "implementation": EditPersistableObjectsPolicy,
                    "depends": ["openmct"]
                },
                {
                    "category": "action",
                    "implementation": EditContextualActionPolicy,
                    "depends": ["navigationService", "editModeBlacklist", "nonEditContextBlacklist"]
                },
                {
                    "category": "action",
                    "implementation": EditableMovePolicy
                },
                {
                    "category": "action",
                    "implementation": EditableLinkPolicy
                },
                {
                    "implementation": CreationPolicy,
                    "category": "creation"
                }
            ],
            "templates": [
                {
                    "key": "edit-library",
                    "template": libraryTemplate
                }
            ],
            "representations": [
                {
                    "key": "edit-object",
                    "template": editObjectTemplate,
                    "uses": [
                        "view"
                    ],
                    "gestures": [
                        "drop"
                    ]
                },
                {
                    "key": "edit-action-buttons",
                    "template": editActionButtonsTemplate,
                    "uses": [
                        "action"
                    ]
                },
                {
                    "key": "edit-notes",
                    "template": editNotesTemplate
                },
                {
                    "key": "edit-elements",
                    "template": elementsTemplate,
                    "uses": [
                        "composition"
                    ],
                    "gestures": [
                        "drop"
                    ]
                },
                {
                    "key": "topbar-edit",
                    "template": topbarEditTemplate
                },
                {
                    "key": "create-button",
                    "template": createButtonTemplate
                },
                {
                    "key": "create-menu",
                    "template": createMenuTemplate,
                    "uses": [
                        "action"
                    ]
                }
            ],
            "components": [
                {
                    "type": "decorator",
                    "provides": "capabilityService",
                    "implementation": TransactionCapabilityDecorator,
                    "depends": [
                        "$q",
                        "transactionManager"
                    ],
                    "priority": "fallback"
                },
                {
                    "type": "provider",
                    "provides": "transactionService",
                    "implementation": TransactionService,
                    "depends": [
                        "$q",
                        "$log",
                        "cacheService"
                    ]
                },
                {
                    "key": "CreateActionProvider",
                    "provides": "actionService",
                    "type": "provider",
                    "implementation": CreateActionProvider,
                    "depends": [
                        "typeService",
                        "policyService"
                    ]
                },
                {
                    "key": "AddActionProvider",
                    "provides": "actionService",
                    "type": "provider",
                    "implementation": AddActionProvider,
                    "depends": [
                        "$q",
                        "typeService",
                        "dialogService",
                        "policyService"
                    ]
                },
                {
                    "key": "CreationService",
                    "provides": "creationService",
                    "type": "provider",
                    "implementation": CreationService,
                    "depends": [
                        "$q",
                        "$log"
                    ]
                }

            ],
            "representers": [
                {
                    "implementation": EditRepresenter,
                    "depends": [
                        "$log"
                    ]
                },
                {
                    "implementation": EditToolbarRepresenter
                }
            ],
            "constants": [
                {
                    "key": "editModeBlacklist",
                    "value": ["copy", "follow", "link", "locate"]
                },
                {
                    "key": "nonEditContextBlacklist",
                    "value": ["copy", "follow", "properties", "move", "link", "remove", "locate"]
                }
            ],
            "capabilities": [
                {
                    "key": "editor",
                    "name": "Editor Capability",
                    "description": "Provides transactional editing capabilities",
                    "implementation": EditorCapability,
                    "depends": [
                        "transactionService"
                    ]
                }
            ],
            "controls": [
                {
                    "key": "locator",
                    "template": locatorTemplate
                }
            ],
            "services": [
                {
                    "key": "transactionManager",
                    "implementation": TransactionManager,
                    "depends": [
                        "transactionService"
                    ]
                },
                {
                    "key": "editNotesService",
                    "implementation": EditNotesService
                }
            ]
        }
    });
});
