const testsContext = require.context(".", !0, /\/(src|platform)\/.*Spec.js$/);
testsContext.keys().forEach(testsContext);
