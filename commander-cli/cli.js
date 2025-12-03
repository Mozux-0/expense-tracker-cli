#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import chalk from 'chalk';

const program = new Command();

const filePath = 'expenses.json'

const data = fs.readFileSync(filePath, 'utf-8');
let arr = JSON.parse(data);

program
  .name('expense-tracker')
  .description('A simple expense tracker CLI application')
  .version('1.0.0')
program
  .command('add <description> <amount>')
  .description('Add new expenses')
  .action((description, amount) => {
    arr.count = arr.count + 1;

    arr.expenses.push({ ID: arr.count, Date: new Date().toLocaleDateString(), Description: description, Amount: `$${ amount }` });
    fs.writeFileSync(filePath, JSON.stringify(arr, null, 2), 'utf-8');

    console.log(chalk.green(`Expense added successfully (ID: ${ arr.count })`));
  })
program
  .command('list')
  .description('Show all the expenses in a list')
  .action(() => {
    console.log(chalk.green(`ID      Date         Description        Amount`));
    arr.expenses.forEach((item, i) => {
      console.log(chalk.green(`${ item.ID }       ${ item.Date }    ${ item.Description }             ${ item.Amount }`));
    })
  })
program
  .command('summary')

program.parse()