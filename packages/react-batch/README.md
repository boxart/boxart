# react-batch

Exports [boxart](https://github.com/boxart/boxart)'s Batch and BatchFactory. If using more of BoxArt use boxart-batch instead. Tools for building html games with React.

## usage

`<Batch>` and `<BatchFactory>` make optimization assumptions on passed item arrays so that element creation and re-renders are reduced. If the items passed compared with the last props are through a shallow compare unchanged the underlying react virtual element isn't recreated (saving some time, object creation and garbage collection) and the object won't be re-rendered (saving further time, object creation, and garbage collection).

Their use is to replace mapping an array of data to React elements.

```js
{items.map(item => <ItemComponent item={item} />)}
```

### Batch

Mapping an array is replaced with a Batch component, taking the properties `items`, `itemKey`, `children` and `component`.

- `items` is simply the array whose rendering it is helping to optimize.
- `itemKey` is a required handle to produce a key to represent a member of the items array.
- `children` is our handler for creating components for members of the items array.
- `component` specifies the tag wrapping the rendered items. It defaults to `'div'`.

```js
<Batch items={items} itemKey={item => item.key}>{(
  item => <ItemComponent item={item} />
)}</Batch>
```

Unlike other react components which expect elements as `children` (contents inside the tag), `<Batch>` expects a function to be passed as children as in the example: `<Batch {...batch}>{ item => <ItemComponent {...item} /> }</Batch>`. This function is called whenever Batch renders an item (when the item changes, or is first rendered). Batch does not rebuild the rendered elements if children changes, so its best to not pass a different function to the same batch.

`itemKey` is required to help make the best of `Batch`. Without `itemKey` Batch's implementation would have to recreate every element after any removed elements. With `itemKey` it can instead reuse the non-removed elements as they as stored by that key.

#### Immutability

The array of items to be rendered is expected to be treated as immutable. Unlike .map(), which gets passed an index and the containing array, the children function is only passed the member item itself. It is therefore recommended that the items in the items array contain any and all data needed to render and return the component from Batch's handler, to avoid possible bugs that might be encountered if that handler function depends on data from outer scopes.

### BatchFactory

BatchFactory increases the opportunity for optimization of large arrays by breaking that large array down into smaller arrays. When React is re-rendering, subgrouping the array into smaller components allows React to skip the rendering of any subgroup that did not change. For example if one element within an array of 100 items changed, BatchFactory allows React to diff 23 BatchItem elements instead of the full 100 BatchItem elements that would have to be diffed with a vanilla Batch. (Batch and BatchFactory both wrap each element in an internal BatchItem component which is returned by the children handler: this permits a simple shallow comparison so that elements returned by children do not need a shouldComponentUpdate method.)

How does BatchFactory hand React 23 BatchItems to diff instead of 100? BatchFactory defaults to creating batches of 16. For 100 items that means it makes 6 batches of 16 and 1 of 4. If an item in the first 6 changes React will diff the 7 batches and find one of the six to have changed, that one have 16 children will be diffed to see the item that changed. This leads to 23 elements for React to diff before diffing your specific ItemComponent class instead of the 100 that a single Batch would have.

BatchFactory takes an extra property to Batch, 'batchMax'. All together it takes: `item`, `itemKey`, `batchMax`, `children`, and `component`.

- `items` is simply the array whose rendering it is helping to optimize.
- `itemKey` is a required handle to produce a key to represent a member of the items array.
- `batchMax` is the number of items in the batches BatchFactory produces. It defaults to 16.
- `children` is our handler for creating components for members of the items array.
- `component` specifies the tag wrapping the rendered items. It defaults to `'div'`.

```js
<BatchFactory items={arrayOfItems} itemKey={item => item.key}>{(
  batchItems => <Batch items={batchItems} itemKey={item => item.key}>{(
    item => <ItemComponent item={item} />
  )}</Batch>
)}</BatchFactory>
```

Tuning `batchMax` can further improve optimization with BatchFactory. A good batchMax is relative to the expected size of the items array it'll be given. A larger array may be best subdivided into larger arrays for less macro diffing and more micro diffing. A smaller array may be best subdivided into smaller arrays for more macro diffing and less micro diffing.
