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
import DuplicateTask from './DuplicateTask';

export default class DuplicateAction {
    constructor(openmct) {
        this.name = 'Duplicate';
        this.key = 'duplicate';
        this.description = 'Duplicate this object.';
        this.cssClass = "icon-duplicate";
        this.group = "action";
        this.priority = 7;

        this.openmct = openmct;
    }

    async invoke(objectPath) {
        let object = objectPath[0];
        this.parent = objectPath[1];

        this.showForm(object, this.parent);
    }

    inNavigationPath(object) {
        return this.openmct.router.path
            .some(objectInPath => this.openmct.objects.areIdsEqual(objectInPath.identifier, object.identifier));
    }

    async onSave(object, changes, parent) {
        console.log('onSave');
        let inNavigationPath = this.inNavigationPath(object);
        if (inNavigationPath && this.openmct.editor.isEditing()) {
            this.openmct.editor.save();
        }

        if (changes.name && (changes.name !== object.name)) {
            object.name = changes.name;
        }


        // duplicate
        let duplicationTask = new DuplicateTask(this.openmct);
        duplicationTask.duplicate(object, parent);
    }

    showForm(domainObject, parentDomainObject) {
        const formStructure =  {
            title: "Duplicate Item",
            sections: [
                {
                    rows: [
                        {
                            key: "name",
                            control: "textfield",
                            name: "Title",
                            pattern: "\\S+",
                            required: true,
                            cssClass: "l-input-lg",
                            value: domainObject.name
                        },
                        {
                            name: "location",
                            control: "locator",
                            required: true,
                            parent: parentDomainObject,
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
            let currentParentKeystring = this.openmct.objects.makeKeyString(currentParent.identifier);
            let parentCandidateKeystring = this.openmct.objects.makeKeyString(parentCandidate.identifier);
            let objectKeystring = this.openmct.objects.makeKeyString(object.identifier);

            if (!parentCandidateKeystring || !currentParentKeystring) {
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
        let parent = objectPath[1];
        let parentType = parent && this.openmct.types.get(parent.type);
        let child = objectPath[0];
        let childType = child && this.openmct.types.get(child.type);
        let locked = child.locked ? child.locked : parent && parent.locked;

        if (locked) {
            return false;
        }

        return childType
            && childType.definition.creatable
            && parentType
            && parentType.definition.creatable
            && Array.isArray(parent.composition);
    }
}
