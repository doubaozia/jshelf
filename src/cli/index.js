#!/usr/bin/env node

const program = require('commander');
const packageInfo = require('../../package.json');
const Formater = require('../Formater');

program
  .version(packageInfo.version)
  .option('-f, --file', 'Config Json File')
  .parse(process.argv);

const f = new Formater();
f.init();