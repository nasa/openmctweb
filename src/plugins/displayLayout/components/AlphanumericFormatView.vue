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

<template>
<div
    v-if="isEditing"
    class="c-inspect-properties"
>
    <div class="c-inspect-properties__header">
        Alphanumeric Format
    </div>
    <ul class="c-inspect-properties__section">
        <li class="c-inspect-properties__row">
            <div
                class="c-inspect-properties__label"
                title="Printf formatting for the selected telemetry"
            >
                <label for="telemetryPrintfFormat">Format</label>
            </div>
            <div class="c-inspect-properties__value">
                <input
                    id="telemetryPrintfFormat"
                    type="text"
                    :value="telemetryFormat"
                    :placeholder="nonMixedFormat ? '' : 'Mixed'"
                    @change="formatTelemetry"
                >
            </div>
        </li>
    </ul>
</div>
</template>

<script>
export default {
    inject: ['openmct'],
    data() {
        return {
            isEditing: this.openmct.editor.isEditing(),
            telemetryFormat: undefined,
            nonMixedFormat: false
        };
    },
    mounted() {
        this.openmct.editor.on('isEditing', this.toggleEdit);
        this.openmct.selection.on('change', this.handleSelection);
        this.handleSelection(this.openmct.selection.get());
    },
    destroyed() {
        this.openmct.editor.off('isEditing', this.toggleEdit);
        this.openmct.selection.off('change', this.handleSelection);
    },
    methods: {
        toggleEdit(isEditing) {
            this.isEditing = isEditing;
        },
        formatTelemetry(event) {
            let newFormat = event.currentTarget.value;
            this.openmct.selection.get().forEach(selectionPath => {
                selectionPath[0].context.updateTelemetryFormat(newFormat);
            });
            this.telemetryFormat = newFormat;
        },
        handleSelection(selection) {
            if (selection.length === 0 || selection[0].length < 2) {
                return;
            }

            let layoutItem = selection[0][0].context.layoutItem;

            if (!layoutItem) {
                return;
            }

            let format = layoutItem.format;
            this.nonMixedFormat = selection.every(selectionPath => {
                return selectionPath[0].context.layoutItem.format === format;
            });

            this.telemetryFormat = this.nonMixedFormat ? format : '';
        }
    }
};

</script>
