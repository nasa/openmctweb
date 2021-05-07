define([
    "./src/ExampleStyleGuideModelProvider",
    "./src/MCTExample",
    "./res/templates/intro.html",
    "./res/templates/standards.html",
    "./res/templates/colors.html",
    "./res/templates/status.html",
    "./res/templates/glyphs.html",
    "./res/templates/controls.html",
    "./res/templates/input.html",
    "./res/templates/menus.html"
], function (
    ExampleStyleGuideModelProvider,
    MCTExample,
    introTemplate,
    standardsTemplate,
    colorsTemplate,
    statusTemplate,
    glyphsTemplate,
    controlsTemplate,
    inputTemplate,
    menusTemplate
) {
    return {
        name: "example/styleguide",
        definition: {
            "name": "Open MCT Style Guide",
            "description": "Examples and documentation illustrating UI styles in use in Open MCT.",
            "extensions":
        {
            "types": [
                {
                    "key": "styleguide.intro",
                    "name": "Introduction",
                    "cssClass": "icon-page",
                    "description": "Introduction and overview to the style guide"
                },
                {
                    "key": "styleguide.standards",
                    "name": "Standards",
                    "cssClass": "icon-page",
                    "description": ""
                },
                {
                    "key": "styleguide.colors",
                    "name": "Colors",
                    "cssClass": "icon-page",
                    "description": ""
                },
                {
                    "key": "styleguide.status",
                    "name": "status",
                    "cssClass": "icon-page",
                    "description": "Limits, telemetry paused, etc."
                },
                {
                    "key": "styleguide.glyphs",
                    "name": "Glyphs",
                    "cssClass": "icon-page",
                    "description": "Glyphs overview"
                },
                {
                    "key": "styleguide.controls",
                    "name": "Controls",
                    "cssClass": "icon-page",
                    "description": "Buttons, selects, HTML controls"
                },
                {
                    "key": "styleguide.input",
                    "name": "Text Inputs",
                    "cssClass": "icon-page",
                    "description": "Various text inputs"
                },
                {
                    "key": "styleguide.menus",
                    "name": "Menus",
                    "cssClass": "icon-page",
                    "description": "Context menus, dropdowns"
                }
            ],
            "views": [
                {
                    "key": "styleguide.intro",
                    "type": "styleguide.intro",
                    "template": introTemplate,
                    "editable": false
                },
                {
                    "key": "styleguide.standards",
                    "type": "styleguide.standards",
                    "template": standardsTemplate,
                    "editable": false
                },
                {
                    "key": "styleguide.colors",
                    "type": "styleguide.colors",
                    "template": colorsTemplate,
                    "editable": false
                },
                {
                    "key": "styleguide.status",
                    "type": "styleguide.status",
                    "template": statusTemplate,
                    "editable": false
                },
                {
                    "key": "styleguide.glyphs",
                    "type": "styleguide.glyphs",
                    "template": glyphsTemplate,
                    "editable": false
                },
                {
                    "key": "styleguide.controls",
                    "type": "styleguide.controls",
                    "template": controlsTemplate,
                    "editable": false
                },
                {
                    "key": "styleguide.input",
                    "type": "styleguide.input",
                    "template": inputTemplate,
                    "editable": false
                },
                {
                    "key": "styleguide.menus",
                    "type": "styleguide.menus",
                    "template": menusTemplate,
                    "editable": false
                }
            ],
            "roots": [
                {
                    "id": "styleguide:home"
                }
            ],
            "models": [
                {
                    "id": "styleguide:home",
                    "priority": "preferred",
                    "model": {
                        "type": "noneditable.folder",
                        "name": "Style Guide Home",
                        "location": "ROOT",
                        "composition": [
                            "intro",
                            "standards",
                            "colors",
                            "status",
                            "glyphs",
                            "styleguide:ui-elements"
                        ]
                    }
                },
                {
                    "id": "styleguide:ui-elements",
                    "priority": "preferred",
                    "model": {
                        "type": "noneditable.folder",
                        "name": "UI Elements",
                        "location": "styleguide:home",
                        "composition": [
                            "controls",
                            "input",
                            "menus"
                        ]
                    }
                }
            ],
            "directives": [
                {
                    "key": "mctExample",
                    "implementation": MCTExample
                }
            ],
            "components": [
                {
                    "provides": "modelService",
                    "type": "provider",
                    "implementation": ExampleStyleGuideModelProvider,
                    "depends": [
                        "$q"
                    ]
                }
            ]
        }
        }
    };
});
