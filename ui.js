// ui.js

import blessed from 'blessed';
import chalk from 'chalk';
import dayjs from 'dayjs';
import db from './db.js';

const screen = blessed.screen({
  smartCSR: true,
  title: 'Todo Board',
});

let currentDate = dayjs().format('YYYY-MM-DD');
let todos = [];
let itemToTodo = []; // Mapping from list items to todos

// Variables for move mode
let moveMode = false;
let moveItemIndex = null; // Index of the item being moved

// Create a box to display the current date
const dateBox = blessed.box({
  parent: screen,
  top: 0,
  left: 'center',
  width: 'shrink',
  height: 1,
  content: getCurrentDateContent(),
  style: {
    fg: 'white',
    bold: true,
  },
});

const todoList = blessed.list({
  parent: screen,
  top: 2,
  left: 0,
  width: '100%',
  height: '75%',
  keys: true,
  interactive: true,
  style: {
    selected: {
      bg: 'blue',
    },
  },
  items: [],
  tags: true, // Enable tags for item content
});

const instructions = blessed.box({
  parent: screen,
  bottom: 0,
  height: 3,
  content:
    'Up/Down: Navigate | Enter: Select/Move | Left/Right: Change Day | Ctrl+a: Add | Ctrl+d: Delete | Ctrl+u: Update | Ctrl+x: Complete/Incomplete | Ctrl+q: Quit',
  tags: true,
});

function updateInstructions() {
  if (moveMode) {
    instructions.setContent(
      'Move Mode: Up/Down to move item, Enter to confirm position | Ctrl+q: Quit'
    );
  } else {
    instructions.setContent(
      'Up/Down: Navigate | Enter: Select/Move | Left/Right: Change Day | Ctrl+a: Add | Ctrl+d: Delete | Ctrl+u: Update | Ctrl+x: Complete/Incomplete | Ctrl+q: Quit'
    );
  }
  screen.render();
}

function loadTodos(date, selectedIndex = null) {
  db.all('SELECT * FROM todos WHERE date = ? ORDER BY position', [date], (err, rows) => {
    if (err) throw err;
    todos = rows;
    const activeTodos = rows.filter((todo) => !todo.completed);
    const completedTodos = rows.filter((todo) => todo.completed);

    const items = [];
    itemToTodo = []; // Reset the mapping

    // Handle active todos
    activeTodos.forEach((todo, index) => {
      let content = todo.content;
      if (moveMode && moveItemIndex === index) {
        content = `{inverse}${content}{/inverse}`; // Highlight the item being moved
      }
      items.push(content);
      itemToTodo.push(todo);
    });

    // Add separator if there are completed todos
    if (completedTodos.length > 0) {
      items.push('--- Completed Items ---');
      itemToTodo.push(null); // No todo corresponds to the separator
    }

    // Handle completed todos
    completedTodos.forEach((todo, index) => {
      let content = chalk.strikethrough(chalk.gray(todo.content));
      if (moveMode && moveItemIndex === activeTodos.length + 1 + index) {
        content = `{inverse}${content}{/inverse}`; // Highlight the item being moved
      }
      items.push(content);
      itemToTodo.push(todo);
    });

    todoList.setItems(items);
    dateBox.setContent(getCurrentDateContent()); // Update the date display

    // Keep the selection on the current index
    if (selectedIndex !== null && selectedIndex >= 0 && selectedIndex < itemToTodo.length) {
      todoList.select(selectedIndex);
    } else {
      todoList.select(0);
    }

    todoList.focus(); // Ensure the todoList has focus
    screen.render();
  });
}

// Function to get the content for the current date, including days difference
function getCurrentDateContent() {
  const today = dayjs().format('YYYY-MM-DD');
  const difference = dayjs(currentDate).diff(today, 'day');
  const differenceStr =
    difference === 0 ? '(0)' : difference > 0 ? `(+${difference})` : `(${difference})`;
  return `Current Date: ${currentDate} ${differenceStr}`;
}

// Load todos for the current date
loadTodos(currentDate);

// Add a new todo (Ctrl+a)
screen.key(['C-a'], () => {
  if (moveMode) return; // Disable adding while in move mode

  const inputBox = blessed.textbox({
    parent: screen,
    width: '50%',
    height: 3,
    top: 'center',
    left: 'center',
    border: {
      type: 'line',
    },
    style: {
      border: {
        fg: 'yellow',
      },
    },
    label: ' Enter new todo ',
    inputOnFocus: true, // Allows the textbox to accept input immediately
  });

  inputBox.on('submit', (value) => {
    if (value.trim() !== '') {
      db.run(
        'INSERT INTO todos (content, date, position) VALUES (?, ?, ?)',
        [value, currentDate, todos.length],
        () => loadTodos(currentDate)
      );
    }
    inputBox.detach(); // Remove the input box from the screen
    todoList.focus(); // Refocus on the todoList
    screen.render();
  });

  inputBox.key(['escape'], () => {
    inputBox.detach();
    todoList.focus(); // Refocus on the todoList
    screen.render();
  });

  screen.append(inputBox);
  inputBox.focus(); // Focus on the input box to enable typing
  screen.render();
});

