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
  .command('add <DESCRIPTION> <AMOUNT>')
  .description('Add new expenses')
  .action((DESCRIPTION, AMOUNT) => {
    arr.count = arr.count + 1;
    arr.total = arr.total + Number(AMOUNT);

    arr.expenses.push({ ID: arr.count, Date: new Date().toLocaleDateString(), DESCRIPTION: DESCRIPTION, Amount: AMOUNT });
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
  .description('Show the total expenses')
  .action(() => {
    console.log(chalk.green(`Total expenses: $${ arr.total }`));
  })
program
  .command('delete <ID>')
  .description('Delete the expense by ID')
  .action((ID) => {
    if (ID > arr.count || ID <= 0) {
      console.log(`Please input a valid ID below ${ arr.count }`);
    } else {
      arr.total = arr.total - Number(arr.expenses[ ID - 1 ].Amount); 
      arr.expenses.splice(ID - 1, 1);

      arr.expenses.forEach((item, i) => {
        item.ID = i + 1;
      })

      arr.count = arr.expenses.length;

      fs.writeFileSync(filePath, JSON.stringify(arr, null, 2), 'utf-8');
      console.log(chalk.green(`Expense deleted successfully`));
    };
  })

program.parse()