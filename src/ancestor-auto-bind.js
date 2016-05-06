/**
 * @file Ancestor react component that auto-binds members
 * @module modules/auto-bind-ancestor
 * @see AutoBindAncestor
 */

import React from 'react';

import bindMethods from './util/bind-methods';

/**
 * Creates a new Base React component with self-bound methods
 * @constructor
 * @alias AutoBindAncestor
 * @requires React
 * @requires module:utilBindMethods
 * @extends React.Component
 */
export default class AutoBindAncestor extends React.Component {
  constructor(props) {
    super(props);
    bindMethods(this, null, AutoBindAncestor.prototype);
  }
}

if (module.hot) {
  AutoBindAncestor.prototype.componentWillUpdate = function(...args) {
    (React.Component.componentWillUpdate || (() => {})).call(this, ...args);
    bindMethods(this, null, AutoBindAncestor.prototype);
  };
}
