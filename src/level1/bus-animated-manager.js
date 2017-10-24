class BusAnimatedManager {
  constructor(manager, bus) {
    this.manager = manager;
    this.bus = bus;

    this.stateBegin = bus.bind('state:begin', 3);
    this.stateEnd = bus.bind('state:end', 3);

    bus.on('state:change', this.set.bind(this));
    bus.on('state:destroy', manager.delete.bind(manager));
    bus.on('element:create', manager.setElement.bind(manager));
    bus.on('element:update', manager.setElement.bind(manager));
    bus.on('element:destroy', manager.delete.bind(manager));
  }

  set(type, id, state) {
    const animatedState = this.manager.set(type, id, state);
    this.stateBegin(type, id, state);
    animatedState.resolve = () => this.stateEnd(type, id, state);
  }
}

export default BusAnimatedManager;
