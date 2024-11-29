let path = require("path");
let fs = require("fs");
let extensionPath = path.join(__dirname, "..");

var tmp = require("tmp");
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const child_process = require("child_process");
const os = require("os");
const { v4: uuid } = require("uuid");

const axios = require("axios");

const wastyle = require("wastyle");

/**
 * @param {vscode.ExtensionContext} context
 */

let initialized = false;
let is_enabled = false;
let lastRun = { error: null, output: null };
let lastText = { myfile: null };
let avLines = [];
let linesAdded = {};
let queue = [];
let driver = null;
let onlineMode = false;

let globalCompileTime = 0;
let temp_prefix = "_tmp_cppplayground";
let updateCheckPrompted = false;

let runQueue = [];
let allUrls = [
  'https://ab498.pythonanywhere.com/test4',
  'https://api.codex.jaagrav.in',
  'https://ab498.pythonanywhere.com/compile',
  'https://ab498.pythonanywhere.com/files/cppplaygound_version.txt',
]

const Parser = require('web-tree-sitter');

let parser = null;
let editor = null;
let outputChannel;
let statusBarItem;
let persistentState = () => {
  if (!fs.existsSync(`${extensionPath}/assets/state.json`)) fs.writeFileSync(`${extensionPath}/assets/state.json`, JSON.stringify({}));
  return JSON.parse(fs.readFileSync(`${extensionPath}/assets/state.json`))
};
let setPersistentState = (stt) => {
  if (!fs.existsSync(`${extensionPath}/assets/state.json`)) fs.writeFileSync(`${extensionPath}/assets/state.json`, JSON.stringify({}));
  fs.writeFileSync(`${extensionPath}/assets/state.json`, JSON.stringify(stt));
};

let allDecTypes = [];
let allErrDecTypes = [];
const decorationType = () => ({ // call vscode.window.createTextEditorDecorationType on these
  after: {
    margin: '0.5em',
    color: (vscode.window.activeColorTheme.kind == vscode.ColorThemeKind.Light ||
      vscode.window.activeColorTheme.kind == vscode.ColorThemeKind.HighContrastLight) ? 'orange' : 'yellow',
  },
});
const decorationTypeErr = () => ({
  after: {
    margin: '0.5em',
    color: (vscode.window.activeColorTheme.kind == vscode.ColorThemeKind.Light ||
      vscode.window.activeColorTheme.kind == vscode.ColorThemeKind.HighContrastLight) ? 'red' : 'red',
  },
});






function periodicTask() {

  periodicTaskInterval = setInterval(() => {
    if (!is_enabled) {
      return;
    }

    // checkForUpdates()

  }, 5 * 60000); // 5m
}


function startSpinnerAnimation() {
  const spinnerFrames = ["⣾", "⣽", "⣻", "⢿", "⡿", "⣟", '⣯', "⣷"];
  let frameIndex = 0;

  animationInterval = setInterval(() => {
    if (!is_enabled) {
      statusBarItem.text = "✖ CPP REPL";
      statusBarItem.text = `${(onlineMode ? "🌐" : "💻")} CPP REPL ✖`;

      statusBarItem.tooltip = "Disabled. Tap for more options";

      return;
    }

    statusBarItem.text = `${(onlineMode ? "🌐" : "💻")} CPP REPL ✔` + (globalCompileTime ? ` (${globalCompileTime}ms)` : "");
    statusBarItem.tooltip = `${(onlineMode ? "Online" : "Offline")} Mode. Last Run: ` + globalCompileTime + "ms. Tap for more options";
    if (runQueue.length > 0) {
      globalCompileTime = 0;
      statusBarItem.text = `${(onlineMode ? "🌐" : "💻")} CPP REPL ` + spinnerFrames[frameIndex];
      statusBarItem.tooltip = `${(onlineMode ? "Online" : "Offline")} Mode. Running. Tap for more options`;
    }
    frameIndex = (frameIndex + 1) % spinnerFrames.length;
  }, 200); // Adjust the interval for the desired spinning speed
}

function stopSpinnerAnimation() {
  clearInterval(animationInterval);
}



