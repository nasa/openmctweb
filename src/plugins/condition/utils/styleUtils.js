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
import isEmpty from 'lodash/isEmpty';

const NONE_VALUE = '__no_value';

const styleProps = {
    backgroundColor: {
        svgProperty: 'fill',
        noneValue: NONE_VALUE,
        applicableForType: type => {
            return !type ? true : (type === 'text-view'
                                      || type === 'telemetry-view'
                                      || type === 'box-view'
                                      || type === 'subobject-view');
        }
    },
    border: {
        svgProperty: 'stroke',
        noneValue: NONE_VALUE,
        applicableForType: type => {
            return !type ? true : (type === 'text-view'
                                            || type === 'telemetry-view'
                                            || type === 'box-view'
                                            || type === 'image-view'
                                            || type === 'line-view'
                                            || type === 'subobject-view');
        }
    },
    color: {
        svgProperty: 'color',
        noneValue: NONE_VALUE,
        applicableForType: type => {
            return !type ? true : (type === 'text-view'
                                    || type === 'telemetry-view'
                                    || type === 'subobject-view');
        }
    },
    imageUrl: {
        svgProperty: 'url',
        noneValue: '',
        applicableForType: type => {
            return !type ? false : type === 'image-view';
        }
    }
};

function aggregateStyleValues(accumulator, currentStyle) {
    const styleKeys = Object.keys(currentStyle);
    const properties = Object.keys(styleProps);
    properties.forEach((property) => {
        if (!accumulator[property]) {
            accumulator[property] = [];
        }

        const found = styleKeys.find(key => key === property);
        if (found) {
            accumulator[property].push(currentStyle[found]);
        }
    });

    return accumulator;
}

function getStaticStyleForItem(domainObject, id) {
    let domainObjectStyles = domainObject && domainObject.configuration && domainObject.configuration.objectStyles;
    if (domainObjectStyles) {
        if (id) {
            if (domainObjectStyles[id] && domainObjectStyles[id].staticStyle) {
                return domainObjectStyles[id].staticStyle.style;
            }
        } else if (domainObjectStyles.staticStyle) {
            return domainObjectStyles.staticStyle.style;
        }
    }
}

// Returns a union of styles used by multiple items.
// Styles that are common to all items but don't have the same value are added to the mixedStyles list
export function getConsolidatedStyleValues(multipleItemStyles) {
    let aggregatedStyleValues = multipleItemStyles.reduce(aggregateStyleValues, {});

    let styleValues = {};
    let mixedStyles = [];
    const properties = Object.keys(styleProps);
    properties.forEach((property) => {
        const values = aggregatedStyleValues[property];
        if (values && values.length) {
            if (values.every(value => value === values[0])) {
                styleValues[property] = values[0];
            } else {
                styleValues[property] = '';
                mixedStyles.push(property);
            }
        }
    });

    return {
        styles: styleValues,
        mixedStyles
    };
}

export function getConditionalStyleForItem(domainObject, id) {
    let domainObjectStyles = domainObject && domainObject.configuration && domainObject.configuration.objectStyles;
    if (domainObjectStyles) {
        if (id) {
            if (domainObjectStyles[id] && domainObjectStyles[id].conditionSetIdentifier) {
                return domainObjectStyles[id].styles;
            }
        } else if (domainObjectStyles.conditionSetIdentifier) {
            return domainObjectStyles.styles;
        }
    }
}

export function getConditionSetIdentifierForItem(domainObject, id) {
    let domainObjectStyles = domainObject && domainObject.configuration && domainObject.configuration.objectStyles;
    if (domainObjectStyles) {
        if (id) {
            if (domainObjectStyles[id] && domainObjectStyles[id].conditionSetIdentifier) {
                return domainObjectStyles[id].conditionSetIdentifier;
            }
        } else if (domainObjectStyles.conditionSetIdentifier) {
            return domainObjectStyles.conditionSetIdentifier;
        }
    }
}

//Returns either existing static styles or uses SVG defaults if available
export function getApplicableStylesForItem(domainObject, item) {
    const type = item && item.type;
    const id = item && item.id;
    let style = {};

    let staticStyle = getStaticStyleForItem(domainObject, id);

    const properties = Object.keys(styleProps);
    properties.forEach(property => {
        const styleProp = styleProps[property];
        if (styleProp.applicableForType(type)) {
            let defaultValue;
            if (staticStyle) {
                defaultValue = staticStyle[property];
            } else if (item) {
                defaultValue = item[styleProp.svgProperty];
            }

            style[property] = defaultValue === undefined ? styleProp.noneValue : defaultValue;
        }
    });

    return style;
}

export function getStylesWithoutNoneValue(style) {
    if (isEmpty(style) || !style) {
        return;
    }

    let styleObj = {};
    const keys = Object.keys(style);
    keys.forEach(key => {
        if ((typeof style[key] === 'string')) {
            if (style[key].indexOf('__no_value') > -1) {
                style[key] = '';
            } else {
                styleObj[key] = style[key];
            }
        }
    });

    return styleObj;
}
