/**
 * @file Ancestor that includes react-addons-update convenience methods
 * @module modules/update-ancestor
 * @see UpdateAncestor
 */

import 'core-js/modules/es6.promise';

import update from 'react-addons-update';

import AutoBindAncestor from './ancestor-auto-bind';

/**
 * An ancestor component that on top of auto-binding provides convenience
 * methods for using react-addons-update.
 * @constructor
 * @alias UpdateAncestor
 * @requires React
 * @extends AutoBindAncestor
 */
export default class UpdateAncestor extends AutoBindAncestor {
  promiseState(change) {
    return new Promise(resolve => this.updateState(change, resolve));
  }

  updateState(change, fn) {
    this.setState(update(this.state, change), fn);
  }
}
