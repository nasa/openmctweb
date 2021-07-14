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
 *****************************************************************************/import {
    createOpenMct,
    resetApplicationState,
    spyOnBuiltins
} from 'utils/testing';

fdescribe("the pane", () => {
    let openmct;
    let appHolder;
    let element;
    let child;
    // let mockObjectPath;

    beforeEach((done) => {
        openmct = createOpenMct();

        appHolder = document.createElement('div');
        appHolder.style.width = '640px';
        appHolder.style.height = '480px';

        openmct = createOpenMct();
        openmct.install(openmct.plugins.MyItems());
        openmct.install(openmct.plugins.LocalTimeSystem());
        openmct.install(openmct.plugins.UTCTimeSystem());

        element = document.createElement('div');
        child = document.createElement('div');
        element.appendChild(child);

        openmct.on('start', done);
        openmct.start(appHolder);

        document.body.append(appHolder);

    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    it('Adding hideTree=true and hideInspector=true in URL makes the tree or inspector pane collapse', async () => {
        // add params to url
        // check width of pane
        // $('.l-shell__pane-tree').width()
        // $('.l-shell__pane-inspector').width()
        openmct.router.setSearchParam('hideTree', 'true');
        openmct.router.setSearchParam('hideInspector', 'true');
        spyOnBuiltins(['reload']);
        await window.location.reload();
        location.reload();
        // console.log(document.body);
        let collapsedTreeElement = document.querySelector('.l-shell__pane-tree .l-pane--collapsed');
        let collapsedInspectorElement = document.querySelector('.l-shell__pane-inspector .l-pane--collapsed');
        expect(collapsedTreeElement && collapsedInspectorElement).toBeTruthy();
    });
});
