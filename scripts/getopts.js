const getopts = function* (argv = process.argv.slice(2)) {
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--') {
      break;
    }
    else if (argv[i].startsWith('--')) {
      if (argv[i + 1] && !argv[i + 1].startsWith('-')) {
        yield [argv[i].substring(2), argv[i + 1]];
        i += 1;
      }
      else {
        yield [argv[i].substring(2), null];
      }
    }
    else if (argv[i].startsWith('-')) {
      if (argv[i + 1] && !argv[i + 1].startsWith('-')) {
        yield [argv[i].substring(1), argv[i + 1]];
        i += 1;
      }
      else {
        yield [argv[i].substring(1), null];
      }
    }
    else {
      break;
    }
  }
};

getopts.rest = function(argv = process.argv.slice(2)) {
  let i = 0;
  for (const pair of getopts(argv)) {
    i += 1;
  }
  return argv.slice(i);
};

module.exports = {
  getopts,
};
