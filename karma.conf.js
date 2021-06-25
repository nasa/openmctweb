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

/*global module,process*/

const devMode = process.env.NODE_ENV !== 'production';
const browsers = [process.env.NODE_ENV === 'debug' ? 'ChromeDebugging' : 'FirefoxHeadless'];
const coverageEnabled = process.env.COVERAGE === 'true';
const reporters = ['progress', 'html'];

if (coverageEnabled) {
    reporters.push('coverage-istanbul');
}

module.exports = (config) => {
    const webpackConfig = require('./webpack.config.js');
    delete webpackConfig.output;

    if (!devMode || coverageEnabled) {
        webpackConfig.module.rules.push({
            test: /\.js$/,
            exclude: /node_modules|example|lib|dist/,
            use: {
                loader: 'istanbul-instrumenter-loader',
                options: {
                    esModules: true
                }
            }
        });
    }

    config.set({
        basePath: '',
        frameworks: ['jasmine'],
        files: [
            'indexTest.js'
        ],
        port: 9876,
        reporters: reporters,
        browsers: browsers,
        client: {
            jasmine: {
                random: false
            }
        },
        customLaunchers: {
            ChromeDebugging: {
                base: 'Chrome',
                flags: ['--remote-debugging-port=9222'],
                debug: true
            }
        },
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        // HTML test reporting.
        htmlReporter: {
            outputDir: "dist/reports/tests",
            preserveDescribeNesting: true,
            foldAll: false
        },
        coverageIstanbulReporter: {
            fixWebpackSourcePaths: true,
            dir: process.env.CIRCLE_ARTIFACTS ?
                process.env.CIRCLE_ARTIFACTS + '/coverage' :
                "dist/reports/coverage",
            reports: ['html', 'lcovonly', 'text-summary'],
            thresholds: {
                global: {
                    lines: 66
                }
            }
        },
        preprocessors: {
            'indexTest.js': ['webpack', 'sourcemap']
        },
        webpack: webpackConfig,
        webpackMiddleware: {
            stats: 'errors-only',
            logLevel: 'warn'
        },
        concurrency: 1,
        singleRun: true,
        browserNoActivityTimeout: 400000
    });
};