async function initialSetup(context) {
  try {
    editor = vscode.window.activeTextEditor;
    if (!editor) {
      while (!editor) {
        await new Promise(resolve => setTimeout(resolve, 500));
        editor = vscode.window.activeTextEditor;
      }
    }


    outputChannel = vscode.window.createOutputChannel("CPPPlayground");


    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
    statusBarItem.command = "cppplayground.showOptions"; // Replace with your command name

    if (editor?.document.languageId != "cpp") {
      statusBarItem.hide();
    } else {
      statusBarItem.show();
    }

    context.subscriptions.push(vscode.commands.registerCommand('cppplayground.visualize', () => {
      addRun({ document: { uri: editor?.document?.uri, languageId: "cpp" }, visualize: true });

    }));

    context.subscriptions.push(vscode.commands.registerCommand('cppplayground.format', () => {


      // let file_name = editor?.document.fileName;
      // let file_name_without_ext = path.parse(file_name).name + Date.now().toString().slice(-5);

      // let workingDir = path.join(os.tmpdir(), "._cpp_tmp");
      // if (!fs.existsSync(workingDir)) {
      //   fs.mkdirSync(workingDir);
      // }
      // let fileFullName = workingDir + "/" +
      //   file_name_without_ext + temp_prefix + ".cpp";
      // fs.writeFileSync(fileFullName, editor?.document.getText());

      // const formatter_exe = `${extensionPath}/assets/astyle.exe`;
      // if (os.platform() === 'win32') {
      //   // Windows PowerShell
      //   command = `"${formatter_exe}" "--suffix=none --max-continuation-indent=120 --style=google" "${fileFullName}"`;
      // } else {
      //   // Linux/macOS Bash
      //   command = `"${formatter_exe}" "--suffix=none --max-continuation-indent=120 --style=google" "${fileFullName}"`;
      // }

      // let [format_result, error1, error2] = await execjs(command, '', `${extensionPath}/assets`);
      // console.log('command', command);
      // console.log('extensionPath', extensionPath);
      // console.log('format_result', format_result);
      // if (error1 || error2) {
      //   console.log("format error", error1, error2);
      //   vscode.window.showInformationMessage("C++ Playground: Error while trying to format.");
      //   tstt({
      //     message: "FORMAT",
      //     value: error1,
      //     value2: error2,
      //   });
      //   return;
      // }

      // // fs.writeFileSync(file_name, fs.readFileSync(fileFullName, 'utf8'));
      // if (editor?.document.fileName == file_name) {
      //   editor.edit(editBuilder => {
      //     editBuilder.replace(new vscode.Range(0, 0, editor?.document.lineCount, 0), fs.readFileSync(fileFullName, 'utf8'));
      //   });
      // }
      if (editor?.document.languageId != "cpp") return;
      let [success, result] = wastyle.format(editor?.document.getText(), "pad-oper max-continuation-indent=120 style=google")
      if (!success) {
        vscode.window.showInformationMessage("C++ Playground: Error while trying to format.");
        return;
      }
      editor.edit(editBuilder => {
        editBuilder.replace(new vscode.Range(0, 0, editor?.document.lineCount, 0), result);
      });
      vscode.window.showInformationMessage("C++ Playground: Formatted successfully.");

    }));

    context.subscriptions.push(vscode.commands.registerCommand('cppplayground.showOptions', async () => {
      const answer = await vscode.window.showInformationMessage(
        "C++ Playground: Running.",
        onlineMode ? "Switch to local compiler" : "Switch to cloud compiler",
        is_enabled ? "Disable" : "Enable"
      );
      if (!answer) return;
      if (answer.toLowerCase() === "enable") {
        enableCommand();
      } else if (answer.toLowerCase() === "disable") {
        disableCommand();
      } else if (answer.toLowerCase() === "switch to local compiler") {
        toggleOnlineMode(false);
      } else if (answer.toLowerCase() === "switch to cloud compiler") {
        toggleOnlineMode(true);
      } else {
        // vscode.window.showInformationMessage("C++ Playground: Please install gcc/g++ for offline compilation.");
      }
    }));


    onlineMode = vscode.workspace.getConfiguration().get('cppplayground.onlineMode');
    vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration('cppplayground.onlineMode')) { }
      onlineMode = vscode.workspace.getConfiguration().get('cppplayground.onlineMode');

    });

    const disposable = vscode.commands.registerCommand('cppplayground.insertCode', insertCodeAtLine);
    context.subscriptions.push(disposable);

    async function insertCodeAtLine() {
      try {

        let code = editor?.document.getText();
        let tree = parse(editor?.document.getText());
        let [syntaxTreeJSON, globalData] = syntaxNodeToJSON(tree.rootNode, { path: [] }, {});
        const startPosition = editor?.document.positionAt(globalData.funcDef['main'].children.find(e => e.type == 'compound_statement').children.find(e => e.type == '{').startIndex);
        lineNum = startPosition.c;
        col = startPosition.e + 1;

        await editor.edit(editBuilder => {
          editBuilder.insert(new vscode.Position(lineNum, col), '\nstd::istringstream iss(R"(sample input)"); std::cin.rdbuf(iss.rdbuf());\n');
        });
      } catch (e) {
        console.log(e);
      }
    }



    startSpinnerAnimation();
    manageRuns();
  } catch (e) {
    vscode.window.showInformationMessage("C++ Playground: Error during startup " + e.message + " Try reloading Editor");
    console.log(e);
  }


}



