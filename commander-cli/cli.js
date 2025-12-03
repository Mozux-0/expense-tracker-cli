#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

// ========== MODULAR STRUCTURE ==========

class ExpenseRepository {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async load() {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return this.initializeFile();
      }
      throw new Error(`Failed to load expenses: ${error.message}`);
    }
  }

  async initializeFile() {
    const initialData = {
      count: 0,
      total: 0,
      expenses: [],
      nextId: 1  // Use sequential ID that doesn't change
    };
    await this.save(initialData);
    return initialData;
  }

  async save(data) {
    try {
      await fs.writeFile(
        this.filePath, 
        JSON.stringify(data, null, 2), 
        'utf-8'
      );
    } catch (error) {
      throw new Error(`Failed to save expenses: ${error.message}`);
    }
  }
}

class ExpenseService {
  constructor(repository) {
    this.repository = repository;
  }

  async addExpense(description, amount) {
    if (!description?.trim()) {
      throw new Error('Description is required');
    }
    
    if (isNaN(amount) || Number(amount) <= 0) {
      throw new Error('Amount must be a positive number');
    }

    const data = await this.repository.load();
    const expense = {
      id: data.nextId++,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      description: description.trim(),
      amount: parseFloat(Number(amount).toFixed(2))
    };

    data.expenses.push(expense);
    data.total = parseFloat((data.total + expense.amount).toFixed(2));
    data.count = data.expenses.length;

    await this.repository.save(data);
    return expense;
  }

  async updateExpense(id, updates) {
    const data = await this.repository.load();
    const index = data.expenses.findIndex(e => e.id === parseInt(id));
    
    if (index === -1) {
      throw new Error(`Expense with ID ${id} not found`);
    }

    const expense = data.expenses[index];
    
    // Update amount if provided
    if (updates.amount !== undefined) {
      const newAmount = parseFloat(Number(updates.amount).toFixed(2));
      data.total = parseFloat((data.total - expense.amount + newAmount).toFixed(2));
      expense.amount = newAmount;
    }
    
    // Update description if provided
    if (updates.description !== undefined) {
      if (!updates.description.trim()) {
        throw new Error('Description cannot be empty');
      }
      expense.description = updates.description.trim();
    }

    await this.repository.save(data);
    return expense;
  }

  async deleteExpense(id) {
    const data = await this.repository.load();
    const index = data.expenses.findIndex(e => e.id === parseInt(id));
    
    if (index === -1) {
      throw new Error(`Expense with ID ${id} not found`);
    }

    const expense = data.expenses[index];
    data.expenses.splice(index, 1);
    data.total = parseFloat((data.total - expense.amount).toFixed(2));
    data.count = data.expenses.length;
    // Note: We don't decrement nextId or change other IDs

    await this.repository.save(data);
    return expense;
  }

  async getExpenses(filter = {}) {
    const data = await this.repository.load();
    
    if (filter.month) {
      const month = parseInt(filter.month);
      if (month < 1 || month > 12) {
        throw new Error('Month must be between 1 and 12');
      }
      
      return data.expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() + 1 === month;
      });
    }

    return data.expenses;
  }

  async getSummary(month = null) {
    const expenses = month ? await this.getExpenses({ month }) : await this.getExpenses();
    
    return {
      total: parseFloat(expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)),
      count: expenses.length,
      month: month ? this.getMonthName(month) : null
    };
  }

  getMonthName(monthNumber) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1];
  }
}

// ========== CLI PRESENTATION LAYER ==========

class ExpenseCLI {
  constructor(service) {
    this.service = service;
    this.program = new Command();
    this.setupCommands();
  }

  setupCommands() {
    this.program
      .name('expense-tracker')
      .description('A simple expense tracker CLI application')
      .version('1.0.0');

    // Add command
    this.program
      .command('add')
      .description('Add a new expense')
      .requiredOption('-d, --description <description>', 'Expense description')
      .requiredOption('-a, --amount <amount>', 'Expense amount')
      .action(this.handleAdd.bind(this));

    // Update command (MISSING IN YOUR IMPLEMENTATION)
    this.program
      .command('update')
      .description('Update an existing expense')
      .requiredOption('--id <id>', 'Expense ID')
      .option('-d, --description <description>', 'New description')
      .option('-a, --amount <amount>', 'New amount')
      .action(this.handleUpdate.bind(this));

    // List command
    this.program
      .command('list')
      .description('List all expenses')
      .option('-m, --month <month>', 'Filter by month (1-12)')
      .action(this.handleList.bind(this));

    // Summary command
    this.program
      .command('summary')
      .description('Show expense summary')
      .option('-m, --month <month>', 'Filter by month (1-12)')
      .action(this.handleSummary.bind(this));

    // Delete command
    this.program
      .command('delete')
      .description('Delete an expense')
      .requiredOption('--id <id>', 'Expense ID')
      .action(this.handleDelete.bind(this));
  }

  async handleAdd(options) {
    try {
      const expense = await this.service.addExpense(options.description, options.amount);
      console.log(chalk.green(`✓ Expense added successfully (ID: ${expense.id})`));
    } catch (error) {
      console.error(chalk.red(`✗ Error: ${error.message}`));
      process.exit(1);
    }
  }

  async handleList(options) {
    try {
      const expenses = await this.service.getExpenses({ month: options.month });
      
      if (expenses.length === 0) {
        console.log(chalk.yellow('No expenses found'));
        return;
      }

      console.log(chalk.cyan.bold('ID    Date       Description                Amount'));
      console.log(chalk.cyan.bold('---------------------------------------------------'));
      
      expenses.forEach(expense => {
        console.log(
          chalk.white(`${expense.id.toString().padEnd(4)} `) +
          chalk.gray(`${expense.date} `) +
          chalk.white(`${expense.description.padEnd(25)} `) +
          chalk.green(`$${expense.amount.toFixed(2)}`)
        );
      });
    } catch (error) {
      console.error(chalk.red(`✗ Error: ${error.message}`));
      process.exit(1);
    }
  }

  async handleSummary(options) {
    try {
      const summary = await this.service.getSummary(options.month);
      
      const title = summary.month 
        ? `Total expenses for ${summary.month}:` 
        : 'Total expenses:';
      
      console.log(chalk.cyan.bold(title));
      console.log(chalk.green.bold(`  $${summary.total.toFixed(2)}`));
      console.log(chalk.gray(`  (${summary.count} expense${summary.count !== 1 ? 's' : ''})`));
    } catch (error) {
      console.error(chalk.red(`✗ Error: ${error.message}`));
      process.exit(1);
    }
  }

  async handleDelete(options) {
    try {
      const expense = await this.service.deleteExpense(options.id);
      console.log(chalk.green(`✓ Expense deleted successfully (ID: ${expense.id})`));
    } catch (error) {
      console.error(chalk.red(`✗ Error: ${error.message}`));
      process.exit(1);
    }
  }

  run() {
    this.program.parse();
  }
}

// ========== APPLICATION ENTRY POINT ==========

async function main() {
  const filePath = path.join(process.cwd(), 'expenses.json');
  const repository = new ExpenseRepository(filePath);
  const service = new ExpenseService(repository);
  const cli = new ExpenseCLI(service);

  cli.run();
}

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(chalk.red(`✗ Unexpected error: ${error.message}`));
  process.exit(1);
});

main().catch(error => {
  console.error(chalk.red(`✗ Fatal error: ${error.message}`));
  process.exit(1);
});