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

 export default class OpenInNewTab {
    constructor(openmct) {
        this.name = 'Henry open in new tab';
        this.key = 'newTab';
        this.description = 'Open domain object in new tab';
        this.group = 'action';
        this.priority = 4;


        this._openmct = openmct;
    }
    invoke(objectPath) {
        // here's the logic
        console.log('henry invoke');
        // objectPath[0] is the domain object
        // this._openmct.objects.getOriginalPath(objectPath[0].identifier)
        //     .then((originalPath) => {
        //         let url = '#/browse/' + originalPath
        //             .map(function (o) {
        //                 return o && this._openmct.objects.makeKeyString(o.identifier);
        //             }.bind(this))
        //             .reverse()
        //             .slice(1)
        //             .join('/');

        //         window.location.href = url;
        //     });
    }
    appliesTo(objectPath) {
        // this controlls where this component should show
        console.log('henry appliesTo', objectPath);
        // let parentKeystring = objectPath[1] && this._openmct.objects.makeKeyString(objectPath[1].identifier);

        // if (!parentKeystring) {
        //     return false;
        // }

        // return (parentKeystring !== objectPath[0].location);
        return true;
    }
    urlForNewTab(mode, domainObject) {
        var search = this.$location.search(),
        arr = [];
    for (var key in search) {
        if (Object.prototype.hasOwnProperty.call(search, key)) {
            arr.push(key + '=' + search[key]);
        }
    }

    var searchPath = "?" + arr.join('&'),
        newTabPath =
            "#" + this.urlForLocation(mode, domainObject)
                    + searchPath;

    return newTabPath;
    }

}
