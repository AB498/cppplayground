// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const child_process = require("child_process");
const path = require("path");

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */

let is_enabled = true;

function activate(context) {
  vscode.window.showInformationMessage("Hello World from cppplayground!");

  // Register the onDidChangeTextDocument event listener
  vscode.workspace.onDidChangeTextDocument((event) => {
    const editor = vscode.window.activeTextEditor;
    vscode.window.showInformationMessage(editor.document.getText());
    // Check if the extension is enabled
    if (!is_enabled) {
      return;
    }

    // Get the active text editor
    if (!editor) {
      return;
    }

    // Get the file name and extension
    const file_name = editor.document.fileName;
    const file_ext = path.extname(file_name);
    if (file_ext !== ".cpp") {
      return;
    }

    // Build the command to compile the file
    const cmd = `g++ "${file_name}" -o "${file_name}.exe"`;

    // Execute the command using child_process
    child_process.exec(cmd, (err, stdout, stderr) => {
      if (err) {
        vscode.window.showErrorMessage(`AutoRunCpp: ${stderr}`);
      } else {
        // Execute the compiled file
        const exe_file = `${file_name}.exe`;
        child_process.execFile(exe_file, (err, stdout, stderr) => {
          if (err) {
            vscode.window.showErrorMessage(`AutoRunCpp: ${stderr}`);
          } else {
            vscode.window.showInformationMessage(`AutoRunCpp: ${stdout}`);
          }
        });
      }
    });
  });

  // Register the commands
  const disable_command = vscode.commands.registerCommand(
    "cppplayground.disable",
    () => {
      is_enabled = false;
      vscode.window.showInformationMessage("AutoRunCpp extension disabled");
    }
  );

  const enable_command = vscode.commands.registerCommand(
    "cppplayground.enable",
    () => {
      is_enabled = true;
      vscode.window.showInformationMessage("AutoRunCpp extension enabled");
    }
  );

  // Add the commands to the context
  context.subscriptions.push(disable_command);
  context.subscriptions.push(enable_command);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
