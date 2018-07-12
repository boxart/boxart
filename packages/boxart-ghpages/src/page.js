import Remarkable from 'remarkable';
import hljs from 'highlight.js';
import {h, Component} from 'preact';

class Page extends Component {
  // componentDidMount() {
  //   Array.from(this.base.getElementsByTagName('script') || [])
  //   .forEach(script => {
  //     const script2 = document.createElement('script');
  //     script2.src = script.src;
  //     script.parentNode.
  //   });
  // }

  renderString(string) {
    // Actual default values
    var md = new Remarkable({
      html: true,
      highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(lang, str).value;
          } catch (err) {}
        }

        try {
          return hljs.highlightAuto(str).value;
        } catch (err) {}

        return ''; // use external default escaping
      }
    });

    return md.render(string);
  }

  render({page}) {
    return (
      h('div', {dangerouslySetInnerHTML: {__html: this.renderString(page)}})
    );
  }
}

export {Page};
