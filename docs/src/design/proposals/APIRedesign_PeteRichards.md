<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Reducing interface depth (the bundle.json version)](#reducing-interface-depth-the-bundlejson-version)
  - [Imperative component registries](#imperative-component-registries)
  - [Get rid of "extension category" concept.](#get-rid-of-extension-category-concept)
  - [Reduce number and depth of extension points](#reduce-number-and-depth-of-extension-points)
  - [Composite services should not be the default](#composite-services-should-not-be-the-default)
  - [Get rid of views, representations, and templates.](#get-rid-of-views-representations-and-templates)
- [Reducing interface depth (The angular discussion)](#reducing-interface-depth-the-angular-discussion)
  - [More angular: for all services](#more-angular-for-all-services)
  - [Less angular: only for views](#less-angular-only-for-views)
- [Standard packaging and build system](#standard-packaging-and-build-system)
  - [Use systemjs for module loading](#use-systemjs-for-module-loading)
  - [Use gulp or grunt for standard tooling](#use-gulp-or-grunt-for-standard-tooling)
  - [Package openmctweb as single versioned file.](#package-openmctweb-as-single-versioned-file)
- [Misc Improvements](#misc-improvements)
  - [Refresh on navigation](#refresh-on-navigation)
  - [Move persistence adapter to promise rejection.](#move-persistence-adapter-to-promise-rejection)
  - [Remove bulk requests from providers](#remove-bulk-requests-from-providers)
- [Notes on current API proposals:](#notes-on-current-api-proposals)
- [[1] Footnote: The angular debacle](#1-footnote-the-angular-debacle)
  - ["Do or do not, there is no try"](#do-or-do-not-there-is-no-try)
  - [A lack of commitment](#a-lack-of-commitment)
  - [Commitment is good!](#commitment-is-good)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


# Reducing interface depth (the bundle.json version)

## Imperative component registries 

Transition component registries to javascript, get rid of bundle.json and bundles.json.  Prescribe a method for application configuration, but allow flexibility in how application configuration is defined.

Register components in an imperative fashion, see angularApp.factory, angularApp.controller, etc.  Alternatively, implement our own application object with new registries and it's own form of registering objects.

## Get rid of "extension category" concept.

The concept of an "extension category" is itself an extraneous concept-- an extra layer of interface depth, an extra thing to learn before you can say "hello world".  Extension points should be clearly supported and documented with whatever interfaces make sense.  Developers who wish to add something that is conceptually equivalent to an extension category can do so directly, in the manner that suites their needs, without us forcing a common method on them.

## Reduce number and depth of extension points

Clearly specify supported extension points (e.g. persistence, model providers, telemetry providers, routes, time systems), but don't claim that the system has a clear and perfect repeatable solution for unknown extension types.  New extension categories can be implemented in whatever way makes sense, without prescribing "the one and only system for managing extensions".

The underlying problem here is we are predicting needs for extension points where none exist-- if we try and design the extension system before we know how it is used, we design the wrong thing and have to rewrite it later.

## Composite services should not be the default

Understanding composite services, and describing services as composite services can confuse developers.  Aggregators are implemented once and forgotten, while decorators tend to be hacky, brittle solutions that are generally needed to avoid circular imports.  While composite services are a useful construct, it reduces interface depth to implement them as registries + typed providers.

You can write a provider (provides "thing x" for "inputs y") with a simple interface.  A provider has two or more methods:
* a method which takes "inputs y" and returns True if it knows how to provide "thing x", false otherwise.
* one or more methods which provide "thing x" for objects of "inputs y".  

Actually checking whether a provider can respond to a request before asking it to do work allows for faster failure and clearer errors when no providers match the request.

## Get rid of views, representations, and templates.

Templates are an implementation detail that should be handled by module loaders.  Views and representations become "components," and a new concept, "routes", is used to exposing specific views to end users.

`components` - building blocks for views, have clear inputs and outputs, and can be coupled to other components when it makes sense.  (e.g. parent-child components such as menu and menu item), but should have ZERO knowledge of our data models or telemetry apis.  They should define data models that enable them to do their job well while still being easy to test.

`routes` - a view type for a given domain object, e.g. a plot, table, display layout, etc.  Can be described as "whatever shows in the main screen when you are viewing an object."  Handle loading of data from a domain object and passing that data to the view components.  Routes should support editing as it makes sense in their own context.

To facilitate testing:

* routes should be testable without having to test the actual view.
* components should be independently testable with zero knowledge of our data models or telemetry APIs.

Component code should be organized side by side, such as:

```
app
|- components
  |- productDetail
  | |- productDetail.js
  | |- productDetail.css
  | |- productDetail.html
  | |- productDetailSpec.js
  |- productList
  |- checkout
  |- wishlist
```

Components are not always reusable, and we shouldn't be overly concerned with making them so.  If components are heavily reused, they should either be moved to a platform feature (e.g. notifications, indicators), or broken off as an external dependency (e.g. publish mct-plot as mct-plot.js).


# Reducing interface depth (The angular discussion)

Two options here: use more angular, use less angular.  Wrapping angular methods does not reduce interface depth and must be avoided.

The primary issue with angular is duplications of concerns-- both angular and the openmctweb platform implement the same tools side by side and it can be hard to comprehend-- it increases interface depth.  For other concerns, see footnotes[1].

Wrapping angular methods for non-view related code is confusing to developers because of the random constraints angular places on these items-- developers ultimately have to understand both angular DI and our framework.  For example, it's not possible to name the topic service "topicService" because angular expects Services to be implemented by Providers, which is different than our expectation.

To reduce interface depth, we can replace our own provider and registry patterns with angular patterns, or we can only utilize angular view logic, and only use our own DI patterns.

## More angular: for all services

Increasing our commitment to angular would mean using more of the angular factories, services, etc, and less of our home grown tools.  We'd implement our services and extension points as angular providers, and make them configurable via app.config.

As an example, registering a specific type of model provider in angular would look like:

```javascript
mct.provider('model', modelProvider() { /* implementation */});

mct.config(['modelProvider', function (modelProvider) {
    modelProvider.providers.push(RootModelProvider);
}]);
```

## Less angular: only for views

If we wish to use less angular, I would recommend discontinuing use of all angular components that are not view related-- services, factories, $http, etc, and implementing them in our own paradigm.  Otherwise, we end up with layered interfaces-- one of the goals we would like to avoid.


# Standard packaging and build system

Standardize the packaging and build system, and completely separate the core platform from deployments.  Prescribe a starting point for deployments, but allow flexibility.

## Use systemjs for module loading

Allow developers to use whatever module loading system they'd like to use, while still supporting all standard cases.  We should also use this system for loading assets (css, scss, html templates), which makes it easier to implement a single file deployment using standard build tooling.

## Use gulp or grunt for standard tooling

Using gulp or grunt as a task runner would bring us in line with standard web developer workflows and help standardize rendering, deployment, and packaging.  Additional tools can be added to the workflow at low cost, simplifying the setup of developer environments.

Gulp and grunt provide useful developer tooling such as live reload, automatic scss/less/etc compilation, and ease of extensibility for standard production build processes.  They're key in decoupling code.

## Package openmctweb as single versioned file.

Deployments should depend on a specific version of openmctweb, but otherwise be allowed to have their own deployment and development toolsets.

Customizations and deployments of openmctweb should not use the same build tooling as the core platform; instead they should be free to use their own build tools as they wish.  (We would provide a template for an application, based on our experience with warp-for-rp and vista)

Installation and utilization of openmctweb should be as simple as downloading the js file, including it in your own html page, and then initializing an app and running it.  If a developer would prefer, they could use bower or npm to handle installation. 

Then, if we're using imperative methods for extending the application we can use the following for basic customization:

```html
<script src="//localhost/openmctweb.js"></script>
<script>
// can configure from object
var myApp = new OpenMCTWeb({
  persistence: {
    providers: [
      {
        type: 'elastic',
        uri: 'http://someElasticHost/'
      } // ...
    ]
  }
});

// alternative configurations
myApp.persistence.addProvider(MyPersistenceAdapter); 
myApp.model.addProvider(someProviderObject);

// Removing via method
myApp.persistence.removeProvider('some method for removing functionality');
// directly mutating providers
myApp.persistence.providers = [ThisProviderStandsAlone];
//
myApp.run();
</script>
```

This packaging reduces the complexity of managing multiple deployed versions, and also allows us to provide users with incredibly simple tutorials-- they can use whatever tooling they like.  For instance, a hello world tutorial may take the option of "exposing a new object in the tree".

```javascript
var myApp = new OpenMCTWeb();
myApp.roots.addRoot({
    id: 'myRoot',
    name: 'Hello World!',
});
myApp.routes.setDefault('myRoot');
myApp.run();
```

# Misc Improvements
 
## Refresh on navigation
In cases where navigation events change the entire screen, we should be using routes and location changes to navigate between objects.  We should be using href for all navigation events.

At the same time, navigating should refresh state of every visible object.  A properly configured persistence store will handle caching with standard cache headers and 304 not modified responses, which will provide good performance of object reloads, while helping us ensure that objects are always in sync between clients.

View state (say, the expanded tree nodes) should not be tied to caching of data-- it should be something we intentionally persist and restore with each navigation.  Data (such as object definitions) should be reloaded from server as necessary to restore state.

## Move persistence adapter to promise rejection.
Simple: reject on fail, resolve on success.

## Remove bulk requests from providers

Aggregators can request multiple things at once, but individual providers should only have to implement handling at the level of a single request.  Each provider can implement it's own internal batching, but it should support making requests at a finer level of detail.  

Excessive wrapping of code with $q.all causes additional digest cycles and decreased performance.

For example, instead of every telemetry provider responding to a given telemetry request, aggregators should route each request to the first provider that can fulfill that request.


# Notes on current API proposals:

* [RequireJS for Dependency Injection](https://github.com/nasa/openmctweb/blob/api-redesign/docs/src/design/proposals/APIRedesign.md#requirejs-as-dependency-injector): requires other topics to be discussed first.
* [Arbitrary HTML Views](https://github.com/nasa/openmctweb/blob/api-redesign/docs/src/design/proposals/APIRedesign.md#arbitrary-html-views): think there is a place for it, requires other topics to be discussed first.
* [Wrap Angular Services](https://github.com/nasa/openmctweb/blob/api-redesign/docs/src/design/proposals/APIRedesign.md#wrap-angular-services): No, this is bad.
* [Bundle definitions in Javascript](https://github.com/nasa/openmctweb/blob/api-redesign/docs/src/design/proposals/APIRedesign.md#bundle-declarations-in-javascript): Points to a solution, but ultimately requires more discussion.
* [pass around a dependency injector](https://github.com/nasa/openmctweb/blob/api-redesign/docs/src/design/proposals/APIRedesign.md#pass-around-a-dependency-injector): No.
* [remove partial constructors](https://github.com/nasa/openmctweb/blob/api-redesign/docs/src/design/proposals/APIRedesign.md#remove-partial-constructors): Yes, this should be superseded by another proposal though.  The entire concept was a messy solution to dependency injection issues caused by declarative syntax.
* [Rename views to applications](https://github.com/nasa/openmctweb/blob/api-redesign/docs/src/design/proposals/APIRedesign.md#rename-views-to-applications): Points to a problem that needs to be solved but I think the name is bad.
* [Provide classes for extensions](https://github.com/nasa/openmctweb/blob/api-redesign/docs/src/design/proposals/APIRedesign.md#provide-classes-for-extensions): Yes, in specific places
* [Normalize naming conventions](https://github.com/nasa/openmctweb/blob/api-redesign/docs/src/design/proposals/APIRedesign.md#normalize-naming-conventions): Yes.
* [Expose no third-party APIs](https://github.com/nasa/openmctweb/blob/api-redesign/docs/src/design/proposals/APIRedesign.md#expose-no-third-party-apis): Completely disagree, points to a real problem with poor angular integration.
* [Register Extensions as Instances instead of Constructors](https://github.com/nasa/openmctweb/blob/api-redesign/docs/src/design/proposals/APIRedesign.md#register-extensions-as-instances-instead-of-constructors): Superseded by the fact that we should not hope to implement a generic construct.
* [Remove capability delegation](https://github.com/nasa/openmctweb/blob/api-redesign/docs/src/design/proposals/APIRedesign.md#remove-capability-delegation): Yes.
* [Nomenclature Change](https://github.com/nasa/openmctweb/blob/api-redesign/docs/src/design/proposals/APIRedesign.md#nomenclature-change): Yes, hope to discuss the implications of this more clearly in other proposals.
* [Capabilities as mixins](https://github.com/nasa/openmctweb/blob/api-redesign/docs/src/design/proposals/APIRedesign.md#capabilities-as-mixins): Yes.
* [Remove appliesTo methods](https://github.com/nasa/openmctweb/blob/api-redesign/docs/src/design/proposals/APIRedesign.md#remove-applies-to-methods): No-- I think some level of this is necessary.  I think a more holistic approach to policy is needed.  it's a rather complicated system.
* [Revise telemetry API](https://github.com/nasa/openmctweb/blob/api-redesign/docs/src/design/proposals/APIRedesign.md#revise-telemetry-api): If we can rough out and agree to the specifics, then Yes.  Needs discussion.
* [Allow composite services to fail gracefully](https://github.com/nasa/openmctweb/blob/api-redesign/docs/src/design/proposals/APIRedesign.md#allow-composite-services-to-fail-gracefully): No.  As mentioned above, I think composite services themselves should be eliminated for a more purpose bound tool.
* [Plugins as angular modules](https://github.com/nasa/openmctweb/blob/api-redesign/docs/src/design/proposals/APIRedesign.md#plugins-as-angular-modules): Should we decide to embrace Angular completely, I would support this.  Otherwise, no.
* [Contextual Injection](https://github.com/nasa/openmctweb/blob/api-redesign/docs/src/design/proposals/APIRedesign.md#contextual-injection): No, don't see a need.
* [Add New Abstractions for Actions](https://github.com/nasa/openmctweb/blob/api-redesign/docs/src/design/proposals/APIRedesign.md#add-new-abstractions-for-actions): Worth a discussion.
* [Add gesture handlers](https://github.com/nasa/openmctweb/blob/api-redesign/docs/src/design/proposals/APIRedesign.md#add-gesture-handlers): Yes if we can agree on details.  We need a platform implementation that is easy to use, but we should not reinvent the wheel.



# [1] Footnote: The angular debacle

## "Do or do not, there is no try"

A commonly voiced concern of embracing angular is the possibility of becoming dependent on a third party framework.  This concern is itself detrimental-- if we're afraid of becoming dependent on a third party framework, then we will do a bad job of using the framework, and inevitably will want to stop using it.  

If we're using a framework, we need to use it fully, or not use it at all.

## A lack of commitment

A number of the concerns we heard from developers and interns can be attributed to the tenuous relationship between the OpenMCTWeb platform and angular.  We claimed to be angular, but we weren't really angular.  Instead, we are caught between our incomplete framework paradigm and the angular paradigm.  In many cases we reinvented the wheel or worked around functionality that angular provides, and ended up in a more confusing state.

## Commitment is good!

We could just be an application that is built with angular.  

An application that is modular and extensible not because it reinvents tools for providing modularity and extensibility, but because it reuses existing tools for modularity and extensibility.

There are benefits to buying into the angular paradigm: shift documentation burden to external project, engage a larger talent pool available both as voluntary open source contributors and as experienced developers for hire, and gain access to an ecosystem of tools that we can use to increase the speed of development.

There are negatives too: Angular is a monolith, it has performance concerns, and an unclear future.  If we can't live with it, we should look at alternatives.

