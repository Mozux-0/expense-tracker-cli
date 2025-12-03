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
  .command('add')
  .description('Add new expenses')
  .option('--description <description>', 'specify the description')
  .option('--amount <amounts>', 'specify the expense amount')
  .action((options) => {
    arr.count = arr.count + 1;
    arr.total = arr.total + Number(options.amount);

    arr.expenses.push({ ID: arr.count, Date: new Date().toLocaleDateString(), Description: options.description, Amount: options.amount });
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
  .option('--month <month>', 'specify the month')
  .action((month) => {
    if (Object.keys(month).length != 0) {
      let total_expenses = 0;
      let num = Number(month.month);

      arr.expenses.forEach((item) => {
        if (Number(item.Date.split("/")[0]) === num) {
          total_expenses += Number(item.Amount);
        };
      })

      let mon = "January";
      switch (num) {
        case 1:
          mon = "January";
          break;
        case 2:
          mon = "February";
          break;
        case 3:
          mon = "March";
          break;
        case 4:
          mon = "April";
          break;
        case 5:
          mon = "May";
          break;
        case 6:
          mon = "June";
          break;
        case 7:
          mon = "July";
          break;
        case 8:
          mon = "August";
          break;
        case 9:
          mon = "September"
          break;
        case 10:
          mon = "October"
          break;
        case 11:
          mon = "November"
          break;
        case 12:
          mon = "December"
          break;
      };
      console.log(`Total expenses for ${ mon }: $${ total_expenses }`);
    } else console.log(chalk.green(`Total expenses: $${ arr.total }`));
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