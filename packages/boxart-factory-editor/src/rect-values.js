import {h, Component} from 'preact';

const BoxTypes = require('boxart-factory-preact').default;

class Value extends Component {
  constructor(...args) {
    super(...args);

    this.onUpdate = this.onUpdate.bind(this);
  }

  doUpdate(name, value) {
    this.props.updateValue(name, (this.props.filter || (i => i))(value));
  }

  onUpdate(event) {
    if (event.type === 'blur' || event.which === 13) {
      this.doUpdate(this.props.name, event.target.value);
      if (event.which === 13) {
        this.base.getElementsByTagName('input')[0].blur();
      }
    }
  }

  renderInput({name, value}) {
    const {onUpdate} = this;
    return (
      <input id={`value_${name}`} type="text" value={value} onBlur={onUpdate} onKeyDown={onUpdate} />
    );
  }

  render() {
    const {onUpdate} = this;
    const {name, value} = this.props;
    return (
      <div>
        <label for={`value_${name}`}>{name}</label>
        {this.renderInput(this.props)}
      </div>
    );
  }
}

class TypeDropdown extends Value {
  // doUpdate(name, value) {
  //   const Type = BoxTypes.types[value];
  //   const update
  //   if (Type) {
  //
  //   }
  // }

  renderInput({name, value}) {
    const {onUpdate} = this;
    return (
      <select id={`value_${name}`} onBlur={onUpdate} onKeyDown={onUpdate}>
        <option value={''}>---</option>
        {Object.keys(BoxTypes).map(key => (
          <option value={key} selected={key === value}>{key}</option>
        ))}
      </select>
    );
  }
}

class RectValues extends Component {
  constructor(...args) {
    super(...args);

    this.updateValue = this.updateValue.bind(this);
  }

  updateValue(name, value) {
    console.log(name, value);
    if (['name', 'type', 'x', 'y', 'width', 'height'].includes(name)) {
      this.props.update(this.props.rect.assign({
        [name]: value,
      }));
    }
    else {
      this.props.update(this.props.rect.assign({
        values: Object.assign({}, this.props.rect.values, {
          [name]: value,
        }),
      }));
    }
  }

  render() {
    console.log(this.props.rect);
    const {rect} = this.props;
    const {updateValue} = this;
    return (
      <div>
        <Value updateValue={updateValue} name={'name'} value={rect.name} filter={s => s} />
        <TypeDropdown updateValue={updateValue} name={'type'} value={rect.type} />
        <Value updateValue={updateValue} name={'x'} value={rect.x * 100} filter={n => Number(n) / 100} />
        <Value updateValue={updateValue} name={'y'} value={rect.y * 100} filter={n => Number(n) / 100} />
        <Value updateValue={updateValue} name={'width'} value={rect.width * 100} filter={n => Number(n) / 100} />
        <Value updateValue={updateValue} name={'height'} value={rect.height * 100} filter={n => Number(n) / 100} />
        {Object.keys((BoxTypes[rect.type] || {}).rectTypes || {}).map(key => (
          <Value
            updateValue={updateValue}
            name={key}
            value={(BoxTypes[rect.type].rectTypes[key].edit || (i => i))((rect.values || {})[key])}
            filter={BoxTypes[rect.type].rectTypes[key].filter}
            />
        ))}
      </div>
    );
  }
}

export default RectValues;
