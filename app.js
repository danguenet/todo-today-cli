#!/usr/bin/env node

import { Command } from 'commander';
import runUI from './ui.js';

const program = new Command();

program
  .name('todo-today')
  .description('A simple CLI tool for keeping track of daily todos')
  .version('1.0.0');

// Command to explicitly start the application
program
  .command('start')
  .description('Start the todo application')
  .action(() => {
    runUI();
  });

// Command to explicitly stop the application (though not necessary as Ctrl+C can be used)
program
  .command('stop')
  .description('Stop the todo application')
  .action(() => {
    process.exit(0);
  });

// Add a default action to run the UI if no command is given
if (!process.argv.slice(2).length) {
  runUI(); // Start the UI directly
} else {
  program.parse(process.argv);
}
