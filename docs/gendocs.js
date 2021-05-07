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

/*global require,process,__dirname,GLOBAL*/
/*jslint nomen: false */


// Usage:
//   node gendocs.js --in <source directory> --out <dest directory>

var CONSTANTS = {
        DIAGRAM_WIDTH: 800,
        DIAGRAM_HEIGHT: 500
    },
    TOC_HEAD = "# Table of Contents";

GLOBAL.window = GLOBAL.window ||  GLOBAL; // nomnoml expects window to be defined
(function () {
    "use strict";

    var fs = require("fs"),
        mkdirp = require("mkdirp"),
        path = require("path"),
        glob = require("glob"),
        marked = require("marked"),
        split = require("split"),
        stream = require("stream"),
        nomnoml = require('nomnoml'),
        toc = require("markdown-toc"),
        Canvas = require('canvas'),
        header = fs.readFileSync(path.resolve(__dirname, 'header.html')),
        footer = fs.readFileSync(path.resolve(__dirname, 'footer.html')),
        options = require("minimist")(process.argv.slice(2));

    // Convert from nomnoml source to a target PNG file.
    function renderNomnoml(source, target) {
        var canvas =
            new Canvas(CONSTANTS.DIAGRAM_WIDTH, CONSTANTS.DIAGRAM_HEIGHT);
        nomnoml.draw(canvas, source, 1.0);
        canvas.pngStream().pipe(fs.createWriteStream(target));
    }

    // Stream transform.
    // Pulls out nomnoml diagrams from fenced code blocks and renders them
    // as PNG files in the output directory, prefixed with a provided name.
    // The fenced code blocks will be replaced with Markdown in the
    // output of this stream.
    function nomnomlifier(outputDirectory, prefix) {
        var transform = new stream.Transform({ objectMode: true }),
            isBuilding = false,
            counter = 1,
            outputPath,
            source = "";

        transform._transform = function (chunk, encoding, done) {
            if (!isBuilding) {
                if (chunk.trim().indexOf("```nomnoml") === 0) {
                    var outputFilename = prefix + '-' + counter + '.png';
                    outputPath = path.join(outputDirectory, outputFilename);
                    this.push([
                        "\n![Diagram ",
                        counter,
                        "](",
                        outputFilename,
                        ")\n\n"
                    ].join(""));
                    isBuilding = true;
                    source = "";
                    counter += 1;
                } else {
                    // Otherwise, pass through
                    this.push(chunk + '\n');
                }
            } else {
                if (chunk.trim() === "```") {
                    // End nomnoml
                    renderNomnoml(source, outputPath);
                    isBuilding = false;
                } else {
                    source += chunk + '\n';
                }
            }
            done();
        };

        return transform;
    }

    // Convert from Github-flavored Markdown to HTML
    function gfmifier(renderTOC) {
        var transform = new stream.Transform({ objectMode: true }),
            markdown = "";
        transform._transform = function (chunk, encoding, done) {
            markdown += chunk;
            done();
        };
        transform._flush = function (done) {
            if (renderTOC){
                // Prepend table of contents
                markdown =
                    [ TOC_HEAD, toc(markdown).content, "", markdown ].join("\n");
            }
            this.push(header);
            this.push(marked(markdown));
            this.push(footer);
            done();
        };
        return transform;
    }

    // Custom renderer for marked; converts relative links from md to html,
    // and makes headings linkable.
    function CustomRenderer() {
        var renderer = new marked.Renderer(),
            customRenderer = Object.create(renderer);
        customRenderer.heading = function (text, level) {
            var escapedText = (text || "").trim().toLowerCase().replace(/\W/g, "-"),
                aOpen = "<a name=\"" + escapedText + "\" href=\"#" + escapedText + "\">",
                aClose = "</a>";
            return aOpen + renderer.heading.apply(renderer, arguments) + aClose;
        };
        // Change links to .md files to .html
        customRenderer.link = function (href, title, text) {
            // ...but only if they look like relative paths
            return (href || "").indexOf(":") === -1 && href[0] !== "/" ?
                    renderer.link(href.replace(/\.md/, ".html"), title, text) :
                    renderer.link.apply(renderer, arguments);
        };
        return customRenderer;
    }

    options['in'] = options['in'] || options.i;
    options.out = options.out || options.o;

    marked.setOptions({
        renderer: new CustomRenderer(),
        gfm: true,
        tables: true,
        breaks: false,
        pedantic: false,
        sanitize: true,
        smartLists: true,
        smartypants: false
    });

    // Convert all markdown files.
    // First, pull out nomnoml diagrams.
    // Then, convert remaining Markdown to HTML.
    glob(options['in'] + "/**/*.md", {}, function (err, files) {
        files.forEach(function (file) {
            var destination = file.replace(options['in'], options.out)
                .replace(/md$/, "html"),
                destPath = path.dirname(destination),
                prefix = path.basename(destination).replace(/\.html$/, ""),
                //Determine whether TOC should be rendered for this file based
                //on regex provided as command line option
                renderTOC = file.match(options['suppress-toc'] || "") === null;

            mkdirp(destPath, function (err) {
                fs.createReadStream(file, { encoding: 'utf8' })
                    .pipe(split())
                    .pipe(nomnomlifier(destPath, prefix))
                    .pipe(gfmifier(renderTOC))
                    .pipe(fs.createWriteStream(destination, {
                        encoding: 'utf8'
                    }));
            });
        });
    });

    // Also copy over all HTML, CSS, or PNG files
    glob(options['in'] + "/**/*.@(html|css|png)", {}, function (err, files) {
        files.forEach(function (file) {
            var destination = file.replace(options['in'], options.out),
                destPath = path.dirname(destination),
                streamOptions = {};
            if (file.match(/png$/)) {
                streamOptions.encoding = null;
            } else {
                streamOptions.encoding = 'utf8';
            }

            mkdirp(destPath, function (err) {
                fs.createReadStream(file, streamOptions)
                    .pipe(fs.createWriteStream(destination, streamOptions));
            });
        });
    });

}());
