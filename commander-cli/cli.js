#!/usr/bin/env node

import { Command } from 'commander';
import { join, dirname } from 'path';
import fs from 'fs';

const program = new Command();

const filePath = 'expenses.json'

const data = fs.readFileSync(filePath, 'utf-8');
let arr = JSON.parse(data);

program
  .name('cli')
  .description('A simple CLI application')
  .version('1.0.0')
program
  .command('add <description> <amount>')
  .description('add new expenses')
  .action((description, amount) => {
    console.log(arr);

    arr.count = arr.count + 1;

    arr.expenses.push({ ID: arr.count, Date: new Date().toLocaleDateString(), Description: description, Amount: `$${ amount }` });
    fs.writeFileSync(filePath, JSON.stringify(arr, null, 2), 'utf-8');

    console.log(`"${ description }" costed $${ amount } has been added with ID ${ arr.count }`);
  })

program.parse()