#!/usr/bin/env node

import { Command } from 'commander';

const program = new Command();

program
  .name('cli')
  .description('A simple CLI application')
  .version('1.0.0')

program.parse()