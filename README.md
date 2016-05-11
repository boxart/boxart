# boxart [![Build Status](https://travis-ci.org/boxart/boxart.svg?branch=master)](https://travis-ci.org/boxart/boxart)

Tools for building html games with React. Depended on by and documented at [boxart/boxart-boiler](https://github.com/boxart/boxart-boiler).

## Local Development

To work on boxart locally, you must have [Node](https://nodejs.org/) installed on your computer. After cloning this repository, run `npm install` (from the command prompt or terminal) to download boxart's package dependencies.

To run the boxart unit test suite, use the `npm test` command; or (if [Grunt](http://gruntjs.com/) is [globally installed](http://gruntjs.com/getting-started#installing-the-cli) on your computer) run `grunt test-dev`.

### Development Commands

**Note:** these test commands assume the [Firefox](https://www.mozilla.org/en-US/firefox/new/) web browser is installed on your development system.

#### npm run test-dev

`npm test-dev` boots a test server with Karma to automatically re-run tests in a captured Firefox browser instance whenever changes are made to the source code or tests.

#### npm test

`npm test` runs the test suite once in a captured Firefox browser instance and then exits.

#### grunt publish

`grunt publish` transpiles boxart's es2015 code to es5 and publishes boxart and its subpackages (e.g. boxart-stage) to npm.
