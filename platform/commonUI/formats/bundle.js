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

define([
    "./src/FormatProvider",
    "./src/UTCTimeFormat",
    "./src/DurationFormat"
], function (
    FormatProvider,
    UTCTimeFormat,
    DurationFormat
) {

    return {
        name: "platform/commonUI/formats",
        definition: {
            "name": "Format Registry",
            "description": "Provides a registry for formats, which allow parsing and formatting of values.",
            "extensions": {
                "components": [
                    {
                        "provides": "formatService",
                        "type": "provider",
                        "implementation": FormatProvider,
                        "depends": [
                            "formats[]"
                        ]
                    }
                ],
                "formats": [
                    {
                        "key": "utc",
                        "implementation": UTCTimeFormat
                    },
                    {
                        "key": "duration",
                        "implementation": DurationFormat
                    }
                ],
                "constants": [
                    {
                        "key": "DEFAULT_TIME_FORMAT",
                        "value": "utc"
                    }
                ],
                "licenses": [
                    {
                        "name": "d3",
                        "version": "3.0.0",
                        "description": "Incorporates modified code from d3 Time Scales",
                        "author": "Mike Bostock",
                        "copyright": "Copyright 2010-2016 Mike Bostock. "
                    + "All rights reserved.",
                        "link": "https://github.com/d3/d3/blob/master/LICENSE"
                    }
                ]
            }
        }
    };
});
