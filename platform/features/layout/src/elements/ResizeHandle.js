/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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
define(
    [],
    () => {

        /**
         * @interface platform/features/layout.ElementHandle
         * @private
         */

        /**
         * Handle for changing width/height properties of an element.
         * This is used to support drag handles for different
         * element types in a fixed position view.
         * @memberof platform/features/layout
         * @constructor
         */
        class ResizeHandle {
          constructor(element, minWidth, minHeight) {
            this.element = element;

            // Ensure reasonable defaults
            this.minWidth = minWidth || 0;
            this.minHeight = minHeight || 0;
        }

          x(value) {
            let element = this.element;
            if (arguments.length > 0) {
                element.width = Math.max(
                    this.minWidth,
                    value - element.x
                );
            }
            return element.x + element.width;
        };

        y(value) {
            let element = this.element;
            if (arguments.length > 0) {
                element.height = Math.max(
                    this.minHeight,
                    value - element.y
                );
            }
            return element.y + element.height;
        };
      }
        return ResizeHandle;

    }
);