async function prepareStuff(context) {

  try {
    await initialSetup(context);


    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider('cpp', {
      provideDocumentFormattingEdits(document, options, token) {
        // Define the formatting logic here
        const text = document.getText();
        const [success, formattedText] = wastyle.format(text, "pad-oper max-continuation-indent=120 style=google");
        if (!success) {
          vscode.window.showInformationMessage("C++ Playground: Error while trying to format.");
          return [];
        }

        return [
          vscode.TextEdit.replace(
            new vscode.Range(0, 0, document.lineCount, 0), // The entire document
            formattedText
          )
        ];
      }
    }));

    // (async () => {
    //   if ((persistentState().formatterInitTime && Date.now() - persistentState().formatterInitTime < 2 * 60 * 1000) || fs.existsSync(`${extensionPath}/assets/astyle.exe`)) {
    //     if (persistentState().formatterReady == 'ongoing') return;
    //     if (persistentState().formatterReady == 'ready') return;
    //   }
    //   setPersistentState({ ...persistentState(), formatterReady: 'ongoing', formatterInitTime: Date.now() });
    //   await execjs(`g++ *.cpp -o "${extensionPath}/assets/astyle.exe"`, '', `${extensionPath}/assets/astyle`);
    //   await new Promise((resolve) => setTimeout(resolve, 10 * 1000));
    //   setPersistentState({ ...persistentState(), formatterReady: 'ready', formatterPath: `${extensionPath}/assets/astyle.exe` });
    //   console.log('formatter ready');
    // })().catch(e => {
    //   tstt({
    //     title: "C++ Playground: Error during startup",
    //     message: "FORMAT",
    //     value: e
    //   })
    // });

    if (!editor) return vscode.window.showInformationMessage("C++ Playground: Failed Startup!");;
    await wastyle.init(fs.readFileSync(`${extensionPath}/assets/astyle.wasm`));
    await new Promise((resolve) => Parser.init().then(() => resolve()));
    parser = new Parser;

    extensionPath = context.extensionPath;

    const CPPSyntax = await Parser.Language.load(`${extensionPath}/assets/tree-sitter-cpp.wasm`);
    injectable = fs.readFileSync(`${extensionPath}/assets/injectable.cpp`, "utf8").trim();
    parser.setLanguage(CPPSyntax);

    vscode.workspace.onDidChangeTextDocument(async (changeEvent) => {
      if (!changeEvent.document) return;
      if (changeEvent.document.languageId != "cpp") return;
      if (changeEvent.document?.uri.scheme != 'file') return;
      if (editor?.document.uri.toString().includes(temp_prefix)) return;
      if (lastText['myfile'] == changeEvent.document.getText()) return;

      addRun(changeEvent);
      lastText['myfile'] = changeEvent.document.getText();

    });
    vscode.workspace.onDidOpenTextDocument(async (changeEvent) => { });
    vscode.window.onDidChangeActiveTextEditor(newEditor => {
      if (!newEditor?.document) return;

      if (newEditor?.document?.uri.scheme != 'file') return;
      if (newEditor?.document?.uri.toString().includes(temp_prefix)) return;

      if (newEditor?.document.languageId != "cpp") {
        statusBarItem.hide();
        return;
      } else {
        statusBarItem.show();
      }
      editor = newEditor;
      if (lastText['myfile'] == newEditor?.document.getText()) {
        if (!lastRun.error) {
          allDecTypes.forEach(decType => { editor.setDecorations(decType[0], decType[1]) });
        }
        else {
          allErrDecTypes.forEach(decType => { editor.setDecorations(decType[0], decType[1]) });
        }
        return;
      }

      addRun({ document: { uri: editor?.document?.uri, languageId: "cpp" } })
      lastText['myfile'] = editor?.document?.getText();

    });

    // if (!onlineMode) await new Promise((resolve) => setTimeout(resolve, 3000));
    if (editor?.document?.languageId == "cpp" && editor?.document?.uri.scheme == 'file'
      && !editor?.document?.uri.toString().includes(temp_prefix)) {
      addRun({ document: { uri: editor?.document?.uri, languageId: "cpp" } })
      lastText['myfile'] = editor?.document.getText();


    }

    initialized = true;

    // tstt({ message: "ON", files: safe(() => editor?.document?.uri ? fs.readdirSync(vscode.workspace.getWorkspaceFolder(editor?.document?.uri)?.uri?.fsPath) : null) });


    const disable_command = vscode.commands.registerCommand("cppplayground.disable", disableCommand);
    const enable_command = vscode.commands.registerCommand("cppplayground.enable", enableCommand);

    context.subscriptions.push(disable_command);
    context.subscriptions.push(enable_command);

  } catch (e) {
    vscode.window.showInformationMessage("C++ Playground: Error during startup " + e.message + " Try reloading Editor");
    tstt({ value: e.message, message: "STARTUP_ERR", error });
  }


}

async function checkForUpdates() {
  try {
    if (updateCheckPrompted) return;
    let cppplaygound_version = (await (await fetch(allUrls[3])).text()).split('.').map(e => parseInt(e));
    let cur_version = vscode.extensions.getExtension('498.cppplayground').packageJSON.version.split('.').map(e => parseInt(e));
    let greater = false;
    for (let i = 0; i < 3; i++) {
      if (cppplaygound_version[i] > cur_version[i]) {
        greater = true;
        break;
      } else if (cppplaygound_version[i] < cur_version[i]) {
        break;
      } else {
        continue;
      }
    }
    if (greater) {
      console.log(cppplaygound_version, cur_version);
      updateCheckPrompted = true;
      vscode.window.showInformationMessage(`C++ Playground: Update Available (v${cppplaygound_version.join('.')}). Please Update and Reload Extension for Best Experience.`);
    }
  } catch (error) {
    console.log(error);
  }
}

function disableCommand() {
  is_enabled = false;
  allDecTypes.forEach(decType => {
    decType[0].dispose();
  })
  allDecTypes = [];
  allErrDecTypes.forEach(decType => {
    decType[0].dispose();
  })
  allErrDecTypes = [];
}
function enableCommand() {
  is_enabled = true;
  addRun({ document: { uri: editor?.document?.uri, languageId: "cpp" } })
  lastText['myfile'] = editor?.document.getText();

}
function parse(code) {
  if (!parser) return;
  return parser.parse(code);
}
async function tstt(extras = {}) {
  try {
    console.log(extras);
  } catch (e) {
    console.log(e);
  }
}
async function addRun(evt) {
  let timeNow = new Date().getTime();
  if (runQueue.length > 1) runQueue.pop();

  if (runQueue[0]) {
    runQueue[0].controller?.abort();
    runQueue[0].cancelled = true;
  }
  let obj = {
    controller: null,
    cancelled: false,
    start: timeNow,
    delay: 500, // ms
    isRunning: false,
    isFinished: false,
    promise: () => runFile({ ...evt }, obj),
  };
  runQueue.push(obj);
};
async function manageRuns() {
  while (runQueue.length > 0) {
    await runQueue[0].promise();
    runQueue.shift();

  }
  await new Promise((resolve) => setTimeout(resolve, 100));
  manageRuns();
};

function safe(fn, onError = () => { }) {
  try {
    let res = fn();
    if (res instanceof Promise) {
      return (async (resolve, reject) => {
        try {
          return (await res);
        } catch (e) {
          if (onError) onError(e);
          // console.log("[Errored]", e);
          return (null);
        }
      })();
    } else {
      return res;
    }
  } catch (e) {
    if (onError) onError(e);
    // console.log("[Errored|Sync]", e);
    return null;
  }
}


