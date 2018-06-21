import {h, Component} from 'preact';

class Row extends Component {
  render({rect, index, path, highlight, selectRect}) {
    return (
      <div
        onClick={e => e.target === this.base && selectRect()}
        style={{background: highlight ? '#ccc' : ''}}>
        {rect.name || index}
        <div style={{paddingLeft: '1em'}}>
          {rect.children.map((child, index) => (
            <Row key={index} rect={child} index={index} path={path[0] === index ? path.slice(1) : []} highlight={path.length === 1 && path[0] === index} selectRect={selectRect.bind(null, index)} />
          ))}
        </div>
      </div>
    )
  }
}

class Root extends Component {
  render({rect, path, selectRect}) {
    return (
      <div
        onClick={e => e.target === this.base && selectRect()}
        onCopy={event => event.clipboardData.setData('text/plain', JSON.stringify(rect))}>
        {rect.name || 'root'}
        <div style={{paddingLeft: '1em'}}>
          {rect.children.map((child, index) => (
            <Row key={index} rect={child} index={index} path={path[0] === index ? path.slice(1) : []} highlight={path.length === 1 && path[0] === index} selectRect={selectRect.bind(null, index)} />
          ))}
        </div>
      </div>
    );
  }
}

class RectHierarchy extends Component {
  render({rect, path, pasteMode, changePasteMode, resetRect, selectRect}) {
    return (
      <div>
        <div onClick={resetRect}>Reset</div>
        <div onClick={changePasteMode}>Mode: Copy / {pasteMode === 'paste' ? 'Paste' : 'Overwrite'}</div>
        <Root rect={rect} path={path} selectRect={selectRect} />
      </div>
    );
  }
}

export default RectHierarchy;
