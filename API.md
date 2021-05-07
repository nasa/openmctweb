<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents** 

- [Building Applications With Open MCT](#building-applications-with-open-mct)
  - [Scope and purpose of this document](#scope-and-purpose-of-this-document)
  - [Building From Source](#building-from-source)
  - [Starting an Open MCT application](#starting-an-open-mct-application)
  - [Plugins](#plugins)
    - [Defining and Installing a New Plugin](#defining-and-installing-a-new-plugin)
  - [Domain Objects and Identifiers](#domain-objects-and-identifiers)
    - [Object Attributes](#object-attributes)
    - [Domain Object Types](#domain-object-types)
  - [Root Objects](#root-objects)
  - [Object Providers](#object-providers)
  - [Composition Providers](#composition-providers)
    - [Adding Composition Providers](#adding-composition-providers)
    - [Default Composition Provider](#default-composition-provider)
  - [Telemetry API](#telemetry-api)
    - [Integrating Telemetry Sources](#integrating-telemetry-sources)
      - [Telemetry Metadata](#telemetry-metadata)
        - [Values](#values)
          - [Value Hints](#value-hints)
        - [The Time Conductor and Telemetry](#the-time-conductor-and-telemetry)
      - [Telemetry Providers](#telemetry-providers)
      - [Telemetry Requests and Responses.](#telemetry-requests-and-responses)
      - [Request Strategies **draft**](#request-strategies-draft)
        - [`latest` request strategy](#latest-request-strategy)
        - [`minmax` request strategy](#minmax-request-strategy)
      - [Telemetry Formats **draft**](#telemetry-formats-draft)
        - [Registering Formats](#registering-formats)
      - [Telemetry Data](#telemetry-data)
        - [Telemetry Datums](#telemetry-datums)
      - [Limit Evaluators **draft**](#limit-evaluators-draft)
    - [Telemetry Consumer APIs **draft**](#telemetry-consumer-apis-draft)
  - [Time API](#time-api)
    - [Time Systems and Bounds](#time-systems-and-bounds)
      - [Defining and Registering Time Systems](#defining-and-registering-time-systems)
      - [Getting and Setting the Active Time System](#getting-and-setting-the-active-time-system)
      - [Time Bounds](#time-bounds)
    - [Clocks](#clocks)
      - [Defining and registering clocks](#defining-and-registering-clocks)
      - [Getting and setting active clock](#getting-and-setting-active-clock)
      - [Stopping an active clock](#stopping-an-active-clock)
      - [Clock Offsets](#clock-offsets)
    - [Time Events](#time-events)
      - [List of Time Events](#list-of-time-events)
    - [The Time Conductor](#the-time-conductor)
      - [Time Conductor Configuration](#time-conductor-configuration)
      - [Example conductor configuration](#example-conductor-configuration)
  - [Indicators](#indicators)
    - [The URL Status Indicator](#the-url-status-indicator)
    - [Creating a Simple Indicator](#creating-a-simple-indicator)
    - [Custom Indicators](#custom-indicators)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Building Applications With Open MCT

## Scope and purpose of this document

This document is intended to serve as a reference for developing an application 
based on Open MCT. It will provide details of the API functions necessary to 
extend the Open MCT platform meet common use cases such as integrating with a telemetry source. 

The best place to start is with the [Open MCT Tutorials](https://github.com/nasa/openmct-tutorial). 
These will walk you through the process of getting up and running with Open 
MCT, as well as addressing some common developer use cases.

## Building From Source 

The latest version of Open MCT is available from [our GitHub repository](https://github.com/nasa/openmct). 
If you have `git`, and `node` installed, you can build Open MCT with the
commands 

```bash
git clone https://github.com/nasa/openmct.git
cd openmct
npm install
```

These commands will fetch the Open MCT source from our GitHub repository, and 
build a minified version that can be included in your application. The output 
of the build process is placed in a `dist` folder under the openmct source 
directory, which can be copied out to another location as needed. The contents 
of this folder will include a minified javascript file named `openmct.js` as 
well as assets such as html, css, and images necessary for the UI. 

## Starting an Open MCT application

To start a minimally functional Open MCT application, it is necessary to 
include the Open MCT distributable, enable some basic plugins, and bootstrap 
the application. The tutorials walk through the process of getting Open MCT up 
and running from scratch, but provided below is a minimal HTML template that 
includes Open MCT, installs some basic plugins, and bootstraps the application. 
It assumes that Open MCT is installed under an `openmct` subdirectory, as 
described in [Building From Source](#building-from-source). 

This approach includes openmct using a simple script tag, resulting in a global 
variable named `openmct`. This `openmct` object is used subsequently to make 
API calls. 

Open MCT is packaged as a UMD (Universal Module Definition) module, so common 
script loaders are also supported.

```html
<!DOCTYPE html>
<html>
<head>
    <title>Open MCT</title>
    <script src="dist/openmct.js"></script>
</head>
<body>
    <script>
        openmct.install(openmct.plugins.LocalStorage());
        openmct.install(openmct.plugins.MyItems());
        openmct.install(openmct.plugins.UTCTimeSystem());
        openmct.start();
    </script>
</body>
</html>
```

The Open MCT library included above requires certain assets such as html 
templates, images, and css. If you installed Open MCT from GitHub as described 
in the section on [Building from Source](#building-from-source) then these
assets will have been downloaded along with the Open MCT javascript library. 

There are some plugins bundled with the application that provide UI, 
persistence, and other default configuration which are necessary to be able to 
do anything with the application initially. Any of these plugins can, in 
principle, be replaced with a custom plugin. The included plugins are 
documented in the [Included Plugins](#included-plugins) section.  

## Plugins

### Defining and Installing a New Plugin

```javascript
openmct.install(function install(openmctAPI) {
    // Do things here
    // ...
});
```

New plugins are installed in Open MCT by calling `openmct.install`, and
providing a plugin installation function. This function will be invoked on 
application startup with one parameter - the openmct API object. A common 
approach used in the Open MCT codebase is to define a plugin as a function that 
returns this installation function. This allows configuration to be specified 
when the plugin is included.

eg.

```javascript
openmct.install(openmct.plugins.Elasticsearch("http://localhost:8002/openmct"));
```

This approach can be seen in all of the [plugins provided with Open MCT](https://github.com/nasa/openmct/blob/master/src/plugins/plugins.js).

## Domain Objects and Identifiers

_Domain Objects_ are the basic entities that represent domain knowledge in Open 
MCT.  The temperature sensor on a solar panel, an overlay plot comparing the 
results of all temperature sensors, the command dictionary for a spacecraft, 
the individual commands in that dictionary, the "My Items" folder: All of these 
things are domain objects.

A _Domain Object_ is simply a javascript object with some standard attributes.  
An example of a _Domain Object_ is the "My Items" object which is a folder in 
which a user can persist any objects that they create. The My Items object 
looks like this: 

```javascript
{
    identifier: {
        namespace: ""
        key: "mine"
    }
    name:"My Items",
    type:"folder",
    location:"ROOT",
    composition: []
}
```

### Object Attributes

The main attributes to note are the `identifier`, and `type` attributes.

* `identifier`: A composite key that provides a universally unique identifier 
  for this object. The `namespace` and `key` are used to identify the object.
  The `key` must be unique within the namespace. 
* `type`: All objects in Open MCT have a type. Types allow you to form an 
  ontology of knowledge and provide an abstraction for grouping, visualizing, 
  and interpreting data. Details on how to define a new object type are 
  provided below. 

Open MCT uses a number of builtin types. Typically you are going to want to 
define your own when extending Open MCT.

### Domain Object Types

Custom types may be registered via the `addType` function on the Open MCT Type 
registry.

eg.
```javascript
openmct.types.addType('example.my-type', {
    name: "My Type",
    description: "This is a type that I added!",
    creatable: true
});
```

The `addType` function accepts two arguments:
* A `string` key identifying the type. This key is used when specifying a type
for an object.  We recommend prefixing your types with a namespace to avoid
conflicts with other plugins.
* An object type specification. An object type definition supports the following 
attributes      
    * `name`: a `string` naming this object type
    * `description`: a `string` specifying a longer-form description of this type
    * `initialize`: a `function` which initializes the model for new domain objects 
    of this type. This can be used for setting default values on an object when 
    it is instantiated.
    * `creatable`: A `boolean` indicating whether users should be allowed to create 
    this type (default: `false`). This will determine whether the type appears 
    in the `Create` menu.
    * `cssClass`: A `string` specifying a CSS class to apply to each representation 
    of this object. This is used for specifying an icon to appear next to each 
    object of this type.

The [Open MCT Tutorials](https://github.com/nasa/openmct-tutorial) provide a 
step-by-step examples of writing code for Open MCT that includes a [section on 
defining a new object type](https://github.com/nasa/openmct-tutorial#step-3---providing-objects).

## Root Objects

In many cases, you'd like a certain object (or a certain hierarchy of objects) 
to be accessible from the top level of the application (the tree on the left-hand 
side of Open MCT.) For example, it is typical to expose a telemetry dictionary 
as a hierarchy of telemetry-providing domain objects in this fashion.

To do so, use the `addRoot` method of the object API.

eg.
```javascript
openmct.objects.addRoot({
        namespace: "example.namespace",
        key: "my-key"
    });
```

The `addRoot` function takes a single [object identifier](#domain-objects-and-identifiers) 
as an argument. 

Root objects are loaded just like any other objects, i.e. via an object
provider.

## Object Providers

An Object Provider is used to build _Domain Objects_, typically retrieved from 
some source such as a persistence store or telemetry dictionary. In order to 
integrate telemetry from a new source an object provider will need to be created 
that can build objects representing telemetry points exposed by the telemetry 
source. The API call to define a new object provider is fairly straightforward. 
Here's a very simple example:

```javascript
openmct.objects.addProvider('example.namespace', {
    get: function (identifier) {
        return Promise.resolve({
            identifier: identifier,
            name: 'Example Object',
            type: 'example-object-type'
        });
    }
});
```
The `addProvider` function takes two arguments:

* `namespace`: A `string` representing the namespace that this object provider 
will provide objects for.
* `provider`: An `object` with a single function, `get`. This function accepts an 
[Identifier](#domain-objects-and-identifiers) for the object to be provided. 
It is expected that the `get` function will return a 
[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) 
that resolves with the object being requested.

In future, object providers will support other methods to enable other operations with persistence stores, such as creating, updating, and deleting objects.

## Composition Providers

The _composition_ of a domain object is the list of objects it contains, as
shown (for example) in the tree for browsing. Open MCT provides a
[default solution](#default-composition-provider) for composition, but there
may be cases where you want to provide the composition of a certain object
(or type of object) dynamically.

### Adding Composition Providers

You may want to populate a hierarchy under a custom root-level object based on 
the contents of a telemetry dictionary. To do this, you can add a new 
Composition Provider:

```javascript
openmct.composition.addProvider({
    appliesTo: function (domainObject) {
        return domainObject.type === 'example.my-type';
    },
    load: function (domainObject) {
        return Promise.resolve(myDomainObjects);
    }
});
```
The `addProvider` function accepts a Composition Provider object as its sole 
argument. A Composition Provider is a javascript object exposing two functions:
* `appliesTo`: A `function` that accepts a `domainObject` argument, and returns 
a `boolean` value indicating whether this composition provider applies to the 
given object.
* `load`: A `function` that accepts a `domainObject` as an argument, and returns
a `Promise` that resolves with an array of [Identifier](#domain-objects-and-identifiers).
These identifiers will be used to fetch Domain Objects from an [Object Provider](#object-provider)

### Default Composition Provider

The default composition provider applies to any domain object with a 
`composition` property. The value of `composition` should be an array of 
identifiers, e.g.:

```javascript
var domainObject = {
    name: "My Object",
    type: 'folder',
    composition: [
        {
            id: '412229c3-922c-444b-8624-736d85516247',
            namespace: 'foo'
        },
        {
            key: 'd6e0ce02-5b85-4e55-8006-a8a505b64c75',
            namespace: 'foo'
        }
    ]
};
```

## Telemetry API

The Open MCT telemetry API provides two main sets of interfaces-- one for
integrating telemetry data into Open MCT, and another for developing Open MCT
visualization plugins utilizing the telemetry API.  

The APIs for visualization plugins are still a work in progress and docs may
change at any time.  However, the APIs for integrating telemetry metadata into
Open MCT are stable and documentation is included below.

### Integrating Telemetry Sources

There are two main tasks for integrating telemetry sources-- describing telemetry objects with relevant metadata, and then providing telemetry data for those objects.  You'll use an [Object Provider](#object-providers) to provide objects with the necessary [Telemetry Metadata](#telemetry-metadata), and then register a [Telemetry Provider](#telemetry-providers) to retrieve telemetry data for those objects.  Alternatively, you can register a telemetry metadata provider to provide the necessary telemetry metadata.

For a step-by-step guide to building a telemetry adapter, please see the 
[Open MCT Tutorials](https://github.com/nasa/openmct-tutorial).

#### Telemetry Metadata

A telemetry object is a domain object with a telemetry property.  To take an example from the tutorial, here is the telemetry object for the "fuel" measurement of the spacecraft:

```json
{
    "identifier": {
        "namespace": "example.taxonomy",
        "key": "prop.fuel"
    },
    "name": "Fuel",
    "type": "example.telemetry",
    "telemetry": {
        "values": [
            {
                "key": "value",
                "name": "Value",
                "units": "kilograms",
                "format": "float",
                "min": 0,
                "max": 100,
                "hints": {
                    "range": 1
                }
            },
            {
                "key": "utc",
                "source": "timestamp",
                "name": "Timestamp",
                "format": "utc",
                "hints": {
                    "domain": 1
                }
            }
        ]
    }
}
```

The most important part of the telemetry metadata is the `values` property-- this describes the attributes of telemetry datums (objects) that a telemetry provider returns.  These descriptions must be provided for telemetry views to work properly.

##### Values

`telemetry.values` is an array of value description objects, which have the following fields:

attribute      | type   | flags    | notes
---            |  ---   |  ---     | ---
`key`          | string | required | unique identifier for this field.  
`hints`        | object | required | Hints allow views to intelligently select relevant attributes for display, and are required for most views to function.  See section on "Value Hints" below.
`name`         | string | optional | a human readable label for this field.  If omitted, defaults to `key`.
`source`       | string | optional | identifies the property of a datum where this value is stored.  If omitted, defaults to `key`.
`format`       | string | optional | a specific format identifier, mapping to a formatter.  If omitted, uses a default formatter.  For enumerations, use `enum`.  For timestamps, use `utc` if you are using utc dates, otherwise use a key mapping to your custom date format.  
`units`        | string | optional | the units of this value, e.g. `km`, `seconds`, `parsecs`
`min`          | number | optional | the minimum possible value of this measurement.  Will be used by plots, gauges, etc to automatically set a min value.
`max`          | number | optional | the maximum possible value of this measurement.  Will be used by plots, gauges, etc to automatically set a max value.
`enumerations` | array  | optional | for objects where `format` is `"enum"`, this array tracks all possible enumerations of the value.  Each entry in this array is an object, with a `value` property that is the numerical value of the enumeration, and a `string` property that is the text value of the enumeration.  ex: `{"value": 0, "string": "OFF"}`.  If you use an enumerations array, `min` and `max` will be set automatically for you.


###### Value Hints

Each telemetry value description has an object defining hints.  Keys in this this object represent the hint itself, and the value represents the weight of that hint.  A lower weight means the hint has a higher priority.  For example, multiple values could be hinted for use as the y-axis of a plot (raw, engineering), but the highest priority would be the default choice.  Likewise, a table will use hints to determine the default order of columns.

Known hints:

* `domain`: Values with a `domain` hint will be used for the x-axis of a plot, and tables will render columns for these values first.
* `range`: Values with a `range` hint will be used as the y-axis on a plot, and tables will render columns for these values after the `domain` values.
* `image`: Indicates that the value may be interpreted as the URL to an image file, in which case appropriate views will be made available.
* `imageDownloadName`: Indicates that the value may be interpreted as the name of the image file.

##### The Time Conductor and Telemetry 

Open MCT provides a number of ways to pivot through data and link data via time.  The Time Conductor helps synchronize multiple views around the same time.

In order for the time conductor to work, there will always be an active "time system".  All telemetry metadata *must* have a telemetry value with a `key` that matches the `key` of the active time system.  You can use the `source` attribute on the value metadata to remap this to a different field in the telemetry datum-- especially useful if you are working with disparate datasources that have different field mappings.


#### Telemetry Providers

Telemetry providers are responsible for providing historical and real-time telemetry data for telemetry objects.  Each telemetry provider determines which objects it can provide telemetry for, and then must implement methods to provide telemetry for those objects.

A telemetry provider is a javascript object with up to four methods:

* `supportsSubscribe(domainObject, callback, options)` optional.  Must be implemented to provide realtime telemetry.  Should return `true` if the provider supports subscriptions for the given domain object (and request options).
* `subscribe(domainObject, callback, options)` required if `supportsSubscribe` is implemented.  Establish a subscription for realtime data for the given domain object.  Should invoke `callback` with a single telemetry datum every time data is received.  Must return an unsubscribe function.  Multiple views can subscribe to the same telemetry object, so it should always return a new unsubscribe function.
* `supportsRequest(domainObject, options)` optional.  Must be implemented to provide historical telemetry.  Should return `true` if the provider supports historical requests for the given domain object.
* `request(domainObject, options)` required if `supportsRequest` is implemented.  Must return a promise for an array of telemetry datums that fulfills the request.  The `options` argument will include a `start`, `end`, and `domain` attribute representing the query bounds.  See [Telemetry Requests and Responses](#telemetry-requests-and-responses) for more info on how to respond to requests.
* `supportsMetadata(domainObject)` optional.  Implement and return `true` for objects that you want to provide dynamic metadata for.
* `getMetadata(domainObject)` required if `supportsMetadata` is implemented.  Must return a valid telemetry metadata definition that includes at least one valueMetadata definition.
* `supportsLimits(domainObject)` optional.  Implement and return `true` for domain objects that you want to provide a limit evaluator for.
* `getLimitEvaluator(domainObject)` required if `supportsLimits` is implemented.  Must return a valid LimitEvaluator for a given domain object.

Telemetry providers are registered by calling `openmct.telemetry.addProvider(provider)`, e.g.

```javascript
openmct.telemetry.addProvider({
    supportsRequest: function (domainObject, options) { /*...*/ },
    request: function (domainObject, options) { /*...*/ },
})
```

Note: it is not required to implement all of the methods on every provider.  Depending on the complexity of your implementation, it may be helpful to instantiate and register your realtime, historical, and metadata providers separately.

#### Telemetry Requests and Responses.

Telemetry requests support time bounded queries. A call to a _Telemetry Provider_'s `request` function will include an `options` argument. These are simply javascript objects with attributes for the request parameters. An example of a telemetry request object with a start and end time is included below:

```javascript
{
    start: 1487981997240,
    end: 1487982897240,
    domain: 'utc'
}
```

In this case, the `domain` is the currently selected time-system, and the start and end dates are valid dates in that time system.

A telemetry provider's `request` method should return a promise for an array of telemetry datums.  These datums must be sorted by `domain` in ascending order.

#### Request Strategies **draft**

To improve performance views may request a certain strategy for data reduction.  These are intended to improve visualization performance by reducing the amount of data needed to be sent to the client.  These strategies will be indicated by additional parameters in the request options.  You may choose to handle them or ignore them.  

Note: these strategies are currently being tested in core plugins and may change based on developer feedback.

##### `latest` request strategy

This request is a "depth based" strategy.  When a view is only capable of
displaying a single value (or perhaps the last ten values), then it can
use the `latest` request strategy with a `size` parameter that specifies
the number of results it desires.  The `size` parameter is a hint; views
must not assume the response will have the exact number of results requested.

example:
```javascript
{
    start: 1487981997240,
    end: 1487982897240,
    domain: 'utc',
    strategy: 'latest',
    size: 1
}
```

This strategy says "I want the latest data point in this time range".  A provider which recognizes this request should return only one value-- the latest-- in the requested time range.  Depending on your back-end implementation, performing these queries in bulk can be a large performance increase.  These are generally issued by views that are only capable of displaying a single value and only need to show the latest value.

##### `minmax` request strategy

example:
```javascript
{
    start: 1487981997240,
    end: 1487982897240,
    domain: 'utc',
    strategy: 'minmax',
    size: 720
}
```

MinMax queries are issued by plots, and may be issued by other types as well.  The aim is to reduce the amount of data returned but still faithfully represent the full extent of the data.  In order to do this, the view calculates the maximum data resolution it can display (i.e. the number of horizontal pixels in a plot) and sends that as the `size`.  The response should include at least one minimum and one maximum value per point of resolution.

#### Telemetry Formats **draft**

Telemetry format objects define how to interpret and display telemetry data. 
They have a simple structure:

* `key`: A `string` that uniquely identifies this formatter.
* `format`: A `function` that takes a raw telemetry value, and returns a 
  human-readable `string` representation of that value. It has one required 
  argument, and three optional arguments that provide context and can be used 
  for returning scaled representations of a value. An example of this is 
  representing time values in a scale such as the time conductor scale. There 
  are multiple ways of representing a point in time, and by providing a minimum
  scale value, maximum scale value, and a count, it's possible to provide more
  useful representations of time given the provided limitations.  
    * `value`: The raw telemetry value in its native type.
    * `minValue`: An __optional__ argument specifying the minimum displayed 
      value.
    * `maxValue`: An __optional__ argument specifying the maximum displayed 
      value.
    * `count`: An __optional__ argument specifying the number of displayed 
      values.
* `parse`: A `function` that takes a `string` representation of a telemetry 
  value, and returns the value in its native type. **Note** parse might receive an already-parsed value.  This function should be idempotent.
* `validate`: A `function` that takes a `string` representation of a telemetry 
  value, and returns a `boolean` value indicating whether the provided string
  can be parsed.

##### Registering Formats

Formats are registered with the Telemetry API using the `addFormat` function. eg.

``` javascript
openmct.telemetry.addFormat({
    key: 'number-to-string',
    format: function (number) {
        return number + '';
    },
    parse: function (text) {
        return Number(text);
    },
    validate: function (text) {
        return !isNaN(text);
    }
});
```

#### Telemetry Data

A single telemetry point is considered a Datum, and is represented by a standard
javascript object.  Realtime subscriptions (obtained via __subscribe__) will 
invoke the supplied callback once for each telemetry datum recieved.  Telemetry
requests (obtained via __request__) will return a promise for an array of 
telemetry datums.

##### Telemetry Datums

A telemetry datum is a simple javascript object, e.g.:

```json
{
    "timestamp": 1491267051538,
    "value": 77,
    "id": "prop.fuel"
}
```

The key-value pairs of this object are described by the telemetry metadata of
a domain object, as discussed in the [Telemetry Metadata](#telemetry-metadata)
section.

#### Limit Evaluators **draft**

Limit evaluators allow a telemetry integrator to define how limits should be 
applied to telemetry from a given domain object.  For an example of a limit 
evaluator, take a look at `examples/generator/SinewaveLimitProvider.js`.

### Telemetry Consumer APIs **draft**

The APIs for requesting telemetry from Open MCT -- e.g. for use in custom views -- are currently in draft state and are being revised.  If you'd like to experiment with them before they are finalized, please contact the team via the contact-us link on our website.


## Time API

Open MCT provides API for managing the temporal state of the application.
Central to this is the concept of "time bounds". Views in Open MCT will 
typically show telemetry data for some prescribed date range, and the Time API 
provides a way to centrally manage these bounds.

The Time API exposes a number of methods for querying and setting the temporal 
state of the application, and emits events to inform listeners when the state changes.

Because the data displayed tends to be time domain data, Open MCT must always 
have at least one time system installed and activated. When you download Open
MCT, it will be pre-configured to use the UTC time system, which is installed and activated, along with other default plugins, in `index.html`. Installing and activating a time system is simple, and is covered 
[in the next section](#defining-and-registering-time-systems). 

### Time Systems and Bounds

#### Defining and Registering Time Systems

The time bounds of an Open MCT application are defined as numbers, and a Time 
System gives meaning and context to these numbers so that they can be correctly 
interpreted. Time Systems are JavaScript objects that provide some information 
about the current time reference frame. An example of defining and registering 
a new time system is given below:

``` javascript
openmct.time.addTimeSystem({
    key: 'utc',
    name: 'UTC Time',
    cssClass = 'icon-clock',
    timeFormat = 'utc',
    durationFormat = 'duration',
    isUTCBased = true
});
```

The example above defines a new utc based time system. In fact, this time system 
is configured and activated by default from `index.html` in the default 
installation of Open MCT if you download the source from GitHub. Some details of 
each of the required properties is provided below.

* `key`: A `string` that uniquely identifies this time system.
* `name`: A `string` providing a brief human readable label. If the [Time Conductor](#the-time-conductor) 
plugin is enabled, this name will identify the time system in a dropdown menu.
* `cssClass`: A class name `string` that will be applied to the time system when 
it appears in the UI. This will be used to represent the time system with an icon. 
There are a number of built-in icon classes [available in Open MCT](https://github.com/nasa/openmct/blob/master/platform/commonUI/general/res/sass/_glyphs.scss), 
or a custom class can be used here. 
* `timeFormat`: A `string` corresponding to the key of a registered 
[telemetry time format](#telemetry-formats). The format will be used for 
displaying discrete timestamps from telemetry streams when this time system is 
activated. If the [UTCTimeSystem](#included-plugins) is enabled, then the `utc` 
format can be used if this is a utc-based time system
* `durationFormat`: A `string` corresponding to the key of a registered 
[telemetry time format](#telemetry-formats). The format will be used for 
displaying time ranges, for example `00:15:00` might be used to represent a time 
period of fifteen minutes. These are used by the Time Conductor plugin to specify
relative time offsets. If the [UTCTimeSystem](#included-plugins) is enabled, 
then the `duration` format can be used if this is a utc-based time system
* `isUTCBased`: A `boolean` that defines whether this time system represents 
numbers in UTC terrestrial time. 

#### Getting and Setting the Active Time System

Once registered, a time system can be activated by calling `timeSystem` with
the timeSystem `key` or an instance of the time system.  If you are not using a
[clock](#clocks), you must also specify valid [bounds](#time-bounds) for the
timeSystem.

```javascript
openmct.time.timeSystem('utc', bounds);
```

A time system can be immediately activated after registration: 

```javascript
openmct.time.addTimeSystem(utcTimeSystem);
openmct.time.timeSystem(utcTimeSystem, bounds);
```

Setting the active time system will trigger a [`'timeSystem'`](#time-events) 
event.  If you supplied bounds, a [`'bounds'`](#time-events) event will be triggered afterwards with your newly supplied bounds.

#### Time Bounds

The TimeAPI provides a getter/setter for querying and setting time bounds. Time 
bounds are simply an object with a `start` and an end `end` attribute.

* `start`: A `number` representing a moment in time in the active [Time System](#defining-and-registering-time-systems). 
This will be used as the beginning of the time period displayed by time-responsive
telemetry views.
* `end`: A `number` representing a moment in time in the active [Time System](#defining-and-registering-time-systems).
This will be used as the end of the time period displayed by time-responsive
telemetry views.

If invoked with bounds, it will set the new time bounds system-wide. If invoked 
without any parameters, it will return the current application-wide time bounds. 

``` javascript
const ONE_HOUR = 60 * 60 * 1000;
let now = Date.now();
openmct.time.bounds({start: now - ONE_HOUR, now);
```

To respond to bounds change events, listen for the [`'bounds'`](#time-events)
event.

### Clocks

The Time API can be set to follow a clock source which will cause the bounds
to be updated automatically whenever the clock source "ticks". A clock is simply
an object that supports registration of listeners and periodically invokes its 
listeners with a number. Open MCT supports registration of new clock sources that 
tick on almost anything. A tick occurs when the clock invokes callback functions 
registered by its listeners with a new time value.

An example of a clock source is the [LocalClock](https://github.com/nasa/openmct/blob/master/src/plugins/utcTimeSystem/LocalClock.js) 
which emits the current time in UTC every 100ms. Clocks can tick on anything. For 
example, a clock could be defined to provide the timestamp of any new data 
received via a telemetry subscription. This would have the effect of advancing 
the bounds of views automatically whenever data is received. A clock could also 
be defined to tick on some remote timing source.

The values provided by clocks are simple `number`s, which are interpreted in the
context of the active [Time System](#defining-and-registering-time-systems).

#### Defining and registering clocks

A clock is an object that defines certain required metadata and functions:

* `key`: A `string` uniquely identifying this clock. This can be used later to 
reference the clock in places such as the [Time Conductor configuration](#time-conductor-configuration)
* `cssClass`: A `string` identifying a CSS class to apply to this clock when it's 
displayed in the UI. This will be used to represent the time system with an icon. 
There are a number of built-in icon classes [available in Open MCT](https://github.com/nasa/openmct/blob/master/platform/commonUI/general/res/sass/_glyphs.scss), 
or a custom class can be used here. 
* `name`: A `string` providing a human-readable identifier for the clock source. 
This will be displayed in the clock selector menu in the Time Conductor UI 
component, if active. 
* `description`: An __optional__ `string` providing a longer description of the 
clock. The description will be visible in the clock selection menu in the Time 
Conductor plugin.
* `on`: A `function` supporting registration of a new callback that will be 
invoked when the clock next ticks. It will be invoked with two arguments:
    * `eventName`: A `string` specifying the event to listen on. For now, clocks 
    support one event - `tick`.
    * `callback`: A `function` that will be invoked when this clock ticks. The 
    function must be invoked with one parameter - a `number` representing a valid
    time in the current time system.
* `off`: A `function` that allows deregistration of a tick listener. It accepts 
the same arguments as `on`.
* `currentValue`: A `function` that returns a `number` representing a point in 
time in the active time system. It should be the last value provided by a tick, 
or some default value if no ticking has yet occurred.

A new clock can be registered using the `addClock` function exposed by the Time 
API:

```javascript
var someClock = {
    key: 'someClock',
    cssClass: 'icon-clock',
    name: 'Some clock',
    description: "Presumably does something useful",
    on: function (event, callback) {
        // Some function that registers listeners, and updates them on a tick
    },
    off: function (event, callback) {
        // Some function that unregisters listeners.
    },
    currentValue: function () {
        // A function that returns the last ticked value for the clock
    }
}

openmct.time.addClock(someClock);
```

An example clock implementation is provided in the form of the [LocalClock](https://github.com/nasa/openmct/blob/master/src/plugins/utcTimeSystem/LocalClock.js)

#### Getting and setting active clock

Once registered a clock can be activated by calling the `clock` function on the 
Time API passing in the key or instance of a registered clock. Only one clock 
may be active at once, so activating a clock will deactivate any currently 
active clock. [`clockOffsets`](#clock-offsets) must be specified when changing a clock.

Setting the clock triggers a [`'clock'`](#time-events) event, followed by a [`'clockOffsets'`](#time-events) event, and then a [`'bounds'`](#time-events) event as the offsets are applied to the clock's currentValue().


```
openmct.time.clock(someClock, clockOffsets);
```

Upon being activated, the time API will listen for tick events on the clock by calling `clock.on`.

The currently active clock (if any) can be retrieved by calling the same 
function without any arguments.

#### Stopping an active clock

The `stopClock` method can be used to stop an active clock, and to clear it. It 
will stop the clock from ticking, and set the active clock to `undefined`.

``` javascript
openmct.time.stopClock();
```

#### Clock Offsets

When a clock is active, the time bounds of the application will be updated 
automatically each time the clock "ticks". The bounds are calculated based on 
the current value provided by the active clock (via its `tick` event, or its 
`currentValue()` method). 

Unlike bounds, which represent absolute time values, clock offsets represent
relative time spans. Offsets are defined as an object with two properties:

* `start`: A `number` that must be < 0 and which is used to calculate the start 
bounds on each clock tick. The start offset will be calculated relative to the 
value provided by a clock's tick callback, or its `currentValue()` function.
* `end`: A `number` that must be >= 0 and which is used to calculate the end 
bounds on each clock tick.

The `clockOffsets` function can be used to get or set clock offsets. For example, 
to show the last fifteen minutes in a ms-based time system: 

```javascript
var FIFTEEN_MINUTES = 15 * 60 * 1000;

openmct.time.clockOffsets({
    start: -FIFTEEN_MINUTES,
    end: 0
})
```

__Note:__ Setting the clock offsets will trigger an immediate bounds change, as 
new bounds will be calculated based on the `currentValue()` of the active clock. 
Clock offsets are only relevant when a clock source is active.

### Time Events

The Time API is a standard event emitter; you can register callbacks for events using the `on` method and remove callbacks for events with the `off` method.

For example:

``` javascript
openmct.time.on('bounds', function callback (newBounds, tick) {
    // Do something with new bounds
});
```

#### List of Time Events

The events emitted by the Time API are:

* `bounds`: emitted whenever the bounds change.  The callback will be invoked 
  with two arguments:
  * `bounds`: A [bounds](#getting-and-setting-bounds) bounds object
    representing a new time period bound by the specified start and send times.
  * `tick`: A `boolean` indicating whether or not this bounds change is due to
    a "tick" from a [clock source](#clocks). This information can be useful 
    when determining a strategy for fetching telemetry data in response to a 
    bounds change event. For example, if the bounds change was automatic, and 
    is due to a tick then it's unlikely that you would need to perform a 
    historical data query. It should be sufficient to just show any new 
    telemetry received via subscription since the last tick, and optionally to 
    discard any older data that now falls outside of the currently set bounds. 
    If `tick` is false,then the bounds change was not due to an automatic tick, 
    and a query for historical data may be necessary, depending on your data 
    caching strategy, and how significantly the start bound has changed.
* `timeSystem`: emitted whenever the active time system changes.  The callback will be invoked with a single argument:
  * `timeSystem`: The newly active [time system](#defining-and-registering-time-systems).
* `clock`: emitted whenever the clock changes.  The callback will be invoked 
  with a single argument:
  * `clock`: The newly active [clock](#clocks), or `undefined` if an active 
    clock has been deactivated.
* `clockOffsets`: emitted whenever the active clock offsets change.  The 
  callback will be invoked with a single argument:
  * `clockOffsets`: The new [clock offsets](#clock-offsets).


### The Time Conductor

The Time Conductor provides a user interface for managing time bounds in Open 
MCT. It allows a user to select from configured time systems and clocks, and to set bounds and clock offsets.

If activated, the time conductor must be provided with configuration options, 
detailed below.

#### Time Conductor Configuration

The time conductor is configured by specifying the options that will be 
available to the user from the menus in the time conductor. These will determine 
the clocks available from the conductor, the time systems available for each 
clock, and some default bounds and clock offsets for each combination of clock 
and time system. By default, the conductor always supports a `fixed` mode where 
no clock is active. To specify configuration for fixed mode, simply leave out a
`clock` attribute in the configuration entry object.

Configuration is provided as an `array` of menu options. Each entry of the 
array is an object with some properties specifying configuration. The configuration
options specified are slightly different depending on whether or not it is for 
an active clock mode.

__Configuration for Fixed Time Mode (no active clock)__

* `timeSystem`: A `string`, the key for the time system that this configuration 
relates to.
* `bounds`: A [`Time Bounds`](#time-bounds) object. These bounds will be applied 
when the user selects the time system specified in the previous `timeSystem` 
property.
* `zoomOutLimit`: An __optional__ `number` specifying the longest period of time 
that can be represented by the conductor when zooming. If a `zoomOutLimit` is 
provided, then a `zoomInLimit` must also be provided. If provided, the zoom 
slider will automatically become available in the Time Conductor UI.
* `zoomInLimit`: An __optional__ `number` specifying the shortest period of time 
that can be represented by the conductor when zooming. If a `zoomInLimit` is 
provided, then a `zoomOutLimit` must also be provided. If provided, the zoom 
slider will automatically become available in the Time Conductor UI.

__Configuration for Active Clock__

* `clock`: A `string`, the `key` of the clock that this configuration applies to. 
* `timeSystem`: A `string`, the key for the time system that this configuration 
relates to. Separate configuration must be provided for each time system that you 
wish to be available to users when they select the specified clock.
* `clockOffsets`: A [`clockOffsets`](#clock-offsets) object that will be 
automatically applied when the combination of clock and time system specified in 
this configuration is selected from the UI.

#### Example conductor configuration

An example time conductor configuration is provided below. It sets up some 
default options for the [UTCTimeSystem](https://github.com/nasa/openmct/blob/master/src/plugins/utcTimeSystem/UTCTimeSystem.js) 
and [LocalTimeSystem](https://github.com/nasa/openmct/blob/master/src/plugins/localTimeSystem/LocalTimeSystem.js), 
in both fixed mode, and for the [LocalClock](https://github.com/nasa/openmct/blob/master/src/plugins/utcTimeSystem/LocalClock.js) 
source. In this configutation, the local clock supports both the UTCTimeSystem 
and LocalTimeSystem. Configuration for fixed bounds mode is specified by omitting 
a clock key.

``` javascript
const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;
const ONE_MINUTE = 60 * 1000;

openmct.install(openmct.plugins.Conductor({
    menuOptions: [
        // 'Fixed' bounds mode configuation for the UTCTimeSystem
        {
            timeSystem: 'utc',
            bounds: {start: Date.now() - 30 * ONE_MINUTE, end: Date.now()},
            zoomOutLimit: ONE_YEAR,
            zoomInLimit: ONE_MINUTE
        },
        // Configuration for the LocalClock in the UTC time system
        {
            clock: 'local',
            timeSystem: 'utc',
            clockOffsets: {start: - 30 * ONE_MINUTE, end: 0},
            zoomOutLimit: ONE_YEAR,
            zoomInLimit: ONE_MINUTE
        },
        //Configuration for the LocaLClock in the Local time system
        {
            clock: 'local',
            timeSystem: 'local',
            clockOffsets: {start: - 15 * ONE_MINUTE, end: 0}
        }
    ]
}));
```

## Indicators

Indicators are small widgets that reside at the bottom of the screen and are visible from 
every screen in Open MCT. They can be used to convey system state using an icon and text.
Typically an indicator will display an icon (customizable with a CSS class) that will 
reveal additional information when the mouse cursor is hovered over it.

### The URL Status Indicator

A common use case for indicators is to convey the state of some external system such as a 
persistence backend or HTTP server. So long as this system is accessible via HTTP request, 
Open MCT provides a general purpose indicator to show whether the server is available and 
returing a 2xx status code. The URL Status Indicator is made available as a default plugin. See
the [documentation](./src/plugins/URLIndicatorPlugin) for details on how to install and configure the 
URL Status Indicator.

### Creating a Simple Indicator

A simple indicator with an icon and some text can be created and added with minimal code. An indicator 
of this type exposes functions for customizing the text, icon, and style of the indicator.

eg.
``` javascript
var myIndicator = openmct.indicators.simpleIndicator();
myIndicator.text("Hello World!");
openmct.indicators.add(myIndicator);
```

This will create a new indicator and add it to the bottom of the screen in Open MCT.
By default, the indicator will appear as an information icon. Hovering over the icon will
reveal the text set via the call to `.text()`. The Indicator object returned by the API 
call exposes a number of functions for customizing the content and appearance of the indicator:

* `.text([text])`: Gets or sets the text shown when the user hovers over the indicator.
Accepts an __optional__ `string` argument that, if provided, will be used to set the text. 
Hovering over the indicator will expand it to its full size, revealing this text alongside 
the icon. Returns the currently set text as a `string`.
* `.description([description])`: Gets or sets the indicator's description. Accepts an 
__optional__ `string` argument that, if provided, will be used to set the text. The description 
allows for more detail to be provided in a tooltip when the user hovers over the indicator. 
Returns the currently set text as a `string`.
* `.iconClass([className])`: Gets or sets the CSS class used to define the icon. Accepts an __optional__ 
`string` parameter to be used to set the class applied to the indicator. Any of 
[the built-in glyphs](https://nasa.github.io/openmct/style-guide/#/browse/styleguide:home/glyphs?view=styleguide.glyphs) 
may be used here, or a custom CSS class can be provided. Returns the currently defined CSS 
class as a `string`.
* `.statusClass([className])`: Gets or sets the CSS class used to determine status. Accepts an __optional __
`string` parameter to be used to set a status class applied to the indicator. May be used to apply 
different colors to indicate status.

### Custom Indicators

A completely custom indicator can be added by simply providing a DOM element to place alongside other indicators.

``` javascript
    var domNode = document.createElement('div');
    domNode.innerText = new Date().toString();
    setInterval(function () {
        domNode.innerText = new Date().toString();
    }, 1000);

    openmct.indicators.add({
        element: domNode
    });
```
