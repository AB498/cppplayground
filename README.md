<p align="center" style="text-align:center">
    <img src="https://ab498.pythonanywhere.com/files/imgs/codeplay.png" alt="CodePlayground" width="200" height="200"
        style="border-radius:500px; padding:40px">
<h1 align="center"><b>C++ Playground: Run Inline REPL + Linter + Formatter + Compiler + Cloud + Visualizer + Intellisense + Error Lens + Essentials</b></h1>

## A vscode extension that runs `.cpp` files while typing, providing line-by-line outputs as well as error logs inside the editor (both cloud and locally). Includes other features like linting, formatting, cloud compiling, realtime visualization, intellisense, error checking and more...

<div
    style="text-align:center;font-family: monospace; display: flex; flex-direction: column; gap:5px; align-items: center; justify-content: center; width: 100%; gap: 10px;">

<div style="text-align:center;font-family: monospace; display: flex; align-items: center; justify-content: center; width: 100%; gap: 10px">
        <a href="https://discord.gg/dquNGYwfnW"><img src="https://img.shields.io/discord/1095854826786668545" alt="Discord"></a>
        <a href="https://img.shields.io/badge/License-MIT-yellow.svg"><img
                src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
    </div>
    <div
        style="background-color:#330055;;font-size:0.8rem;box-shadow:0 0 10px 1px rgba(0,0,0,0.2);display:inline-flex;border-radius:10px; ">
        <div style="background-color:#330022;color:white;border-radius: 5px 0px 0px 5px;padding:4px 10px;">
            Last Updated
        </div>
        <div style="background-color:#334422;color:white;border-radius: 0px 5px 5px 0px;padding:4px 10px;">
            November 2024
        </div>
    </div>
</div>

</p>

</p>