function getCPUUsage() {
  try {
    const cpus = os.cpus();
    const userTime = cpus.reduce((acc, cpu) => acc + cpu.times.user, 0);
    const niceTime = cpus.reduce((acc, cpu) => acc + cpu.times.nice, 0);
    const sysTime = cpus.reduce((acc, cpu) => acc + cpu.times.sys, 0);
    const idleTime = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
    const irqTime = cpus.reduce((acc, cpu) => acc + cpu.times.irq, 0);

    const total = userTime + niceTime + sysTime + idleTime + irqTime;
    const used = total - idleTime;
    return ((1 - idleTime / total) * 100).toFixed(2);
  } catch (error) {

  }
}

function getMemoryUsage() {
  try {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    return {
      free: parseFloat((freeMemory / (1024 ** 3)).toFixed(2)),
      used: parseFloat((usedMemory / (1024 ** 3)).toFixed(2)),
      total: parseFloat((totalMemory / (1024 ** 3)).toFixed(2)),
      percent: parseFloat(((usedMemory / totalMemory) * 100).toFixed(2))
    };
  } catch (error) {

  }
}
async function runFile(changeEvent, extra) {
  try {
    if (!editor) return;
    checkForUpdates();

    let visualize = changeEvent.visualize;

    if (extra)
      extra.controller = new AbortController();

    await new Promise((resolve) => setTimeout(resolve, vscode.workspace.getConfiguration().get('cppplayground.delayRunAfterTyping', 500) || 0));

    if (extra.controller.signal.aborted) {
      return;
    }


    allDecTypes.forEach(decType => {
      decType[0].dispose();
    })
    allDecTypes = [];
    allErrDecTypes.forEach(decType => {
      decType[0].dispose();
    })
    allErrDecTypes = [];

    let run_id = (Date.now() + '').slice(-3);



    if (changeEvent.document.languageId != "cpp") return;
    if (editor?.document?.uri != changeEvent?.document?.uri) return;
    if (editor?.document?.uri.toString().includes(temp_prefix)) return;
    code = editor?.document.getText();
    let tree = parse(editor?.document.getText());
    let [syntaxTreeJSON, globalData] = syntaxNodeToJSON(tree.rootNode, { path: [] }, {});
    let replaced = injectable + '\n\n' + replaceExprs(
      code,
      globalData.functionCallSlices,
      globalData.binaryRights,
      globalData.identifiers,
    );
    // fs.writeFileSync(vscode.workspace.workspaceFolders[0].uri.fsPath + '/' + 'forDebug_tmp_cppplayground.cpp', replaced);

    if (!globalData.functionToReturnMap.hasOwnProperty('main')) {
      return;
    }
    outputChannel.clear();

    let startTime = new Date().getTime();
    console.log('run start');
    let offlMode = !onlineMode;
    let [stdout, error, linesFile] = onlineMode ? await runOnlineUnstable(code, replaced, extra?.controller) : await runOffline(injectable, code, globalData);
    let compileTime = new Date().getTime() - startTime;
    console.log('run end', compileTime);

    if (extra.cancelled) return;

    // (async () => {
    //   tstt({
    //     message: "RUN_END",
    //     run_id,
    //     code,
    //     output: (stdout || '').replace(/__res_start__(\d+)_(\d+)__[\s\S]*?__res_end__(\d+)_(\d+)__/g, ""),
    //     error: error,
    //     time: compileTime,
    //     gccVersion: offlMode ? await safe(async () => (await execjs('g++ --version'))[0]) : "online",
    //     cpu: getCPUUsage(),
    //     memory: getMemoryUsage()
    //   });
    // })();

    globalCompileTime = compileTime;

    lastRun.error = false;
    if (error) {

      lastRun.error = true;
      if (error.toString().trim().startsWith("runtime-error")) {
        outputChannel.appendLine("Runtime Error: (Output Still Shown)");
        outputChannel.appendLine(replace_after_angle_bracket(error.replace('runtime-error:', '')));
      } else {
        if (error.toString().trim().startsWith("compilation-error")) {
          error = error.toString().replace('compilation-error:', '');
          outputChannel.appendLine("Compilation Error:");
        }
        let errorLines = extractErrors(error);
        outputChannel.appendLine(replace_after_angle_bracket(error));
        // let actualOutput = stdout.replace(/__res_start__(\d+)_(\d+)__[\s\S]*?__res_end__(\d+)_(\d+)__/g, "");
        // outputChannel.appendLine("Output:");
        // outputChannel.appendLine(actualOutput);
        if (Object.entries(errorLines).length) setErrorDecors(errorLines);

        if (runQueue.length > 1 || !is_enabled) {
          return
        };

        return;
      }

    }

    stdout = stdout || '';
    let lineOutputs = extractLineOutputs(!offlMode || !linesFile ? stdout : fs.readFileSync(linesFile, 'utf8'));
    // console.log(lineOutputs, linesFile ? fs.readFileSync(linesFile, 'utf8') : '')

    if (runQueue.length > 1 || !is_enabled) {
      return
    };
    let actualOutput = stdout.replace(/__res_start__(\d+)_(\d+)__[\s\S]*?__res_end__(\d+)_(\d+)__/g, "");


    if (!lastRun.time)
      await setOutputDecors(lineOutputs, true);
    await setOutputDecors(lineOutputs, false, visualize);
    lastRun.time = compileTime;





    // outputChannel.appendLine(code);
    outputChannel.appendLine('Output:');
    outputChannel.appendLine(actualOutput);
    if (vscode.workspace.getConfiguration().get('cppplayground.enableAutoOpenOutput', true)) {
      outputChannel.show(true);
    }


  } catch (e) {
    // vscode.window.showInformationMessage("Error" + e.message);
    console.log(e);
  }
}

