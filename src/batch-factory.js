import React, {Children, Component} from 'react';

import Batch from './batch';

/**
 * BatchFactory
 *
 * Common and useful optimization over a batch of elements reducing
 * object creation.
 *
 * Make sure to localize all data an item under this component needs to be
 * represented is in its member of the passed array. As long as that is true
 * this optimization won't get in the way.
 *
 * ```js
 * <BatchFactory items={arrayOfItems} itemKey={item => item.key}>{(
 *   batchItems => <Batch items={batchItems} itemKey={item => item.key}>{(
 *     item => <ItemComponent item={item} />
 *   )}</Batch>
 * )}</BatchFactory>
 * ```
 */
export default class BatchFactory extends Component {
  constructor(...args) {
    super(...args);

    this.state = {
      subbatchs: [],
    };

    this.subbatchMax = this.props.batchMax || 16;
    let subbatch = 0;
    (this.props.items || []).forEach((item, index, items) => {
      if (
        this.state.subbatchs[subbatch] &&
        this.state.subbatchs[subbatch].length >= this.subbatchMax
      ) {
        subbatch += 1;
      }
      if (!this.state.subbatchs[subbatch]) {
        this.state.subbatchs[subbatch] = [];
      }
      const subbatchIndex = this.state.subbatchs[subbatch].length;
      this.state.subbatchs[subbatch][subbatchIndex] = item;
    });

    this.renderBatch = this.renderBatch.bind(this);
  }

  componentWillReceiveProps(newProps) {
    if (this.props !== newProps) {
      const newState = {
        subbatchs: this.state.subbatchs.slice(),
      };
      const newItems = newProps.items || [];
      const keyGetter = newProps.itemKey || (item => item.key);
      let b = 0;
      let i = 0;
      let bStart = 0;
      let bDiff = 0;

      if (newState.subbatchs.length === 0 && newItems.length > 0) {
        newState.subbatchs.push([]);
      }

      for (; b < newState.subbatchs.length; b++) {
        let batch = newState.subbatchs[b];
        // Remove, add, and update items
        for (; i < bStart + batch.length && i < newItems.length; i++) {
          const bi = i - bStart;
          const newItem = newItems[i];
          if (batch[bi] === newItem) {continue;}
          // If the batch matches an old batch we need to create a new one we
          // can modify. We add a difference to the batch index in case batches
          // were removed or added.
          if (batch === this.state.subbatchs[b + bDiff]) {
            batch = newState.subbatchs[b] = this.state.subbatchs[b + bDiff].slice();
            batch.key = this.state.subbatchs[b + bDiff].key;
          }

          const key = keyGetter(newItem);
          if (key) {
            let oldItemStill = false;
            let oldItemIndex = -1;
            for (let bii = bi; bii < batch.length; bii++) {
              if (batch[bii] && batch[bii].key === key) {
                oldItemStill = true;
                oldItemIndex = bii;
                break;
              }
            }
            if (oldItemStill) {
              // Update
              if (batch[bi].key && batch[bi].key === key) {
                batch[bi] = newItem;
              }
              // Remove old version, Add new version
              else {
                if (oldItemIndex >= 0) {
                  batch.splice(oldItemIndex, 1);
                }
                batch.splice(bi, 0, newItem);
              }
            }
            // Add new item to the array or this batch
            else {
              // Is item in next batch
              const nextBatch = newState.subbatchs[b + 1];
              const inNext = nextBatch && this.findKey(nextBatch, key, keyGetter);
              if (inNext) {
                // If length zero, drop batch entirely.
                if (bi === 0) {
                  newState.subbatchs.splice(b, 1);
                  // Decrement batch index so next loop considers the "next"
                  // batch that has taken the index of the one just dropped.
                  b--;
                  bDiff++;
                }
                // Truncate remaining items in current batch.
                else {
                  batch.splice(bi, batch.length - bi);
                }
              }
              else {
                if (batch.length === this.subbatchMax) {
                  newState.subbatchs.splice(
                    b, 1, batch.slice(0, bi), batch.slice(bi)
                  );
                  newState.subbatchs[b].key = batch.key;
                  batch = newState.subbatchs[b];
                  bDiff--;
                }
                batch.splice(bi, 0, newItem);
              }
            }
          }
          else if (bi < batch.length) {
            batch[bi] = newItem;
          }
          else if (batch.length < this.subbatchMax) {
            batch.push(newItem);
          }
        }

        for (; i < bStart + this.subbatchMax && i < newItems.length; i++) {
          const newItem = newItems[i];
          const key = newItem && keyGetter(newItem);
          const nextBatch = newState.subbatchs[b + 1];
          const inNext = nextBatch && this.findKey(nextBatch, key, keyGetter);
          if (inNext) {
            break;
          }
          if (batch === this.state.subbatchs[b + bDiff]) {
            batch = newState.subbatchs[b] = this.state.subbatchs[b + bDiff].slice();
            batch.key = this.state.subbatchs[b + bDiff].key;
          }
          batch.push(newItem);
        }

        bStart += batch.length;
        if (b === newState.subbatchs.length - 1 && i < newItems.length) {
          newState.subbatchs.push([]);
        }
      }

      while (bStart > newItems.length) {
        let batch = newState.subbatchs[b - 1];
        if (batch === this.state.subbatchs[b - 1 + bDiff]) {
          batch = newState.subbatchs[b - 1] = this.state.subbatchs[b - 1 + bDiff].slice();
          batch.key = this.state.subbatchs[b - 1 + bDiff].key;
        }
        batch.pop();
        bStart--;
      }

      if (i === newItems.length && b < newState.subbatchs.length) {
        newState.subbatchs.splice(b, newState.subbatchs.length - b);
      }

      this.setState({
        subbatchs: newState.subbatchs,
      });
    }
  }

  shouldComponentUpdate(newProps, newState) {
    return (
      this.props !== newProps && this.props.items === newProps.items ||
      this.state.subbatchs !== newState.subbatchs
    );
  }

  genBatchId() {
    return Math.random().toString(16).substring(2);
  }

  findKey(batch, key, keyGetter) {
    return batch.reduce((carry, item, index) => {
      if (item && keyGetter(item) === key) {
        return true;
      }
      return carry;
    }, false);
  }

  renderBatch(batch) {
    const batchEl = this.props.children(batch);
    return <BatchItem key={batch.key} item={batch}>{batchEl}</BatchItem>;
  }

  batchKey(item) {
    return item.key;
  }

  render() {
    const batches = this.state.subbatchs;
    for (let i = 0; i < batches.length; i++) {
      if (!batches[i].key) {
        batches[i].key = this.genBatchId();
      }
    }
    return (<Batch {...this.props} items={batches} itemKey={this.batchKey}>{
      this.renderBatch
    }</Batch>);
  }
}

BatchFactory.propTypes = {
  batchMax: React.PropTypes.number,
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
  children: React.PropTypes.any,
};
