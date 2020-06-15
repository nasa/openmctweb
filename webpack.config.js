const path = require('path');
const packageDefinition = require('./package.json');

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

const devMode = process.env.NODE_ENV !== 'production';
const VueLoaderPlugin = require('vue-loader/lib/plugin');
// TODO: Build Constants w/ git-rev-sync
const gitRevision = require('child_process')
    .execSync('git rev-parse HEAD')
    .toString().trim();
const gitBranch = require('child_process')
    .execSync('git rev-parse --abbrev-ref HEAD')
    .toString().trim();

const webpackConfig = {
    mode: devMode ? 'development' : 'production',
    entry: {
        openmct: './openmct.js',
        espressoTheme: './src/plugins/themes/espresso-theme.scss',
        snowTheme: './src/plugins/themes/snow-theme.scss',
        maelstromTheme: './src/plugins/themes/maelstrom-theme.scss'
    },
    output: {
        filename: '[name].js',
        library: '[name]',
        libraryTarget: 'umd',
        path: path.resolve(__dirname, 'dist')
    },
    resolve: {
        alias: {
            "@": path.join(__dirname, "src"),
            "legacyRegistry": path.join(__dirname, "src/legacyRegistry"),
            "saveAs": "file-saver",
            "csv": "comma-separated-values",
            "EventEmitter": "eventemitter3",
            "bourbon": "bourbon.scss",
            "vue": path.join(__dirname, "node_modules/vue/dist/vue.js"),
            "d3-scale": path.join(__dirname, "node_modules/d3-scale/build/d3-scale.min.js"),
            "printj": path.join(__dirname, "node_modules/printj/dist/printj.min.js"),
            "styles": path.join(__dirname, "src/styles"),
            "MCT": path.join(__dirname, "src/MCT"),
            "testUtils": path.join(__dirname, "src/testUtils.js"),
            "objectUtils": path.join(__dirname, "src/api/objects/object-utils.js")
        }
    },
    devtool: devMode ? 'eval-source-map' : 'source-map',
    plugins: [
        new webpack.DefinePlugin({
            __OPENMCT_VERSION__: `'${packageDefinition.version}'`,
            __OPENMCT_BUILD_DATE__: `'${new Date()}'`,
            __OPENMCT_REVISION__: `'${gitRevision}'`,
            __OPENMCT_BUILD_BRANCH__: `'${gitBranch}'`,
            __OPENMCT_ROOT_RELATIVE__: `'${devMode ? 'dist/' : ''}'`
        }),
        new VueLoaderPlugin(),
        new MiniCssExtractPlugin({
            filename: '[name].css',
            chunkFilename: '[name].css'
        }),
        new CopyWebpackPlugin([
            {
                from: 'src/images/favicons',
                to: 'favicons'
            },
            {
                from: './index.html',
                transform: function (content) {
                    return content.toString().replace(/dist\//g, '');
                }
            }
        ])
    ],
    module: {
        rules: [
            {
                test: /\.(sc|sa|c)ss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'fast-sass-loader'
                ]
            },
            {
                test: /\.html$/,
                use: 'html-loader'
            },
            {
                test: /zepto/,
                use: [
                    "imports-loader?this=>window",
                    "exports-loader?Zepto"
                ]
            },
            {
                test: /\.(jpg|jpeg|png|svg|ico|woff2?|eot|ttf)$/,
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]',
                    outputPath(url, resourcePath, context) {
                        if (/\.(jpg|jpeg|png|svg)$/.test(url)) {
                            return `images/${url}`
                        }
                        if (/\.ico$/.test(url)) {
                            return `icons/${url}`
                        }
                        if (/\.(woff2?|eot|ttf)$/.test(url)) {
                            return `fonts/${url}`
                        } else {
                            return `${url}`;
                        }
                    }
                }
            },
            {
                test: /\.vue$/,
                use: 'vue-loader'
            },
            {
                test: /\.xml$/,
                use: 'raw-loader'
            }
        ]
    },
    stats: {
        modules: false,
        timings: true,
        colors: true,
        warningsFilter: /asset size limit/g
    }
};

module.exports = webpackConfig;
