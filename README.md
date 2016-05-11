# boxart

Tools for building html games with React. Depended on by and documented at [boxart/boxart-boiler](https://github.com/boxart/boxart-boiler).

## Local Development

To work on boxart locally, you must have [Node](https://nodejs.org/) installed on your computer. After cloning this repository, run `npm install` (from the command prompt or terminal) to download boxart's package dependencies.

To run the boxart unit test suite, use the `npm test` command; or (if [Grunt](http://gruntjs.com/) is [globally installed](http://gruntjs.com/getting-started#installing-the-cli) on your computer) run `grunt test-dev`.

### Grunt Tasks

#### test-dev

`grunt test-dev` boots a test server with karma to run tests as changes to the source code or tests are made.

#### publish

`grunt publish` transpiles boxart's es2015 code to es5 and publishes boxart and its subpackages (e.g. boxart-stage) to npm.