function execjs(cmd, input = '', workingDirectory = null) {
  return new Promise((resolve /*reject*/) => {
    const child = child_process.exec(
      String.raw`${cmd}`,
      { shell: true, timeout: !lastRun.time ? 20000 : 10000, cwd: workingDirectory },
      (err, out, stderr) => {
        if (err) {
          if (err.signal === 'SIGTERM') {
            err = 'Timed out after 10s';
          } else {
            // err = 'Runtime Error: (Output Still Shown)\n' + err.toString();
          }
        }
        return resolve([out, err, stderr]);
      }
    );

    // Write input to the child process
    if (input) {
      child.stdin.write(input);
      child.stdin.end(); // Close stdin after sending input
    }
  });
}
async function runOnlineUnstable(code, replaced, controller) {
  try {
    // throw new Error('Using Other API');
    let [res, res2] = [null, null];
    const secondController = new AbortController();
    const secondSignal = secondController.signal;
    setTimeout(() => secondController?.abort(), 10000);
    controller?.signal.addEventListener(
      'abort',
      () => {
        secondController.abort(controller?.signal.reason);
      },
      { signal: secondController.signal }
    );

    res = await axios({
      timeout: 10000,
      url: allUrls[1],
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json;charset=UTF-8'
      },
      data: {
        code: replaced,
        language: "cpp",
        replaced,
        input: Array(999).fill(1).join('\n')
      },
      signal: secondController?.signal
    });


    if (res.data.error) {
      res2 = await axios({
        timeout: 10000,
        url: allUrls[1],
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json;charset=UTF-8'
        },
        data: {
          code,
          language: "cpp",
          replaced,
          input: Array(999).fill(1).join('\n')
        },
        signal: controller?.signal
      })

    }
    // Logging the first result

    // Return output from the first request and error from the second request
    return [res?.data?.output, res2?.data?.error || res?.data?.error];
  } catch (e) {
    if (e.code == "ERR_CANCELED" && controller?.signal.aborted) {
      return [null, "ERR_CANCELED"]
    }

    try {
      // Fallback logic if initial requests fail
      return runOnline(code, replaced, controller);
    } catch (error) {
      if (error.code == "ERR_CANCELED") {
        return [null, "ERR_CANCELED"]
      }
      return [null, "ERROR"];
    }
  }
}

async function runOnline(code, replaced, controller) {
  try {

    const secondController = new AbortController();
    const secondSignal = secondController.signal;
    setTimeout(() => secondController?.abort(), 10000);
    controller?.signal.addEventListener(
      'abort',
      () => {
        secondController.abort(controller?.signal.reason);
      },
      { signal: secondController.signal }
    );
    let res = ((await axios({
      timeout: 10000,
      url: allUrls[2],
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json;charset=UTF-8'
      },
      data:
      {
        code,
        replaced,
        input: Array(999).fill(1).join('\n')
      },
      signal: secondController?.signal
    })).data);
    return [res.output, res.error];
  } catch (e) {
    if (e.code == "ERR_CANCELED") {
      return [null, 'ERR_CANCELED']
    }
    return [null, 'ERROR']
  }
}
async function gppCheck() {
  let [res, err, stderr] = await execjs("g++ --version");

  if (err) {
    // Show an information message with Yes and No options
    const answer = await vscode.window.showInformationMessage(
      "C++ Playground: Local installation of 'g++' compiler not found. Switch to Online Mode?",
      "Okay",
      "No"
    );

    if (answer === "Okay") {
      toggleOnlineMode(true);
    } else {
      vscode.window.showInformationMessage("C++ Playground: Please install gcc/g++ for offline compilation.");
    }

    return false
  }

  return true
}
async function runOffline(injectable, unreplaced, globalData) {
  try {

    let includes = globalData.includes;
    if (!await gppCheck()) {
      return [null, "GCC NOT FOUND"];
    }
    let file_name = editor?.document.fileName;
    let file_name_without_ext = path.parse(file_name).name + Date.now().toString().slice(-5);
    // let ActualWorkingDir = path.dirname(file_name);
    let workingDir = path.join(os.tmpdir(), "._cpp_tmp");
    if (!fs.existsSync(workingDir)) {
      fs.mkdirSync(workingDir);
    }

    let fileFullName = workingDir + "/" +
      file_name_without_ext + temp_prefix + ".cpp";
    // let exeFileFullName = ActualWorkingDir + "/" +
    //   file_name_without_ext + ".exe";
    let fileFullNameUnreplaced = workingDir + "/" +
      file_name_without_ext + temp_prefix + ".unreplaced.cpp";



    let lineOutputFile = workingDir + "/" + 'line_out_' + Date.now().toString().slice(-5) + '.txt';
    let replaced = injectable.replace('{{filename}}', lineOutputFile) + '\n\n' + replaceExprs(
      unreplaced,
      globalData.functionCallSlices,
      globalData.binaryRights,
      globalData.identifiers,
    );

    fs.writeFileSync(fileFullName, replaced, console.error);
    // await new Promise(r=>setTimeout(r, 7000))

    // Build the command to compile the file

    // search in local directory for header files matching Object.keys(includes)

    includes = includes || {};
    let includePaths = Object.keys(includes).map((key) => {
      let dir = path.dirname(editor?.document.fileName);
      if (key.slice(-2) == ".h") {
        key = key.replace(/.h$/, ".cpp");
        if (fs.existsSync(path.join(dir, key))) return path.join(dir, key);
      }
      return null;
    }).filter((x) => x != null);

    // g++ -Wall -g current.cpp add.cpp -o main
    // const cmd = `g++ "${fileFullName}" -o "${fileFullName}.exe"`;
    const cmd = `g++ -w -I"${path.dirname(editor?.document.fileName)}" ${includePaths.map((x) => `"${x}"`).join(" ")} "${fileFullName}" -o "${fileFullName}.exe"`;
    const cmdErrCatch = `g++ -w -I"${path.dirname(editor?.document.fileName)}" ${includePaths.map((x) => `"${x}"`).join(" ")} "${fileFullNameUnreplaced}" -o "${fileFullName}.exe"`;
    outputChannel.clear();

    let stdout = await execjs(cmd);
    try { fs.existsSync(fileFullName) && fs.unlinkSync(fileFullName) } catch (e) { } // who cares, its in temp dir
    if (stdout[1] || stdout[2]) {

      fs.writeFileSync(fileFullNameUnreplaced, unreplaced, console.error);
      stdout_tmp = await execjs(cmdErrCatch);
      try { fs.existsSync(fileFullNameUnreplaced) && fs.unlinkSync(fileFullNameUnreplaced) } catch (e) { } // who cares, its in temp dir
      if (stdout_tmp[1] || stdout_tmp[2]) {
        // return [null, 'compilation-error:\n' + stdout_tmp[1] + '\n' + stdout_tmp[2]];
        return [null, 'compilation-error:\n' + stdout_tmp[2] + '\n' + stdout_tmp[1], lineOutputFile];
      } else {
        stdout = stdout_tmp;
      }
      // return [null, 'compilation-error:\n' + stdout[2] + '\n' + stdout[1], lineOutputFile];
    }

    const exe_file = `${fileFullName}.exe`;


    if (os.platform() === 'win32') {
      // Windows PowerShell
      command = `cmd /c "${exe_file}"`;
    } else {
      // Linux/macOS Bash
      command = `"${exe_file}"`;
    }


    stdout = await execjs(command, Array(999).fill(1).join('\n'), path.dirname(editor?.document.fileName));



    try {
      fs.existsSync(exe_file) && fs.unlinkSync(exe_file)
    } catch (e) { } // who cares, its in temp dir
    if (stdout[1] || stdout[2]) {
      return [stdout[0], 'runtime-error:\n' + stdout[2], lineOutputFile];
    }



    return [stdout[0], null, lineOutputFile];
  } catch (error) {
    try {
      // Fallback logic if initial requests fail
      // return runOnlineUnstable(code, replaced, controller,lineOutputFile);
    } catch (error) {
      // return [null, "ERROR",lineOutputFile];
    }
    return [null, safeStringify({ message: error.message, ...error }), lineOutputFile];
  }

}

