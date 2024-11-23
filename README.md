# Todo Today CLI

A command-line interface (CLI) todo application built with Node.js, featuring an interactive UI, keyboard navigation, and SQLite database for data persistence. This tool allows you to manage daily tasks efficiently from your terminal.

![todo.png](https://github.com/danguenet/todo-today-cli/blob/main/todo.png)

## Features

- **Add, Update, Delete Todos**: Easily manage your tasks with simple keyboard shortcuts.
- **Mark as Complete/Incomplete**: Keep track of completed tasks, which move to a separate section with strikethrough styling.
- **Move Mode for Reordering**: Organize your tasks by entering move mode to reorder items within the list, ensuring active and completed items remain separate.
- **Date Navigation**: View and manage tasks for any date, with the ability to navigate between days.
- **Interactive UI**: Navigate using arrow keys and utilize one-key shortcuts, with a keymap reference displayed within the UI.

## Installation

Since the application is not published to npm, you can set it up by cloning the repository and installing the dependencies.

### Option 1: Run Directly from the Directory

1. **Clone the Repository**

   ```bash
   git clone https://github.com/danguenet/todo-today-cli.git
   ```

2. **Navigate to the Project Directory**

   ```bash
   cd todo-today-cli
   ```

3. **Install Dependencies**

   ```bash
   npm install
   ```

4. **Run the Application**

   ```bash
   npm run start
   ```

### Option 2: Install Globally Using `npm link`

1. **Clone the Repository**

   ```bash
   git clone https://github.com/danguenet/todo-today-cli.git
   ```

2. **Navigate to the Project Directory**

   ```bash
   cd todo-today-cli
   ```

3. **Install Dependencies**

   ```bash
   npm install
   ```

4. **Link the Application Globally**

   ```bash
   npm link
   ```

5. **Run the Application from Anywhere**

   ```bash
   todo-today
   ```

Note that running the command will create the SQLite database in the current directory. npm link can be useful for creating multiple instances, but for a consistent experience, run the command from the same directory each time.

## Usage

Once the application is running, the terminal will display an interactive todo board. Use the following keys to interact with your todos:

### Navigation

- **Up/Down Arrows**: Navigate through todo items.
- **Right Arrow**: Go to the next day.
- **Left Arrow**: Go to the previous day.

### Actions

- **Ctrl+a**: Add a new todo.
- **Ctrl+u**: Update the selected todo.
- **Ctrl+d**: Delete the selected todo (with confirmation).
- **Ctrl+x**: Mark the selected todo as complete/incomplete.
- **Enter**: Enter or exit move mode to reorder the selected todo.
- **Up/Down (in move mode)**: Move the selected item up or down within its section.
- **Ctrl+q**: Quit the application.

## Data Persistence

- **SQLite Database**: All todos are stored in a SQLite database (`todos.db`) located in the project directory.
- **Date-Based Filtering**: Todos are associated with dates, and you can view tasks for any specific day.
- **Completed Tasks**: Completed todos are moved to a separate section at the bottom, displayed with strikethrough formatting.

## Move Mode

- **Enter Move Mode**: Press `Enter` on an item to enter move mode, which allows reordering.
- **Restrictions**: In move mode, the selector cannot move between completed and uncompleted items, ensuring tasks are always organized within their respective sections.
- **Exit Move Mode**: Press `Enter` again to confirm the new position.
