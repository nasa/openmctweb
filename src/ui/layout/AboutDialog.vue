<template>
<!-- eslint-disable vue/no-v-html -->
<div class="c-about c-about--splash">
    <div class="c-about__image c-splash-image"></div>
    <div class="c-about__text s-text">
        <div
            v-if="branding.aboutHtml"
            class="c-about__text__element"
            v-html="branding.aboutHtml"
        ></div>
        <div class="c-about__text__element">
            <h1 class="l-title s-title">
                Open MCT
            </h1>
            <div class="l-description s-description">
                <p>Open MCT, Copyright &copy; 2014-2021, United States Government as represented by the Administrator of the National Aeronautics and Space Administration. All rights reserved.</p>
                <p>
                    Open MCT is licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at <a
                        target="_blank"
                        href="http://www.apache.org/licenses/LICENSE-2.0"
                    >http://www.apache.org/licenses/LICENSE-2.0</a>.
                </p>
                <p>Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.</p>
                <p>Open MCT includes source code licensed under additional open source licenses. See the Open Source Licenses file included with this distribution or <a @click="showLicenses">click here for third party licensing information</a>.</p>
            </div>
            <h2>Version Information</h2>
            <ul class="t-info l-info s-info">
                <li>Version: {{ buildInfo.version || 'Unknown' }}</li>
                <li>Build Date: {{ buildInfo.buildDate || 'Unknown' }}</li>
                <li>Revision: {{ buildInfo.revision || 'Unknown' }}</li>
                <li>Branch: {{ buildInfo.branch || 'Unknown' }}</li>
            </ul>
        </div>
    </div>
</div>
</template>
<script>
export default {
    inject: ['openmct'],
    data() {
        return {
            branding: JSON.parse(JSON.stringify(this.openmct.branding())),
            buildInfo: JSON.parse(JSON.stringify(this.openmct.buildInfo))
        };
    },
    methods: {
        showLicenses() {
            window.open('#/licenses');
        }
    }
};
</script>
