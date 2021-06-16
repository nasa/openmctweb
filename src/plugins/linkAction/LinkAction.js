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

export default class LinkAction {
    constructor(openmct) {
        this.name = 'Create Link';
        this.key = 'link';
        this.description = 'Create Link to object in another location.';
        this.cssClass = "icon-link";
        this.group = "action";
        this.priority = 7;

        this.openmct = openmct;
    }

    invoke(objectPath) {
        this.showForm(objectPath[0], objectPath[1]);
    }

    inNavigationPath(object) {
        return this.openmct.router.path
            .some(objectInPath => this.openmct.objects.areIdsEqual(objectInPath.identifier, object.identifier));
    }

    onSave(object, changes, parent) {
        let inNavigationPath = this.inNavigationPath(object);
        if (inNavigationPath && this.openmct.editor.isEditing()) {
            this.openmct.editor.save();
        }

        this.linkInNewParent(object, parent);
    }

    linkInNewParent(child, newParent) {
        let compositionCollection = this.openmct.composition.get(newParent);

        compositionCollection.add(child);
    }

    showForm(domainObject, parentDomainObject) {

        const formStructure = {
            title: `Link "${domainObject.name}" to a New Location`,
            sections: [
                {
                    rows: [
                        {
                            name: "location",
                            control: "locator",
                            required: true,
                            validate: this.validate(parentDomainObject),
                            key: 'location'
                        }
                    ]
                }
            ]
        };

        this.openmct.forms.showForm(formStructure, {
            domainObject,
            parentDomainObject,
            onSave: this.onSave.bind(this)
        });
    }

    validate(currentParent) {
        return (object, data) => {
            const parentCandidate = data.value;
            // console.log('move action : validateLocation', );
            // TODO: remove getModel, checkPolicy and useCapability
            let currentParentKeystring = this.openmct.objects.makeKeyString(currentParent.identifier);
            let parentCandidateKeystring = this.openmct.objects.makeKeyString(parentCandidate.identifier);
            let objectKeystring = this.openmct.objects.makeKeyString(object.identifier);

            if (!parentCandidateKeystring || !currentParentKeystring) {
                return false;
            }

            if (parentCandidateKeystring === currentParentKeystring) {
                return false;
            }

            if (parentCandidateKeystring === objectKeystring) {
                return false;
            }

            const parentCandidateComposition = parentCandidate.composition;
            if (parentCandidateComposition && parentCandidateComposition.indexOf(objectKeystring) !== -1) {
                return false;
            }

            return parentCandidate && this.openmct.composition.checkPolicy(parentCandidate, object);
        };
    }

    appliesTo(objectPath) {
        let domainObject = objectPath[0];
        let type = domainObject && this.openmct.types.get(domainObject.type);

        return type && type.definition.creatable;
    }

    // appliesTo(objectPath) {
    //     let parent = objectPath[1];
    //     let parentType = parent && this.openmct.types.get(parent.type);
    //     let child = objectPath[0];
    //     let childType = child && this.openmct.types.get(child.type);

    //     if (child.locked || (parent && parent.locked)) {
    //         return false;
    //     }

    //     return parentType
    //         && parentType.definition.creatable
    //         && childType
    //         && childType.definition.creatable
    //         && Array.isArray(parent.composition);
    // }

    // async invoke(objectPath) {
    //     let objectToLink = objectPath[0];
    //     let dialogService = this.openmct.$injector.get('dialogService');
    //     let dialogForm = this.getDialogForm(objectToLink);
    //     let userInput = await dialogService.getUserInput(dialogForm, {});
    //     let newParent = userInput.location;

    //     // legacy check
    //     if (this.isLegacyDomainObject(newParent)) {
    //         newParent = await this.convertFromLegacy(newParent);
    //     }

    //     this.linkInNewParent(objectToLink, newParent);
    // }

    // isLegacyDomainObject(domainObject) {
    //     return domainObject.getCapability !== undefined;
    // }

    // async convertFromLegacy(legacyDomainObject) {
    //     let objectContext = legacyDomainObject.getCapability('context');
    //     let domainObject = await this.openmct.objects.get(objectContext.domainObject.id);

    //     return domainObject;
    // }

    // getDialogForm(objectToLink) {
    //     let validate = this.validate(objectToLink);

    //     return {
    //         name: `Link "${objectToLink.name}" to a New Location`,
    //         sections: [
    //             {
    //                 rows: [
    //                     {
    //                         name: "Link To",
    //                         control: "locator",
    //                         validate,
    //                         key: 'location'
    //                     }
    //                 ]
    //             }
    //         ]
    //     };
    // }

    // validate(objectToLink) {
    //     return (parentObject) => {
    //         let parentCandidateKeystring = this.openmct.objects.makeKeyString(parentObject.getId());
    //         let objectToLinkKeystring = this.openmct.objects.makeKeyString(objectToLink.identifier);
    //         let sameObjectOrChildAlready = parentCandidateKeystring === objectToLinkKeystring
    //             || parentObject.getModel().composition.includes(objectToLinkKeystring);

    //         // the same object or a child already, not valid
    //         if (sameObjectOrChildAlready) {
    //             return false;
    //         }

    //         if (parentObject.getModel().locked) {
    //             return false;
    //         }

    //         // can contain
    //         return this.openmct.composition.checkPolicy(
    //             parentObject.useCapability('adapter'),
    //             objectToLink
    //         );
    //     };
    // }
}
