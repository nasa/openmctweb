/*****************************************************************************
 * Open MCT, Copyright (c) 2009-2016, United States Government
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

define([], () => {

    /**
     * A column reflecting properties from domain object metadata.
     * @constructor
     * @implements {platform/features/timeline.TimelineCSVColumn}
     */
    class MetadataColumn {
      constructor(propertyName) {
        this.propertyName = propertyName;
      }

      name() {
          return this.propertyName;
      };

      value(domainObject) {
        let properties = domainObject.useCapability('metadata'),
            name = this.propertyName;
        return properties.reduce( (value, property) => {
            return property.name === name ?
                property.value : value;
        }, "");
    };
  }
    return MetadataColumn;
});