![C++ Playground: Inline REPL + Linter + Formatter + Cloud Compiler + Visualizer + Intellisense + Error Lens](https://ab498.pythonanywhere.com/files/imgs/cpppg-intro.gif)

![C++ Playground: Inline REPL + Linter + Formatter + Cloud Compiler + Visualizer + Intellisense + Error Lens](https://ab498.pythonanywhere.com/files/imgs/cpppg-visualize.gif)

**More features [below](#features)**

## Usage (Core Feature)

* Open a `.cpp` file and you will see outputs beside `cout` and `identifier` statements.
* Automatically starts on `.cpp` files (For Manual Activation, [Read Next Section](#usage-others))
* Input must come from txt files or buffer. ([See Below (Input/Output)](#inputoutput))

## Usage (Others)

* **Mode:** Status bar item `🌐/💻` indicates whether cloud compiler or local compiler (`g++` command) is being used
* **Format:** `win+shift+f` to format the file. (Gets set as cpp formatter by default after installation, if you have multiple formatter extensions, you can change it in settings or in `command palette` type `Format Document With...`)
* **Visualization:** From Command Palette, search `C++ Playground: ` then `visualize`
* **Others:** Access other features from Command Palette: `Ctrl+Shift+P` or `F1` and search `C++ Playground: ` then `format`,`input`,`mode`,`start`,etc
* **Activation/Deactivation:** 
    * Activate manually: `ctrl+alt+shift+n` (Activated automatically on `.cpp` files)
    * Deactivate manually: `ctrl+alt+shift+q`
    * Click status bar item saying `CPP REPL` to toggle between active and deactive state with a `.cpp` file open

    <center>
    <img src="https://ab498.pythonanywhere.com/files/imgs/cpppg-status-bar.png" style="max-height: 300px"/>
    </center>
* You will need computation power to use the extension.

## Input/Output

* Input statements like `cin` and `scanf` must be removed or hardcoded or stream must be altered (Or else you will get timeout after 10s).
* Stream Alteration Example 1:
```cpp
int main(){
    freopen("input.txt", "r", stdin);
    int x; std::cin >> x; // reads int from input.txt file
    std::cout << x + 1;
}
```
* Example 2:
```cpp
#include<sstream>
int main() {
    std::istringstream iss(R"(
        3 line
        input 
        example
    )");
    std::cin.rdbuf(iss.rdbuf()); // done
    int x; std::cin >> x; // stores 3
    std::cout << x + 1; // 4
}
```
* You can also type `Ctrl+Shift+P` or `F1` to open the command palette and search for `Insert Input Hardcode Template` to automatically insert the hardcoded input at the start of main function.

## Installation

* Open VSCode Extension tab (Shortcut: `ctrl+shift+X`) and type 'cpp repl'
* Install the extension named `C++ Playground: Inline REPL + Bla Bla Bla`

## Feature Suggestions

* If you have any feature requests, feel free to join [Discord (CodePlayground)](https://discord.gg/dquNGYwfnW) or email me.

## Features

- Zero Configuration
- Executes the code as you type and shows outputs beside each line
- Prints complex data structures in pretty format
    <center>
    <img src="https://ab498.pythonanywhere.com/files/imgs/cpppg-sample.png" style="max-height: 300px"/>
    </center>
- Format code with `AStyle`
- Visualize runtime code execution in realtime
    <center>
    <img src="https://ab498.pythonanywhere.com/files/imgs/cpppg-visualize.png" style="max-height: 300px"/>
    </center>
- Lints errors beside defective lines
    <center>
    <img src="https://ab498.pythonanywhere.com/files/imgs/cpppg-error.png" style="max-height: 300px"/>
    </center>
- Shows compiled output in a separate panel (Can be turned off)
- Makes it easier to debug and view values of variables from within editor
- Can run using both cloud and local compilations (`g++` for local as of now)
- Lightweight and as fast as it gets

## Requirements

- If you use cloud compiler (default), it requires internet obvisously.
- Else if you're on offline mode (switch using status bar icon), it will require `C++` compiler `(g++)` to be installed on your pc beforehand.
- (On Cloud Mode) Compatible with code that use `C++14` or below version (currently on servers) (might vary from time to time)
- (On Local Mode) Compatible with code that use the `g++` version that you have.

## Install GCC (if needed)
 - [Easiest] To install `gcc` (includes `g++`) on windows run (in powershell):
    With Scoop:
    ```powershell
    Set-ExecutionPolicy Bypass -Scope Process -Force;
    iex "& {$(irm get.scoop.sh)} -RunAsAdmin"; scoop install gcc
    ```
    OR with Chocolatey:
    ```powershell
    Set-ExecutionPolicy Bypass -Scope Process -Force;
    iwr -useb https://chocolatey.org/install.ps1 | iex; choco install mingw -y
    ```
- For tutorial on how to install `C++` compiler on your system, visit [this link](https://code.visualstudio.com/docs/cpp/config-mingw) or contact me.
- For Windows users, you can also use the [Windows Subsystem for Linux](https://code.visualstudio.com/docs/cpp/config-wsl) to run `C++` code
- Verify using 
    ```powershell
    g++ --version
    ```

## Extension Settings

- Status bar icon `🌐/💻` used to switch between cloud and local compiler mode.
- Delay after keystores: Look into settings.
- Auto open output panel: Look into settings.

## Known Issues

##### * Feel free to report any issues you find through email, discord <s>or by opening an issue on github</s>

</br>
<details>

<summary style="font-size:1.5rem;">Release Notes
</summary>

### v1.0.0

Stable Release

- Repl, linting, formatting, cloud compiling, visualization, error checking, intellisense and other features completed
- Bugs fixed

### v0.2.0

A lot of improvements and bug fixes:

- Faster cloud compiler
- Improved user experience
- Settings options
- And much more ...

### v0.1.0

Reimplementation from scratch:

- Considerably better and faster parsing

### v0.0.1

Initial release of contains the following features:

- Runs lines of the C++ file as you type
- Shows output of the code beside each line
</details>

</br>

## For more information or help

- [Email (abcd49800@gmail.com)](mailto:abcd49800@gmail.com)
- [Discord (CodePlayground)](https://discord.gg/dquNGYwfnW)

**Enjoy!**
