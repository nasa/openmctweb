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

define(
    [],
    /**
     * A data dictionary describes the telemetry available from a data
     * source and its data types. The data dictionary will be parsed by a custom
     * server provider for this data source (in this case
     * {@link RemsTelemetryServerAdapter}).
     *
     * Typically a data dictionary would be made available alongside the
     * telemetry data source itself.
     */
    function () {
        return {
            "name": "Mars Science Laboratory",
            "identifier": "msl",
            "instruments": [
                {
                    "name": "rems",
                    "identifier": "rems",
                    "measurements": [
                        {
                            "name": "Min. Air Temperature",
                            "identifier": "min_temp",
                            "units": "Degrees (C)",
                            "type": "float"
                        },
                        {
                            "name": "Max. Air Temperature",
                            "identifier": "max_temp",
                            "units": "Degrees (C)",
                            "type": "float"
                        },
                        {
                            "name": "Atmospheric Pressure",
                            "identifier": "pressure",
                            "units": "Millibars",
                            "type": "float"
                        },
                        {
                            "name": "Min. Ground Temperature",
                            "identifier": "min_gts_temp",
                            "units": "Degrees (C)",
                            "type": "float"
                        },
                        {
                            "name": "Max. Ground Temperature",
                            "identifier": "max_gts_temp",
                            "units": "Degrees (C)",
                            "type": "float"
                        }
                    ]
                }
            ]
        };
    }
);
