#!/usr/bin/env node
'use strict';

const meow = require('meow');
const updateNotifier = require('update-notifier');
const { transfer } = require('../lib/transfer');
const pkg = require('../package.json');

const notifier = updateNotifier({
  pkg,
  updateCheckInterval: 1000 * 60 * 60 * 24, // 1 day
});

notifier.notify();

const cli = meow(
  `
  Note: Uploaded files will be available for 1 day only

  Usage
    $ transfer-now <command> <options>

  Options
    --targetDir, -t       The directory where you want to save the file (only available when using 'transfer-now get')
    --targetFilename, -n  The filename by which you want to save the file. Original file extension is preserved (only available when using 'transfer-now get')
    --silent, -s          Don't produce any output

  Commands
    put <input>           Upload a file. Example: transfer-now put ./README.md
    get <unique_name>     Download a file. Example: transfer-now get daily_tomato_orangutan
    list                  List all the files uploaded by you. Example: transfer-now list
    link <unique_name>    Generate a one-time download link for a file. Example: transfer-now link daily_tomato_orangutan

  Short Commands
    ls                    Short for 'list'. Example: transfer-now ls
  Examples
    $ transfer-now put ./README.md
    $ transfer-now put ./README.md --silent
    $ transfer-now get daily_tomato_orangutan -t ./tmp -n tomato
`,
  {
    flags: {
      silent: {
        type: 'boolean',
        alias: 's',
      },
      help: {
        type: 'boolean',
        alias: 'h',
      },
      version: {
        type: 'boolean',
        alias: 'v',
      },
      targetDir: {
        type: 'string',
        alias: 't',
      },
      targetFilename: {
        type: 'string',
        alias: 'n',
      },
    },
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
