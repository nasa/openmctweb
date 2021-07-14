# Open MCT [![license](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](http://www.apache.org/licenses/LICENSE-2.0) [![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/nasa/openmct.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/nasa/openmct/context:javascript)

Open MCT (Open Mission Control Technologies) is a next-generation mission control framework for visualization of data on desktop and mobile devices. It is developed at NASA's Ames Research Center, and is being used by NASA for data analysis of spacecraft missions, as well as planning and operation of experimental rover systems. As a generalizable and open source framework, Open MCT could be used as the basis for building applications for planning, operation, and analysis of any systems producing telemetry data.

Please visit our [Official Site](https://nasa.github.io/openmct/) and [Getting Started Guide](https://nasa.github.io/openmct/getting-started/)

Once you've created something amazing with Open MCT, showcase your work in our GitHub Discussions [Show and Tell](https://github.com/nasa/openmct/discussions/categories/show-and-tell) section. We love seeing unique and wonderful implementations of Open MCT!

## See Open MCT in Action

Try Open MCT now with our [live demo](https://openmct-demo.herokuapp.com/).
![Demo](https://nasa.github.io/openmct/static/res/images/Open-MCT.Browse.Layout.Mars-Weather-1.jpg)

## Building and Running Open MCT Locally

Building and running Open MCT in your local dev environment is very easy. Be sure you have [Git](https://git-scm.com/downloads) and [Node.js](https://nodejs.org/) installed, then follow the directions below. Need additional information? Check out the [Getting Started](https://nasa.github.io/openmct/getting-started/) page on our website.
(These instructions assume you are installing as a non-root user; developers have [reported issues](https://github.com/nasa/openmct/issues/1151) running these steps with root privileges.)

1. Clone the source code

 `git clone https://github.com/nasa/openmct.git`

2. Install development dependencies

 `npm install`

3. Run a local development server

 `npm start`

Open MCT is now running, and can be accessed by pointing a web browser at [http://localhost:8080/](http://localhost:8080/)

## Building and Running Open MCT in Docker

Building and running Open MCT in your local dev environment is very easy. Be sure you have [Docker](https://www.docker.com/get-started) installed, then follow the directions below.

1. Build image

  `docker image build -t openmct:1.3.0 .`

2. Create container

  `docker container run -d --name openmct -p 8080:8080 openmct:1.3.0`

## Open MCT v1.0.0
This represents a major overhaul of Open MCT with significant changes under the hood. We aim to maintain backward compatibility but if you do find compatibility issues, please let us know by filing an issue in this repository. If you are having major issues with v1.0.0 please check-out the v0.14.0 tag until we can resolve them for you.

If you are migrating an application built with Open MCT as a dependency to v1.0.0 from an earlier version, please refer to [our migration guide](https://nasa.github.io/openmct/documentation/migration-guide).

## Documentation

Documentation is available on the [Open MCT website](https://nasa.github.io/openmct/documentation/).

### Examples

The clearest examples for developing Open MCT plugins are in the
[tutorials](https://github.com/nasa/openmct-tutorial) provided in
our documentation.

We want Open MCT to be as easy to use, install, run, and develop for as
possible, and your feedback will help us get there! Feedback can be provided via [GitHub issues](https://github.com/nasa/openmct/issues/new/choose), [Starting a GitHub Discussion](https://github.com/nasa/openmct/discussions), or by emailing us at [arc-dl-openmct@mail.nasa.gov](mailto:arc-dl-openmct@mail.nasa.gov).

## Building Applications With Open MCT

Open MCT is built using [`npm`](http://npmjs.com/) and [`webpack`](https://webpack.js.org/).

See our documentation for a guide on [building Applications with Open MCT](https://github.com/nasa/openmct/blob/master/API.md#starting-an-open-mct-application).

## Plugins

Open MCT can be extended via plugins that make calls to the Open MCT API. A plugin is a group 
of software components (including source code and resources such as images and HTML templates)
that is intended to be added or removed as a single unit.

As well as providing an extension mechanism, most of the core Open MCT codebase is also 
written as plugins.

For information on writing plugins, please see [our API documentation](https://github.com/nasa/openmct/blob/master/API.md#plugins).

## Tests

Tests are written for [Jasmine 3](https://jasmine.github.io/api/3.1/global)
and run by [Karma](http://karma-runner.github.io). To run:

`npm test`

The test suite is configured to load any scripts ending with `Spec.js` found
in the `src` hierarchy. Full configuration details are found in
`karma.conf.js`. By convention, unit test scripts should be located
alongside the units that they test; for example, `src/foo/Bar.js` would be
tested by `src/foo/BarSpec.js`. (For legacy reasons, some existing tests may
be located in separate `test` folders near the units they test, but the
naming convention is otherwise the same.)

### Test Reporting

When `npm test` is run, test results will be written as HTML to
`dist/reports/tests/`. Code coverage information is written to `dist/reports/coverage`.

# Glossary

Certain terms are used throughout Open MCT with consistent meanings
or conventions. Any deviations from the below are issues and should be
addressed (either by updating this glossary or changing code to reflect
correct usage.) Other developer documentation, particularly in-line
documentation, may presume an understanding of these terms.

* _plugin_: A plugin is a removable, reusable grouping of software elements.
  The application is composed of plugins.
* _composition_: In the context of a domain object, this refers to the set of
  other domain objects that compose or are contained by that object. A domain
  object's composition is the set of domain objects that should appear
  immediately beneath it in a tree hierarchy. A domain object's composition is
  described in its model as an array of id's; its composition capability
  provides a means to retrieve the actual domain object instances associated
  with these identifiers asynchronously.
* _description_: When used as an object property, this refers to the human-readable
  description of a thing; usually a single sentence or short paragraph.
  (Most often used in the context of extensions, domain
  object models, or other similar application-specific objects.)
* _domain object_: A meaningful object to the user; a distinct thing in
  the work support by Open MCT. Anything that appears in the left-hand
  tree is a domain object.
* _identifier_: A tuple consisting of a namespace and a key, which together uniquely
  identifies a domain object.
* _model_: The persistent state associated with a domain object. A domain
  object's model is a JavaScript object which can be converted to JSON
  without losing information (that is, it contains no methods.)
* _name_: When used as an object property, this refers to the human-readable
  name for a thing. (Most often used in the context of extensions, domain
  object models, or other similar application-specific objects.)
* _navigation_: Refers to the current state of the application with respect
  to the user's expressed interest in a specific domain object; e.g. when
  a user clicks on a domain object in the tree, they are _navigating_ to
  it, and it is thereafter considered the _navigated_ object (until the
  user makes another such choice.)
* _namespace_: A name used to identify a persistence store. A running open MCT 
application could potentially use multiple persistence stores, with the 
