/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2021, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
import DefaultClock from '../../utils/clock/DefaultClock';

/**
 * A {@link openmct.TimeAPI.Clock} that updates the temporal bounds of the
 * application based on UTC time values provided by a ticking local clock,
 * with the periodicity specified.
 * @param {number} period The periodicity with which the clock should tick
 * @constructor
 */

export default class RemoteClock extends DefaultClock {
    constructor(openmct, identifier) {
        super();

        this.key = 'remote-clock';

        this.openmct = openmct;
        this.identifier = identifier;

        this.name = 'Remote Clock';
        this.description = "Provides telemetry based timestamps from a configurable source.";

        this.remoteTelemetryObject = undefined;
        this.parseTime = undefined;
        this.metadata = undefined;

        this.lastTick = 0;

        this._processDatum = this._processDatum.bind(this);
    }

    start() {
        this.openmct.time.on('timeSystem', this._timeSystemChange);
        this.openmct.objects.get(this.identifier).then((domainObject) => {
            this.remoteTelemetryObject = domainObject;
            this.metadata = this.openmct.telemetry.getMetadata(domainObject);
            this._timeSystemChange();
            this._requestLatest();
            this._subscribe();
        }).catch((error) => {
            throw new Error(error);
        });
    }

    stop() {
        this.openmct.time.on('timeSystem', this._timeSystemChange);
        if (this._unsubscribe) {
            this._unsubscribe();
        }

        this.removeAllListeners();
    }

    _subscribe() {
        this._unsubscribe = this.openmct.telemetry.subscribe(
            this.remoteTelemetryObject,
            this._processDatum
        );
    }

    _requestLatest() {
        this.openmct.telemetry.request(this.remoteTelemetryObject, {
            size: 1,
            strategy: 'latest'
        }).then(data => {
            this._processDatum(data[data.length - 1]);
        });
    }

    _processDatum(datum) {
        let time = this.parseTime(datum);

        if (time > this.lastTick) {
            this.tick(time);
        }
    }

    _timeSystemChange() {
        let timeSystem = this.openmct.time.timeSystem();
        let timeKey = timeSystem.key;
        let metadataValue = this.metadata.value(timeKey);
        let timeFormatter = this.openmct.telemetry.getValueFormatter(metadataValue);
        this.parseTime = (datum) => {
            return timeFormatter.parse(datum);
        };
    }
}