function syntaxNodeToJSON(node, parent, globalData) {
  const jsonNode = {
    type: node.type,
    text: node.text,
    path: [...parent.path, node.type],
    children: [],
  };

  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    jsonNode.children.push(
      syntaxNodeToJSON(child, jsonNode, globalData)[0]
    );
  }
  globalData.includes = globalData.includes || {};
  globalData.funcDef = globalData.funcDef || {};
  globalData.functionToReturnMap = globalData.functionToReturnMap || {};
  globalData.functionCallSlices = globalData.functionCallSlices || [];
  globalData.binaryRights = globalData.binaryRights || [];
  globalData.identifiers = globalData.identifiers || [];








  if (['preproc_include', 'system_lib_string'].every((element, idx) => jsonNode.path.slice(-2)[idx] == element)) {
    globalData.includes[node.text.slice(1, -1)] = true;
  }
  if (['preproc_include', 'string_literal'].every((element, idx) => jsonNode.path.slice(-2)[idx] == element)) {
    globalData.includes[node.text.slice(1, -1)] = true;
  }

  found = true;
  ["function_definition"].forEach((element, idx) => {
    if (jsonNode.path.slice(-1)[idx] == element) {
    } else found = false;
  });
  if (found) {
    let func_name = jsonNode.children
      .find((e) => e.type == "function_declarator")
      ?.children.find((e) =>
        ["identifier", "field_identifier"].includes(e.type)
      )?.text;
    let ret_type = jsonNode.children.find((e) =>
      [
        "primitive_type",
        "qualified_identifier",
        "template_type",
      ].includes(e.type)
    )?.text;
    globalData.functionToReturnMap[func_name] = ret_type;
    globalData.funcDef[func_name] = node;
  }

  // identifier
  found = true;
  ["expression_statement", "identifier"].forEach((element, idx) => {
    if (jsonNode.path.slice(-2)[idx] == element) {
    } else found = false;
  });
  if (found) {
    globalData.identifiers.push(node);
  }
  // call
  found = true;
  ["expression_statement", "call_expression"].forEach((element, idx) => {
    if (jsonNode.path.slice(-2)[idx] == element) {
    } else found = false;
  });
  if (found) {
    let callexpr = node;
    if (
      [
        ...Object.entries(globalData.functionToReturnMap).filter(
          (el) => el[1] != "void"
        ),
        ["printf", "int"],
      ].some((el) =>
        [
          callexpr.children.find((e) =>
            ["identifier", "field_identifier"].includes(e.type)
          )?.text,
          callexpr.children
            .find((e) => ["field_expression"].includes(e.type))
            ?.children.find((e) => ["field_identifier"].includes(e.type))
            ?.text,
        ].includes(el[0])
      )
    )
      globalData.functionCallSlices.push(callexpr);

    //     .children.find(e => ['field_expression'].includes(e.type))
    //     ?.children.find(e => ['field_identifier'].includes(e.type))?.text)
  }

  found = true;
  ["assignment_expression"].forEach((element, idx) => {
    if (jsonNode.path.slice(-1)[idx] == element) {
    } else found = false;
  });
  if (found) {
    let operand = node.children.find((e) => e.type == "<<")?.text;
    let right = node.childForFieldName("right");


    if (
      right.text != "endl" &&
      right.text != "std::endl" &&
      operand == "<<"
    )
      globalData.binaryRights.push(right);
  }
  found = true;
  ["binary_expression"].forEach((element, idx) => {
    if (jsonNode.path.slice(-1)[idx] == element) {
    } else found = false;
  });
  if (found) {
    let operand = node.children.find((e) => e.type == "<<")?.text;
    let right = node.childForFieldName("right");

    if (
      right.text != "endl" &&
      right.text != "std::endl" &&
      operand == "<<"
    )
      globalData.binaryRights.push(right);
  }
  globalData.binaryRights.forEach((e) => {
    e.isBin = true;
  });
  return [jsonNode, globalData];
}
function toggleOnlineMode(makeMode) {

  onlineMode = vscode.workspace.getConfiguration().get('cppplayground.onlineMode');
  onlineMode = typeof onlineMode !== 'undefined' ? onlineMode : false;
  onlineMode = !onlineMode;
  if (typeof makeMode !== 'undefined') {
    onlineMode = makeMode;
  }
  vscode.workspace.getConfiguration().update('cppplayground.onlineMode', onlineMode, true);


  addRun({ document: { uri: editor?.document?.uri, languageId: "cpp" } })
  lastText['myfile'] = editor?.document.getText();

  vscode.window.showInformationMessage("C++ Playground: Using " + (onlineMode ? "cloud compiler" : "local compiler"));

}
function replaceExprs(s, callNodes, binaryNodes, identifiers) {
  let mergedNodes = [...callNodes, ...binaryNodes, ...identifiers].sort((a, b) => {
    return a.startIndex - b.startIndex;
  });
  mergedNodes.reverse().forEach((node) => {
    if (node.isBin) {

      let prefix = s.substring(0, node.startIndex);
      let postfix = s.substring(node.endIndex, s.length);
      let replace = s.substring(node.startIndex, node.endIndex);

      s =
        prefix +
        `_conv_string(${replace}, ${node.startIndex}, ${node.endIndex})` +
        postfix;
      return;
    }

    let func_name = node.children.find((e) =>
      ["identifier", "field_identifier"].includes(e.type)
    )?.text;
    let args = node.children.find((e) =>
      ["argument_list"].includes(e.type)
    )?.text;
    let prefix = s.substring(0, node.startIndex);
    let postfix = s.substring(node.endIndex, s.length);
    let replace = s.substring(node.startIndex, node.endIndex);

    if (func_name == "printf") {
      // s =
      //   prefix +
      //   `_special_printf(${node.startIndex}, ${node.endIndex}, ${args.slice(
      //     1,
      //     args.length - 1
      //   )})` +
      //   postfix;
    } else
      s =
        prefix +
        `_conv_string(${replace}, ${node.startIndex}, ${node.endIndex})` +
        postfix;
  });
  return s;
}
function extractLineOutputs(outputString) {
  let matches = findRegexMatches(
    outputString,
    /__res_start__(\d+)_(\d+)__[\s\S]*?__res_end__(\d+)_(\d+)__/gs
  );
  let lineOutputs = {};
  let lastCol = -1;
  let lastLine = -1;
  let newline = false;
  let t = 0;
  matches.forEach((match) => {
    let prefix = match.match(/__res_start__(\d+)_(\d+)__/);
    let startIndex = prefix[1];
    let endIndex = prefix[2];
    let suffix = match.match(/__res_end__(\d+)_(\d+)__/)[1];
    let line = {
      text: match.match(
        /__res_start__(\d+)_(\d+)__([\s\S]*?)__res_end__(\d+)_(\d+)__/s
      )[3], time: t++
    };
    const startPosition = editor?.document.positionAt(parseInt(prefix[1]));

    lineNum = startPosition.c;
    col = startPosition.e;


    if (lastLine == lineNum && col > lastCol)
      newline = false;
    else
      newline = true;
    lineOutputs[lineNum] = lineOutputs[lineNum] || [];
    let limit = 200;
    if (lineOutputs[lineNum].length > limit) {
      let x;
      if (lineOutputs[lineNum][lineOutputs[lineNum].length - 1]?.startsWith('__info__')) {
        x = parseInt(lineOutputs[lineNum][lineOutputs[lineNum].length - 1]?.split(' ')?.[1]);
        lineOutputs[lineNum].pop();
      }
      else x = 0;
      lineOutputs[lineNum].push(`__info__ ${x + 1} more outputs omitted...`);
      return;
    }
    if (newline)
      lineOutputs[lineNum] = [...lineOutputs[lineNum], line]; // push
    else
      lineOutputs[lineNum] = lineOutputs[lineNum].length - 1 >= 0 ? // last exists
        [...lineOutputs[lineNum].slice(0, lineOutputs[lineNum].length - 1), // exclude last 
        { text: lineOutputs[lineNum][lineOutputs[lineNum].length - 1].text + '' + line.text, time: line.time }] :
        [line];
    lastCol = col;
    lastLine = lineNum;
  });
  return lineOutputs;
}

