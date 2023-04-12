// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const child_process = require("child_process");
const path = require("path");
const fs = require("fs");

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */

let is_enabled = true;
let linesAdded = {};
let decText = "int";
function activate(context) {
  vscode.window.showInformationMessage("Hello World from cppplayground!");

  // Register the onDidChangeTextDocument event listener
  vscode.workspace.onDidChangeTextDocument((event) => {
    const editor = vscode.window.activeTextEditor;

    // for eaech line in the document

    for (let i = 0; i < editor.document.lineCount; i++) {
      setTextAtLine(editor, i, editor.document.lineAt(i).text);
      // editor.selection.start.line;
    }

    // Check if the extension is enabled
    if (!is_enabled) {
      return;
    }

    // Get the active text editor
    if (!editor) {
      return;
    }

    const file_name = editor.document.fileName;
    const directory = path.dirname(file_name);
    console.log(file_name);
    const file_ext = path.extname(file_name);
    if (file_ext !== ".cpp") {
      return;
    }
    let lines = [];
    //get filename without extension absolute path
    const file_name_without_ext = path.join(
      directory,
      path.basename(file_name, file_ext)
    );
    console.log(file_name_without_ext);
    for (let i = 0; i < editor.document.lineCount; i++) {
      // if outputable line then wrap it in printf
      // else just add the line
      const stringsToCheck = [
        "=",
        "cin",
        "cout",
        "printf",
        "scanf",
        "<<",
        ">>",
      ];
      const regex = new RegExp(stringsToCheck.join("|"));
      const convertible = !regex.test(string1);

      if (editor.document.lineAt(i).text.includes("//") && convertible) {
        let varname = "os_" + i;
        lines.push(
          `std::ostringstream ${varname}; ${varname} << ` +
            editor.document.lineAt(i).text +
            `
			printf("%s", ${varname}.str().c_str());`
        );
      } else lines.push(editor.document.lineAt(i).text);
    }
    // join lines
    const text =
      `#include <string>
	  #include <sstream>
	` + lines.join("\n");

    fs.writeFileSync(file_name_without_ext + "_tmp.cpp", text, function (err) {
      console.log(err);
    });
    // Build the command to compile the file
    const cmd = `g++ "${
      file_name_without_ext + "_tmp.cpp"
    }" -o "${file_name}.exe"`;

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

function setTextAtLine(editor, lineNumber, decText) {
  const lineRange = editor.document.lineAt(lineNumber).range;
  if (linesAdded[lineNumber])
    linesAdded[lineNumber].dispose(linesAdded[lineNumber]);
  linesAdded[lineNumber] = vscode.window.createTextEditorDecorationType({
    rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
    after: {
      contentText: decText,
    },
  });
  editor.setDecorations(linesAdded[lineNumber], [
    lineRange.with({ start: lineRange.end }),
  ]);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
