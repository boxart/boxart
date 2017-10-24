const PatternSearch = require('./pattern-search');

class Matcher {
  constructor() {
    this.patterns = new PatternSearch();
    this.results = {};
    this.idToTypes = {};
    this._match = {
      last: '',
      type: '',
      id: '',
      animation: '',
    };
  }

  add(pattern, animationNames) {
    let [type, id] = pattern.split(' ');
    if (!id) {
      id = type + '*';
    }
    else {
      id = id.replace('{type}', type).replace('{id}', '*');
      if (id.indexOf('*') === -1) {
        id += '*';
      }
    }

    this.patterns.add(type);
    this.patterns.add(id);
    this.idToTypes[id] = type;

    const result = {
      id: new PatternSearch().add(id),
      animationNames,
      hasAnimation: {},
      animations: new PatternSearch(),
    };

    animationNames.forEach(name => {
      result.animations.add(name.replace('{type}', type));
      result.hasAnimation[name] = true;
    });
    result.animations.add(id);

    this.results[type] = result;
  }

  match(str) {
    if (this._match.last === str) {
      return Boolean(this.results[this._match.type]);
    }

    this._match.last = str;
    let name = this._match.type = this.patterns.search(str);
    if (!name) {
      return false;
    }

    let id;
    const typeBegin = this.patterns.begin;
    const typeEnd = this.patterns.end;
    if (name && name.endsWith('*')) {
      id = str.substring(typeBegin, typeEnd);
      name = this.idToTypes[name];
    }

    const result = this.results[name];
    let animationName = result.animations.search(str, typeEnd);
    if (animationName) {
      if (animationName.endsWith('*')) {
        id = str.substring(result.animations.begin, result.animations.end);
        animationName = result.animations.search(str, result.animations.end);
        if (!animationName) {
          animationName = result.animations.search(str, 0, typeBegin);
        }
      }
      else if (!id) {
        if (result.id.search(str, result.animations.end)) {
          id = str.substring(result.id.begin, result.id.end);
        }
        else if (result.id.search(str, 0, typeBegin)) {
          id = str.substring(result.id.begin, result.id.end);
        }
      }
    }
    else {
      animationName = result.animations.search(str, 0, typeBegin);
      if (animationName) {
        if (animationName.endsWith('*')) {
          id = str.substring(result.animations.begin, result.animations.end);
          animationName = result.animations.search(str, result.animations.end, typeBegin);
        }
        else if (!id) {
          if (result.id.search(str, result.animations.end, typeBegin)) {
            id = str.substring(result.id.begin, result.id.end);
          }
        }
      }
      else if (!id) {
        if (result.id.search(str, 0, typeBegin)) {
          id = str.substring(result.id.begin, result.id.end);
        }
      }
    }

    this._match.type = name;
    this._match.animation = animationName || 'default';
    this._match.id = id || name;
    return true;

    // const result = this.results[name];
    // if (result) {
    //   const typeBegin = this.patterns.begin;
    //   const typeEnd = this.patterns.end;
    //   let animationName = result.animations.search(str, typeEnd);
    //   let id;
    //   if (animationName) {
    //     if (animationName.endsWith('*')) {
    //       id = str.substring(result.animations.begin, result.animations.end);
    //       animationName = result.animations.search(str, result.animations.end);
    //       if (!animationName) {
    //         animationName = result.animations.search(str, 0, typeBegin);
    //       }
    //     }
    //     else if (result.id.search(str, result.animations.end)) {
    //       id = str.substring(result.id.begin, result.id.end);
    //     }
    //     else if (result.id.search(str, 0, typeBegin)) {
    //       id = str.substring(result.id.begin, result.id.end);
    //     }
    //   }
    //   else {
    //     animationName = result.animations.search(str, 0, typeBegin);
    //     if (animationName && animationName.endsWith('*')) {
    //       id = str.substring(result.animations.begin, result.animations.end);
    //       animationName = result.animations.search(str, result.animations.end, typeBegin);
    //     }
    //     else if (
    //       animationName &&
    //         result.id.search(str, result.animations.end, typeBegin) ||
    //       !animationName &&
    //         result.id.search(str, 0, typeBegin)
    //     ) {
    //       id = str.substring(result.id.begin, result.id.end);
    //     }
    //   }
    //   this._match.animation = animationName || 'default';
    //   this._match.id = id || name;
    //
    //   // const animationName = result.animations.search(str);
    //   // this._match.animation = animationName;
    //   // let idMatch = result.id.exec(str);
    //   // if (idMatch && idMatch[0] === animationName) {
    //   //   idMatch = result.id.exec(
    //   //     str.substring(idMatch.index + idMatch[0].length)
    //   //   );
    //   // }
    //   // this._match.id = idMatch[0] || name;
    // }
    // else {
    //   this._match.animation = '';
    //   this._match.id = '';
    // }
    // return Boolean(result);
  }

  matchType() {
    return this._match.type;
  }

  matchAnimation() {
    return this._match.animation;
  }

  matchId() {
    return this._match.id;
  }

  matchHasAnimation(name) {
    return this.results[this.matchType()].hasAnimation[name] || false;
  }
}

export default Matcher;
