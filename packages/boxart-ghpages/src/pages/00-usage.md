## Usage

BoxArt is a state-ful animate-on-class-change library. It starts an animation when an element it is watching changes its class list. BoxArt currently animates html elements by listening to mutation observer events, React's virtual dom, or Preact's virtual dom.

#### DOM Usage:

```
const animations = {
  'animated': {
    default: commonAnimations.rectangle,
  },
};

new BoxArtMutation({animations})
.observe(document.body);
```

#### React/Preact usage:

```
<BoxArt animations={animations}>
  <App />
</BoxArt>
```

<a class="jsbin-embed" href="https://jsbin.com/bobidus/embed?js,output">JS Bin on jsbin.com</a>
<script src="https://static.jsbin.com/js/embed.min.js?4.1.4"></script>
