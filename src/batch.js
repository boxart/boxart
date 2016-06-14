import 'core-js/modules/es6.set';

import React, {Children, Component} from 'react';

/**
 * Batch
 *
 * Common and useful optimization over a batch of elements reducing
 * object creation.
 *
 * Make sure to localize all data an item under this component needs to be
 * represented is in its member of the passed array. As long as that is true
 * this optimization won't get in the way.
 *
 * ```js
 * <Batch items={items} itemKey={item => item.key}>{(
 *   item => <ItemComponent item={item} />
 * )}</Batch>
 * ```
 */
export default class Batch extends Component {
  constructor(...args) {
    super(...args);

    this.state = {
      items: this.props.items.map(this.renderItem, this),
    };
    this.keyedItems = {};
    this.keyedElements = {};
    this.state.items.forEach((batchItem, index) => {
      if (batchItem.key) {
        this.keyedItems[batchItem.key] = this.props.items[index];
        this.keyedElements[batchItem.key] = batchItem;
      }
    });
  }

  componentWillReceiveProps(newProps) {
    if (this.props !== newProps) {
      const newState = {items: [...this.state.items]};
      const map = newProps.children;
      const keyGetter = newProps.itemKey || (() => null);

      const removeKeys = new Set();

      for (let i = 0; i < this.props.items.length; i++) {
        const itemKey = keyGetter(this.props.items[i]);
        if (itemKey) {
          removeKeys.add(itemKey);
        }
      }

      for (let i = 0; i < newProps.items.length; i++) {
        const newItem = newProps.items[i];
        const itemKey = keyGetter(newItem);
        if (this.props.items[i] !== newItem) {
          let element;
          if (
            itemKey &&
            this.keyedItems[itemKey] !== newItem
          ) {
            element = this.renderItem(newItem, i, newProps.items, map, keyGetter);
            this.keyedItems[itemKey] = newItem;
            this.keyedElements[itemKey] = element;
          }
          else if (itemKey && itemKey in this.keyedItems) {
            element = this.keyedElements[itemKey];
          }
          else {
            element = this.renderItem(newItem, i, newProps.items, map, keyGetter);
            if (itemKey && !this.keyedItems[itemKey]) {
              this.keyedItems[itemKey] = newItem;
              this.keyedElements[itemKey] = element;
            }
          }
          newState.items[i] = element;
        }
        if (itemKey) {
          removeKeys.delete(itemKey);
        }
      }
      for (const removeKey of removeKeys) {
        this.keyedItems[removeKey] = null;
        this.keyedElements[removeKey] = null;
      }
      if (this.props.items.length > newProps.items.length) {
        newState.items.splice(
          newProps.items.length,
          this.props.items.length - newProps.items.length
        );
      }
      this.setState(newState);
    }
  }

  shouldComponentUpdate(newProps, newState) {
    return (
      this.props !== newProps && this.props.items === newProps.items ||
      this.state.items !== newState.items
    );
  }

  renderItem(
    item, index, items,
    map = this.props.children,
    itemKey = this.props.itemKey
  ) {
    return <BatchItem key={itemKey(item)} item={item}>{map(item)}</BatchItem>;
  }

  render() {
    const children = this.state.items;
    const props = this.props;
    const Tag = props.component || 'div';
    return (<Tag {...props}>{children}</Tag>);
  }
}

Batch.propTypes = {
  items: React.PropTypes.array,
  itemKey: React.PropTypes.func.isRequired,
  children: React.PropTypes.func.isRequired,
};

class BatchItem extends Component {
  shouldComponentUpdate(newProps) {
    return (this.props.item !== newProps.item);
  }

  render() {
    return Children.only(this.props.children);
  }
}

BatchItem.propTypes = {
  item: React.PropTypes.any,
  children: React.PropTypes.element,
};
