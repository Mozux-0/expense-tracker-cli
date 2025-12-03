#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

// ========== MODULAR STRUCTURE ==========

class ExpensesRepository {
  constructor(filePath) {
    this.filePath = filePath;
  };

  async load () {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      if (err.code === 'ENOENT') {
        return this.initializeFile();
      }
      throw new Error(`Failed to load expenses: ${ err.message }`);
    };
  };

  async initializeFile () {
    const initialData = {
      count: 0,
      nextId: 1,
      total: 0,
      expenses: []
    };
    await this.save(initialData);
    return initialData;
  };

  async save (data) {
    try {
      await fs.writeFile(
        this.filePath,
        JSON.stringify(data, null, 2),
        'utf-8'
      );
    } catch (err) {
      throw new Error(`Failed to save expenses: ${ err.message }`);
    };
  };
};

class ExpenseService {
  constructor (repository) {
    this.repository = repository;
  };

  async addExpenses (description, amount) {
    if (!description?.trim()) throw new Error('Description is required');

    if (isNaN(amount) || Number(amount) <= 0) throw new Error('Amount must be a positive number');

    const data = await this.repository.load();
    const expense = {
      ID: data.nextId++,
      Date: new Date().toLocaleString(),
      Description: description,
      Amount: parseFloat(Number(amount).toFixed(2))
    };

    data.expense.push(expense);
    data.total = parseFloat((data.total + expense.Amount).toFixed(2));
    data.count = data.expense.length;

    await this.repository.save(data);
    return expense;
  };

  async deleteExpense(id) {
    const data = await this.repository.load();
    const index = data.expenses.findIndex(e => e.id === parseInt(id));

    if (index === -1) throw new Error(`Expense with ID ${ id } not found`);

    const expense = data.expense[index];

    data.expense.splice(index, 1);
    data.total = parseFloat((data.total - expense.Amount).toFixed(2));
    data.count = data.expenses.length;

    await this.repository.save(expense);
    return expense;
  };
};




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
  .command('delete')
  .description('Delete the expense by ID')
  .option('--id <id>', 'specify the id')
  .action((option) => {
    var chosenId = option.id;

    if (chosenId > arr.count || chosenId <= 0) {
      console.log(`Please input a valid ID below ${ arr.count }`);
    } else {
      arr.total = arr.total - Number(arr.expenses[ chosenId - 1 ].Amount); 
      arr.expenses.splice(chosenId - 1, 1);

      arr.expenses.forEach((item, i) => {
        item.ID = i + 1;
      })

      arr.count = arr.expenses.length;

      fs.writeFileSync(filePath, JSON.stringify(arr, null, 2), 'utf-8');
      console.log(chalk.green(`Expense deleted successfully`));
    };
  })
program.parse()