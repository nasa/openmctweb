
define([
    './DsnUtils'
], function (
    DsnUtils
) {

    /**
     * Construct a new Deep Space Network parser.
     *
     * @memberof plugins/dsn
     * @param {object} config - The parsed configuration of the Deep Space Network.
     * @constructor
     */
    function DsnParser(config) {
        this.dsn = {
            data: config ? config : {}
        };
    }

    /**
     * Parses a sites tag contained in the Deep Space Network's configuration XML.
     *
     * @private
     * @param {Element} sitesElement - The sites to parse.
     * @returns {object} An object containing information about each site and its dishes.
     */
    DsnParser.prototype.parseSitesTag = function (sitesElement) {
        var dishElement,
            dishKey,
            siteElement,
            siteKey,
            sites = {};

        for (var i = 0; i < sitesElement.children.length; i++) {
            siteElement = sitesElement.children[i];
            siteKey = siteElement.getAttribute('name').toLowerCase();

            sites[siteKey + '.name'] = siteElement.getAttribute('name');
            sites[siteKey + '.friendly.name'] = siteElement.getAttribute('friendlyName');
            sites[siteKey + '.longitude'] = parseFloat(siteElement.getAttribute('longitude'));
            sites[siteKey + '.latitude'] = parseFloat(siteElement.getAttribute('latitude'));

            for (var j = 0; j < siteElement.children.length; j++) {
                dishElement = siteElement.children[j];
                dishKey = dishElement.getAttribute('name').toLowerCase();

                sites[dishKey + '.name'] = dishElement.getAttribute('name');
                sites[dishKey + '.friendly.name'] = dishElement.getAttribute('friendlyName');
                sites[dishKey + '.type'] = dishElement.getAttribute('type');
            }
        }

        return sites;
    };

    /**
     * Parses a spacecraftMap tag contained in the Deep Space Network's configuration XML.
     *
     * @private
     * @param {Element} spacecraftMapElement - The spacecraftMap to parse.
     * @returns {object} An object containing information about each spacecraft that is being tracked.
     */
    DsnParser.prototype.parseSpacecraftMapTag = function (spacecraftMapElement) {
        var key,
            spacecraftElement,
            spacecrafts = {};

        for (var i = 0; i < spacecraftMapElement.children.length; i++) {
            spacecraftElement = spacecraftMapElement.children[i];
            key = spacecraftElement.getAttribute('name').toLowerCase();

            spacecrafts[key + '.name'] = spacecraftElement.getAttribute('name');
            spacecrafts[key + '.explorer.name'] = spacecraftElement.getAttribute('explorerName');
            spacecrafts[key + '.friendly.name'] = spacecraftElement.getAttribute('friendlyName');
            spacecrafts[key + '.thumbnail'] = spacecraftElement.getAttribute('thumbnail') === 'true';
        }

        return spacecrafts;
    };

    /**
     * Parses the sites and spacecraftMap tags contained in the Deep Space Network's
     * configuration XML.
     *
     * @private
     * @param {Document} xmlDocument - The XML document representing the configuration of the
     * Deep Space Network.
     */
    DsnParser.prototype.parseDsnConfig = function (xmlDocument) {
        var configElements = xmlDocument.documentElement.children;

        for (var i = 0; i < configElements.length; i++) {
            var element = configElements[i];

            switch (element.tagName) {
            case 'sites':
                Object.assign(this.dsn.data, this.parseSitesTag(element));
                break;
            case 'spacecraftMap':
                Object.assign(this.dsn.data, this.parseSpacecraftMapTag(element));
            }
        }
    };

    /**
     * Parses a station tag contained in the Deep Space Network's XML.
     *
     * @private
     * @param {Element} stationElement - The station to parse.
     * @returns {object} An object containing the station's data.
     */
    DsnParser.prototype.parseStationTag = function (stationElement) {
        var key = stationElement.getAttribute('name').toLowerCase(),
            station = {};

        station[key + '.name'] = stationElement.getAttribute('name');
        station[key + '.friendly.name'] = stationElement.getAttribute('friendlyName');
        station[key + '.utc.time'] = parseInt(stationElement.getAttribute('timeUTC'), 10);
        station[key + '.time.zone.offset'] = parseInt(stationElement.getAttribute('timeZoneOffset'), 10);
        station[key + '.longitude'] = this.dsn.data[key + '.longitude'];
        station[key + '.latitude'] = this.dsn.data[key + '.latitude'];
        station[key + '.station'] = Object.assign({}, station);

        return station;
    };

    /**
     * Parses a dish tag contained in the Deep Space Network's XML.
     *
     * @private
     * @param {Element} dishElement - The dish to parse.
     * @returns {object} An object containing data about the dish's antenna, down signals,
     * up signals and targets.
     */
    DsnParser.prototype.parseDishTag = function (dishElement) {
        var children = dishElement.children,
            key,
            dish = {};

        key = dishElement.getAttribute('name').toLowerCase();

        dish[key + '.name'] = dishElement.getAttribute('name');
        dish[key + '.friendly.name'] = this.dsn.data[key + '.friendly.name'];
        dish[key + '.type'] = this.dsn.data[key + '.type'];
        dish[key + '.azimuth.angle'] = DsnUtils.parseTelemetryAsFloatOrString(dishElement, 'azimuthAngle');
        dish[key + '.elevation.angle'] = DsnUtils.parseTelemetryAsFloatOrString(dishElement, 'elevationAngle');
        dish[key + '.wind.speed'] = DsnUtils.parseTelemetryAsFloatOrString(dishElement, 'windSpeed');
        dish[key + '.mspa'] = dishElement.getAttribute('isMSPA') === 'true';
        dish[key + '.array'] = dishElement.getAttribute('isArray') === 'true';
        dish[key + '.ddor'] = dishElement.getAttribute('isDDOR') === 'true';
        dish[key + '.created'] = dishElement.getAttribute('created');
        dish[key + '.updated'] = dishElement.getAttribute('updated');
        dish[key + '.antenna'] = Object.assign({}, dish);
        dish[key + '.signals'] = [];
        dish[key + '.targets'] = [];

        for (var i = 0; i < children.length; i++) {
            var child = children[i];

            switch (child.tagName) {
            case 'downSignal':
            case 'upSignal':
                var signal = {},
                    spacecraftName = child.getAttribute('spacecraft').toLowerCase();

                signal[key + '.signal.direction'] = child.tagName.substring(0, child.tagName.length - 6);
                signal[key + '.signal.type'] = child.getAttribute('signalType');
                signal[key + '.signal.type.debug'] = child.getAttribute('signalTypeDebug');
                signal[key + '.signal.data.rate'] = DsnUtils.parseTelemetryAsFloatOrString(child, 'dataRate');
                signal[key + '.signal.frequency'] = DsnUtils.parseTelemetryAsFloatOrString(child, 'frequency');
                signal[key + '.signal.power'] = DsnUtils.parseTelemetryAsFloatOrString(child, 'power');
                signal[key + '.signal.spacecraft'] = child.getAttribute('spacecraft');
                signal[key + '.signal.spacecraft.id'] = DsnUtils.parseTelemetryAsIntegerOrString(child, 'spacecraftId');
                signal[key + '.signal.spacecraft.friendly.name'] = this.dsn.data[spacecraftName + '.friendly.name'];
                dish[key + '.signals'].push(signal);
                break;
            case 'target':
                var target = {},
                    targetName = child.getAttribute('name').toLowerCase();

                target[key + '.target.name'] = child.getAttribute('name');
                target[key + '.target.id'] = DsnUtils.parseTelemetryAsIntegerOrString(child, 'id');
                target[key + '.target.upleg.range'] = DsnUtils.parseTelemetryAsFloatOrString(child, 'uplegRange');
                target[key + '.target.downleg.range'] = DsnUtils.parseTelemetryAsFloatOrString(child, 'downlegRange');
                target[key + '.target.rtlt'] = DsnUtils.parseTelemetryAsFloatOrString(child, 'rtlt');
                target[key + '.target.friendly.name'] = targetName ? this.dsn.data[targetName + '.friendly.name'] : '';
                dish[key + '.targets'].push(target);
                break;
            }
        }

        return dish;
    };

    /**
     * Parses the timestamp tag contained in the Deep Space Network's XML.
     *
     * @private
     * @param {Element} timestampElement - The timestamp to parse.
     * @returns {integer} The time in milliseconds since the UNIX epoch.
     */
    DsnParser.prototype.parseTimestampTag = function (timestampElement) {
        return parseInt(timestampElement.textContent, 10);
    };

    /**
     * Parses the station, dish and timestamp tags contained in the Deep Space Network's XML.
     *
     * @private
     * @param {Document} xmlDocument - The XML document representing the Deep Space Network's data.
     */
    DsnParser.prototype.parseDsnData = function (xmlDocument) {
        var dsnElements = xmlDocument.documentElement.children;

        for (var i = 0; i < dsnElements.length; i++) {
            var element = dsnElements[i];

            switch (element.tagName) {
            case 'station':
                Object.assign(this.dsn.data, this.parseStationTag(element));
                break;
            case 'dish':
                Object.assign(this.dsn.data, this.parseDishTag(element));
                break;
            case 'timestamp':
                this.dsn.data.timestamp = this.parseTimestampTag(element);
            }
        }
    };

    /**
     * @typedef DsnData
     * @type {object}
     * @property {object} config - An object containing properties that match the values of domain
     * object identifier keys and their corresponding telemetry values.
     * @property {object} data - An object containing properties that match the values of domain
     * object identifier keys and their corresponding telemetry values.
     * @property {integer} timestamp - The time in milliseconds since the UNIX epoch.
     */

    /**
     * Parses the Deep Space Network's configuration or data.
     *
     * @param {Document} xmlDocument - The XML document representing the Deep Space Network's
     * configuration or data.
     * @returns {DsnData} The parsed XML as an object with configuration data and properties that
     * match the values of domain object identifier keys.
     */
    DsnParser.prototype.parseXml = function (xmlDocument) {
        if (xmlDocument.documentElement.tagName === 'config') {
            this.parseDsnConfig(xmlDocument);
        } else {
            this.parseDsnData(xmlDocument);
        }

        return this.dsn;
    };

    return DsnParser;
});