function findRegexMatches(string, regex, limit = Infinity) {
  console.log('matchfinding start');
  let matches = [];
  let match;
  while ((match = regex.exec(string))) {
    matches.push(match[0]);
    if (matches.length > limit)
      break;
  }
  console.log('matchfinding end');

  return matches;
}
async function setOutputDecors(lineOutputs, hide = false, visualize = false) {
  // Clear existing decorations

  allDecTypes.forEach(decType => {
    decType[0].dispose();
  })
  allDecTypes = [];
  allErrDecTypes.forEach(decType => {
    decType[0].dispose();
  })
  allErrDecTypes = [];
  let outs = [];
  for (const [key, value] of Object.entries(lineOutputs)) {
    value.forEach((val) => {
      outs.push([key, val]);
    });
  }

  outs.sort((a, b) => a[1].time - b[1].time);
  let offs = {};
  outs.forEach((val) => {
    let [key, value] = val;
    value = value.text;
    value = value || '';
    const line = editor?.document.lineAt(parseInt(key));
    // const startPosition = editor?.document.positionAt(parseInt(key.split("_")[0]));
    const startPosition = new vscode.Position(line.range.start.line, line.range.end.character);
    const endPosition = new vscode.Position(startPosition.line, line.range.end.character);

    let lnNum = line.range.start.line;
    offs[lnNum] = (offs[lnNum] || 0) + 1;

    const range = new vscode.Range(startPosition, endPosition);
    let message = value.length > 100 ? value.slice(0, 50) + "..." : value;


    let decType;

    if (offs[lnNum] == 11) {
      decType = [vscode.window.createTextEditorDecorationType(decorationType()), hide ? [] : [
        {
          range,
          renderOptions: {
            after: {
              contentText: "Further outputs omitted...",
            },
          },
        },
        {
          range,
          hoverMessage: message,
        }
      ]];
    } else if (offs[lnNum] > 11) {
      decType = [vscode.window.createTextEditorDecorationType(decorationType()), hide ? [] : [
        {
          range,
          hoverMessage: message,
        }
      ]];
    } else {
      decType = [vscode.window.createTextEditorDecorationType(decorationType()), hide ? [] : [
        {
          range,
          renderOptions: {
            after: {
              contentText: message.replace(/\r*\n/g, ' ').trim(),
            },
          },
        },
        {
          range,
          hoverMessage: message,
        }
      ]];
    }

    allDecTypes.push(decType);

  });

  for (let i = 0; i < allDecTypes.length; i++) {
    if (runQueue.length > 1) return;
    let decType = allDecTypes[i];
    if (visualize) {
      const range = [...decType[1]][0].range;
      let tmpDecor = vscode.window.createTextEditorDecorationType({
        isWholeLine: true,
        borderWidth: `0 0 5px 0`,
        borderStyle: 'solid',
        borderColor: 'green',
        backgroundColor: 'green',
        after: {
          margin: '0.5em',
          color: 'white',
        },
      });
      editor.setDecorations(tmpDecor, [{ range, }, ...decType[1]]);
      await new Promise((resolve) => setTimeout(resolve, 500));
      editor.setDecorations(tmpDecor, []);
      editor.setDecorations(decType[0], [...decType[1]]);
      await new Promise((resolve) => setTimeout(resolve, 100));
    } else {
      editor.setDecorations(decType[0], [...decType[1]]);
    }

    // editor.setDecorations(decType[0], [decType[1][1]]);
  }



  // Set all decorations at once
}
function setErrorDecors(lineOutputs, code) {
  // Clear existing decorations

  allDecTypes.forEach(decType => {
    decType[0].dispose();
  })
  allDecTypes = [];
  allErrDecTypes.forEach(decType => {
    decType[0].dispose();
  })
  allErrDecTypes = [];

  for (const [key, value] of Object.entries(lineOutputs)) {
    const startPosition = new vscode.Position(parseInt(key.split("_")[0]), parseInt(key.split("_")[1]));
    const line = editor?.document.lineAt(startPosition.line);
    const endPosition = new vscode.Position(startPosition.line, line.range.end.character);

    const range = new vscode.Range(startPosition, endPosition);
    let message = value.length > 100 ? value.slice(0, 50) + "..." : value;

    let decType = [vscode.window.createTextEditorDecorationType(decorationTypeErr()), [
      {
        range,
        hoverMessage: value,
        renderOptions: {
          after: {
            contentText: message.replace(/\r*\n/g, ' '),
          },
        },
      }
    ]];
    allErrDecTypes.push(decType);
    editor.setDecorations(decType[0], decType[1]);
  }

}
function replace_after_angle_bracket(input_string) {
  input_string = input_string.replace(/std::/g, '')
  input_string = input_string.replace(/std::allocator<[^>]+>/g, '');
  return input_string
}

