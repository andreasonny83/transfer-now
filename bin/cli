#!/usr/bin/env node
'use strict';

const meow = require('meow');
const transfer = require('../lib/transfer');

const cli = meow(
  `
  Usage
    $ transfer put <input>
    $ transfer get <file_short_name>

  Options
    --rainbow, -r  Include a rainbow

  Examples
    $ transfer put ./README.md
    $ transfer get daily_tomato_orangutan
`,
  {
    flags: {
      rainbow: {
        type: 'boolean',
        alias: 'r'
      },
      help: {
        type: 'boolean',
        alias: 'h'
      },
      version: {
        type: 'boolean',
        alias: 'v'
      },
      get: {
        type: 'boolean',
        alias: 'g'
      }
    }
  }
);

(async () => {
  if (cli.flags.version) {
    return cli.showVersion();
  }
  if (cli.flags.help) {
    return cli.showHelp();
  }

  transfer(cli.input[0], cli.input[1], cli.flags);
})();
