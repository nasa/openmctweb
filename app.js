/*global require,process,console*/

/**
 * Usage:
 *
 * npm install minimist express
 * node app.js [options]
 */

(function init() {
    'use strict';

    var BUNDLE_FILE = 'bundles.json',
        options = require('minimist')(process.argv.slice(2)),
        express = require('express'),
        app = express(),
        fs = require('fs'),
        request = require('request');

    // Defaults
    options.port = options.port || options.p || 8080;
    options.host = options.host || options.h || 'localhost'
    options.directory = options.directory || options.D || '.';
    ['include', 'exclude', 'i', 'x'].forEach(function ensureEachElementAsArray(opt) {
        options[opt] = options[opt] || [];
        // Make sure includes/excludes always end up as arrays
        options[opt] = Array.isArray(options[opt]) ?
                options[opt] : [options[opt]];
    });

    options.include = options.include.concat(options.i);
    options.exclude = options.exclude.concat(options.x);

    // Show command line options
    if (options.help || options.h) {
        console.log('\nUsage: node app.js [options]\n');
        console.log('Options:');
        console.log('  --help, -h               Show this message.');
        console.log('  --port, -p <number>      Specify port.');
        console.log('  --include, -i <bundle>   Include the specified bundle.');
        console.log('  --exclude, -x <bundle>   Exclude the specified bundle.');
        console.log('  --directory, -D <bundle>   Serve files from specified directory.');
        console.log('');
        process.exit(0);
    }

    app.disable('x-powered-by');

    // Override bundles.json for HTTP requests
    app.use('/' + BUNDLE_FILE, function defaultLayer(req, res) {
        var bundles;

        try {
            bundles = JSON.parse(fs.readFileSync(BUNDLE_FILE, 'utf8'));
        } catch (e) {
            bundles = [];
        }

        // Handle command line inclusions/exclusions
        bundles = bundles.concat(options.include);
        bundles = bundles.filter(function bundleRetrieverFromExclude(bundle) {
            return options.exclude.indexOf(bundle) === -1;
        });
        bundles = bundles.filter(function uniqueBundle(bundle, index) { // Uniquify
            return bundles.indexOf(bundle) === index;
        });

        res.send(JSON.stringify(bundles));
    });

    app.use('/proxyUrl', function proxyRequest(req, res, next) {
        console.log('Proxying request to: ', req.query.url);
        req.pipe(request({
            url: req.query.url,
            strictSSL: false
        })
        .on('error', next))
        .pipe(res);
    });

    // Expose everything else as static files
    app.use(express['static'](options.directory));

    // Finally, open the HTTP server and log the instance to the console
    app.listen(options.port, options.host, function requestListener() {
        console.log('Open MCT application running at %s:%s', options.host, options.port)
    });
}());
