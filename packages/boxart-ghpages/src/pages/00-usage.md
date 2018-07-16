# BoxArt

<a href="refs/">API Documentation</a>

## Usage

BoxArt is a state-ful animate-on-class-change library. It starts an animation when an element it is watching changes its class list. BoxArt currently animates html elements by listening to mutation observer events, React's virtual dom, or Preact's virtual dom.

#### DOM Usage:

```js
const animations = {
  'animatedType': {
    default: // ...
  },
};

new BoxArtMutation({animations})
.observe(document.body);
```

<p class="full"><a class="jsbin-embed" href="https://jsbin.com/bobidus/embed?js,output">JS Bin on jsbin.com</a></p>

#### React/Preact usage:

```
<BoxArt animations={animations}>
  <App />
</BoxArt>
```

<p class="full"><a class="jsbin-embed" href="https://jsbin.com/hireyac/embed?js,output">JS Bin on jsbin.com</a></p>
<script src="https://static.jsbin.com/js/embed.min.js?4.1.4"></script>
