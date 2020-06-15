
define([], function () {

    /**
     * Converts a domain object's identifier to an object.
     *
     * @param {string} identifier - The identifier to convert.  The namespace and key
     * need to be separated by a colon (eg. 'my.namespace:my.key').
     * @returns {Object} identifier
     */
    function deserializeIdentifier(identifier) {
        var tokens = identifier.split(':');
        return {
            namespace: tokens[0],
            key: tokens[1]
        };
    }

    /**
     * Parses an element's attribute as a float.  If it's not a number, it will return
     * the attribute value as is.
     *
     * @param {Element} element - The element to parse.
     * @param {string} attribute - The name of the attribute to parse.
     * @returns {(number|string)} The parsed attribute as a floating point number or a string.
     */
    function parseTelemetryAsFloatOrString(element, attribute) {
        return isNaN(parseFloat(element.getAttribute(attribute))) ? element.getAttribute(attribute) : parseFloat(element.getAttribute(attribute));
    }

    /**
     * Parses an element's attribute as an integer.  If it's not a number, it will return
     * the attribute value as is.
     *
     * @param {Element} element - The element to parse.
     * @param {string} attribute - The name of the attribute to parse.
     * @returns {(number|string)} The parsed attribute as an integer or a string.
     */
    function parseTelemetryAsIntegerOrString(element, attribute) {
        return isNaN(parseInt(element.getAttribute(attribute))) ? element.getAttribute(attribute) : parseInt(element.getAttribute(attribute), 10);
    }

    /**
     * Converts a domain object's identifier to a string, separating the namespace and
     * key with a colon.
     *
     * @param {Object} identifier - The identifier to convert.
     * @returns {string} The identifier as a string (eg. 'my.namespace:my.key').
     */
    function serializeIdentifier(identifier) {
        return identifier.namespace + ':' + identifier.key;
    }

    return {
        deserializeIdentifier: deserializeIdentifier,
        parseTelemetryAsFloatOrString: parseTelemetryAsFloatOrString,
        parseTelemetryAsIntegerOrString: parseTelemetryAsIntegerOrString,
        serializeIdentifier: serializeIdentifier
    };
});