// Delete a todo (Ctrl+d)
screen.key(['C-d'], () => {
  if (moveMode) return; // Disable deleting while in move mode

  const index = todoList.selected;
  const todo = itemToTodo[index];
  if (todo) {
    // Create a modal box for confirmation
    const confirmBox = blessed.box({
      parent: screen,
      width: '50%',
      height: 'shrink',
      top: 'center',
      left: 'center',
      border: {
        type: 'line',
      },
      style: {
        border: {
          fg: 'yellow',
        },
      },
      content: 'Delete this todo? (y/n)',
    });

    // Register key handlers for yes/no confirmation
    const confirmHandler = (ch, key) => {
      if (key.name === 'y') {
        db.run('DELETE FROM todos WHERE id = ?', [todo.id], () => loadTodos(currentDate, index));
      }
      confirmBox.detach(); // Remove the confirm box from the screen
      screen.unkey(['y', 'n'], confirmHandler); // Unregister key handlers
      todoList.focus(); // Refocus on the todoList
      screen.render();
    };

    screen.key(['y', 'n'], confirmHandler);

    screen.append(confirmBox); // Append the confirmation box to the screen
    screen.render(); // Render the updated screen with the confirmation box
  }
});

// Update a todo (Ctrl+u)
screen.key(['C-u'], () => {
  if (moveMode) return; // Disable updating while in move mode

  const index = todoList.selected;
  const todo = itemToTodo[index];
  if (todo) {
    const inputBox = blessed.textbox({
      parent: screen,
      width: '50%',
      height: 3,
      top: 'center',
      left: 'center',
      border: {
        type: 'line',
      },
      style: {
        border: {
          fg: 'yellow',
        },
      },
      label: ' Update todo ',
      value: todo.content,
      inputOnFocus: true,
    });

    inputBox.on('submit', (value) => {
      if (value.trim() !== '') {
        db.run('UPDATE todos SET content = ? WHERE id = ?', [value, todo.id], () =>
          loadTodos(currentDate, index)
        );
      }
      inputBox.detach(); // Remove the input box from the screen
      todoList.focus(); // Refocus on the todoList
      screen.render();
    });

    inputBox.key(['escape'], () => {
      inputBox.detach();
      todoList.focus(); // Refocus on the todoList
      screen.render();
    });

    screen.append(inputBox);
    inputBox.focus(); // Focus on the input box to enable typing
    screen.render();
  }
});

// Mark todo as complete/incomplete (Ctrl+x)
screen.key(['C-x'], () => {
  if (moveMode) return; // Disable toggling complete while in move mode

  const index = todoList.selected;
  const todo = itemToTodo[index];
  if (todo) {
    const newStatus = todo.completed ? 0 : 1;
    db.run('UPDATE todos SET completed = ? WHERE id = ?', [newStatus, todo.id], () => {
      loadTodos(currentDate, index);
    });
  }
});

// Quit the application (Ctrl+q)
screen.key(['C-q'], () => process.exit(0));

// Go to the next day (Right arrow key)
screen.key(['right'], () => {
  if (moveMode) return; // Disable changing day while in move mode

  currentDate = dayjs(currentDate).add(1, 'day').format('YYYY-MM-DD');
  loadTodos(currentDate);
});

// Go to the previous day (Left arrow key)
screen.key(['left'], () => {
  if (moveMode) return; // Disable changing day while in move mode

  currentDate = dayjs(currentDate).subtract(1, 'day').format('YYYY-MM-DD');
  loadTodos(currentDate);
});

// Enter or exit move mode (Enter key)
todoList.key(['enter'], () => {
  const index = todoList.selected;
  const todo = itemToTodo[index];

  if (!todo) return false; // Can't select separator

  if (!moveMode) {
    // Enter move mode
    moveMode = true;
    moveItemIndex = index;
    updateInstructions();
    loadTodos(currentDate, moveItemIndex); // Reload to highlight the item being moved
  } else {
    // Exit move mode
    moveMode = false;
    updateInstructions();
    let pending = 0;
    itemToTodo.forEach((todo, index) => {
      if (todo) {
        pending++;
        db.run('UPDATE todos SET position = ? WHERE id = ?', [index, todo.id], (err) => {
          if (err) {
            console.error('Error updating position:', err);
          }
          pending--;
          if (pending === 0) {
            loadTodos(currentDate);
          }
        });
      }
    });
  }
  return false; // Prevent default behavior
});

// Handle Up/Down keys for moving items in move mode
todoList.key(['up', 'down'], (ch, key) => {
  if (moveMode) {
    moveItem(key.name);
    return false; // Prevent default behavior
  }
  // When not in move mode, do not override up/down keys
});

function moveItem(direction) {
  if (moveItemIndex === null) return;

  const currentIndex = moveItemIndex;
  let targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  // Check boundaries
  if (targetIndex < 0 || targetIndex >= itemToTodo.length) return;

  // Can't move past separator
  if (itemToTodo[targetIndex] === null) return;

  // Get the todos at the current and target indices
  const movingTodo = itemToTodo[currentIndex];
  const targetTodo = itemToTodo[targetIndex];

  // Ensure the todos are defined
  if (!movingTodo || !targetTodo) return;

  // Prevent moving across active/completed boundary
  if (movingTodo.completed !== targetTodo.completed) return;

  // Swap items in itemToTodo
  [itemToTodo[currentIndex], itemToTodo[targetIndex]] = [
    itemToTodo[targetIndex],
    itemToTodo[currentIndex],
  ];

  // Update moveItemIndex to new position
  moveItemIndex = targetIndex;

  // Update the displayed list
  updateDisplayedList();
}

function updateDisplayedList() {
  const items = itemToTodo.map((todo, index) => {
    if (todo === null) {
      return '--- Completed Items ---';
    } else {
      let content = todo.content;
      if (todo.completed) {
        content = chalk.strikethrough(chalk.gray(content));
      }
      if (moveMode && moveItemIndex === index) {
        content = `{inverse}${content}{/inverse}`; // Highlight the item being moved
      }
      return content;
    }
  });

  todoList.setItems(items);
  todoList.select(moveItemIndex);
  screen.render();
}

export default function runUI() {
  // Only needed for starting the screen; all rendering is handled in response to user actions
  screen.render();
}