function extractErrors(errorLogs) {
  const errorMap = {};

  const lines = errorLogs.trim().split('\n');
  for (const line of lines) {
    if (/.*:\d+:\d+:/.test(line)) {
      // use regex to get line and col number
      let match = line.match(/.*:(\d+:\d+):[:\s]*/);
      match = match[1].split(':')//.join('_');
      match[0] = parseInt(match[0]) - 1;
      match = match.join('_');
      match;
      let ln = line.replace(/.*:(\d+:\d+):[:\s]*/, '');

      // def replace_after_angle_bracket(input_string):
      //   input_string = re.sub(r'<[^>]*::', '<', input_string)
      //   input_string = re.sub(r'std::', '', input_string)
      //   return input_string
      ln = replace_after_angle_bracket(ln);
      errorMap[match] = ln;
    }
  }

  return errorMap;
}

function unifiedError(...args) {
  tstt(...args);
}

function safeStringify(...args) {
  let replacer = ((obj) => {
    let cache = [];
    return (key, value) =>
      typeof value === "object" && value !== null
        ? cache.includes(value)
          ? undefined // Duplicate reference found, discard key
          : cache.push(value) && value // Store value in our collection
        : value;
  })();
  return safeStringify(args[0], replacer, ...args.slice(2));
};



module.exports = {
  activate(context) {

    if (is_enabled) vscode.window.showInformationMessage("C++ Playground: Running");

    is_enabled = true;

    (async () => {
      try {
        await prepareStuff(context);

      } catch (e) {
        console.log("ACTV_ERR", e);
      }
    })();


  },
  deactivate() {

  },
};
