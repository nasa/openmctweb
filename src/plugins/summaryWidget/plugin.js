import { TypeKeyConstants } from "../constants/TypeKeyConstants";

define([
    './SummaryWidgetsCompositionPolicy',
    './src/telemetry/SummaryWidgetMetadataProvider',
    './src/telemetry/SummaryWidgetTelemetryProvider',
    './src/views/SummaryWidgetViewProvider',
    './SummaryWidgetViewPolicy'
], function (
    SummaryWidgetsCompositionPolicy,
    SummaryWidgetMetadataProvider,
    SummaryWidgetTelemetryProvider,
    SummaryWidgetViewProvider,
    SummaryWidgetViewPolicy
) {

    function plugin() {

        var widgetType = {
            name: 'Summary Widget',
            description: 'A compact status update for collections of telemetry-producing items',
            creatable: true,
            cssClass: 'icon-summary-widget',
            initialize: function (domainObject) {
                domainObject.composition = [];
                domainObject.configuration = {
                    ruleOrder: ['default'],
                    ruleConfigById: {
                        default: {
                            name: 'Default',
                            label: 'Unnamed Rule',
                            message: '',
                            id: 'default',
                            icon: ' ',
                            style: {
                                'color': '#ffffff',
                                'background-color': '#38761d',
                                'border-color': 'rgba(0,0,0,0)'
                            },
                            description: 'Default appearance for the widget',
                            conditions: [{
                                object: '',
                                key: '',
                                operation: '',
                                values: []
                            }],
                            jsCondition: '',
                            trigger: 'any',
                            expanded: 'true'
                        }
                    },
                    testDataConfig: [{
                        object: '',
                        key: '',
                        value: ''
                    }]
                };
                domainObject.openNewTab = 'thisTab';
                domainObject.telemetry = {};
            },
            form: [
                {
                    "key": "url",
                    "name": "URL",
                    "control": "textfield",
                    "required": false,
                    "cssClass": "l-input-lg"
                },
                {
                    "key": "openNewTab",
                    "name": "Tab to Open Hyperlink",
                    "control": "select",
                    "options": [
                        {
                            "value": "thisTab",
                            "name": "Open in this tab"
                        },
                        {
                            "value": "newTab",
                            "name": "Open in a new tab"
                        }
                    ],
                    "cssClass": "l-inline"
                }
            ]
        };

        return function install(openmct) {
            openmct.types.addType(TypeKeyConstants.SUMMARY_WIDGET, widgetType);
            openmct.legacyExtension('policies', {category: 'composition',
                implementation: SummaryWidgetsCompositionPolicy, depends: ['openmct']
            });
            openmct.legacyExtension('policies', {
                category: 'view',
                implementation: SummaryWidgetViewPolicy,
                depends: ['openmct']
            });
            openmct.telemetry.addProvider(new SummaryWidgetMetadataProvider(openmct));
            openmct.telemetry.addProvider(new SummaryWidgetTelemetryProvider(openmct));
            openmct.objectViews.addProvider(new SummaryWidgetViewProvider(openmct));
        };
    }

    return plugin;
});
