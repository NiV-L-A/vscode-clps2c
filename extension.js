// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode')
const fs = require('fs')
const path = require('path')
const utils = require('./utils')

/**
 * @param {vscode.ExtensionContext} context
 */

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
	context.subscriptions.push(vscode.commands.registerCommand('clps2c.CompileCLPS2C', compileCLPS2C))
	context.subscriptions.push(vscode.commands.registerCommand('clps2c.PasteExampleCLPS2C', pasteExampleCLPS2C))
	context.subscriptions.push(vscode.commands.registerCommand('clps2c.PasteAsmExample', pasteAsmExample))
	context.subscriptions.push(vscode.commands.registerCommand('clps2c.PasteAsmRegisters', pasteAsmRegisters))
	context.subscriptions.push(vscode.commands.registerCommand('clps2c.PasteAsmAritInstructions', pasteAsmAritInstructions))
	context.subscriptions.push(vscode.commands.registerCommand('clps2c.PasteAsmLogicalInstructions', pasteAsmLogicalInstructions))
	context.subscriptions.push(vscode.commands.registerCommand('clps2c.PasteAsmLoadStoreInstructions', pasteAsmLoadStoreInstructions))
	context.subscriptions.push(vscode.commands.registerCommand('clps2c.PasteAsmBranchJumpInstructions', pasteAsmBranchJumpInstructions))
	context.subscriptions.push(vscode.commands.registerCommand('clps2c.PasteAsmFloatingPointInstructions', pasteAsmFloatingPointInstructions))

    // Hover logic
    hoverDisposable = vscode.languages.registerHoverProvider('clps2c', {
        provideHover(document, position, token) {
            let Word = document.getText(document.getWordRangeAtPosition(position))
            Word = Word.toUpperCase()

            // Switch type if abbreviation
            if (utils.abbreviationMap.hasOwnProperty(Word)) {
                Word = utils.abbreviationMap[Word]
            }

            // Get command's syntax
            const content = new vscode.MarkdownString(`${utils.syntaxMap[Word]}`)
            if (content.value === 'undefined') {
                return
            }

            // Add separator and command's description
            content.appendMarkdown(`\n\n---\n\n`)
            content.appendMarkdown(utils.getDescriptionFromCommandName(Word))
            content.supportHtml = true
            content.isTrusted = true
            return new vscode.Hover(content)
        }
    })
    context.subscriptions.push(hoverDisposable)

    // Keybind comment logic (ctrl+k ctrl+c)
    const commentSelectedTextCommand = vscode.commands.registerCommand('editor.action.addCommentLine', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        // Get the selected text ranges
        const selections = editor.selections;
        // Array to store the modified selections. Used to modify selection to include the entire line
        const modifiedSelections = [];

        // Iterate over selections and comment each line
        editor.edit((editBuilder) => {
            selections.forEach((selection) => {
                const startLineIndex = selection.start.line;
                const endLineIndex = selection.end.line;

                if (startLineIndex === endLineIndex) {
                    const fullLine = editor.document.lineAt(startLineIndex).text;
                    const selectedText = editor.document.getText(selection);
                    if (fullLine !== selectedText && selectedText !== '') {
                        // Select a part of 1 full line -> /* */ at the beginning and end of that part
                        const commentedText = `/*${selectedText}*/`;
                        editBuilder.replace(selection, commentedText);
                        modifiedSelections.push(new vscode.Selection(startLineIndex, selection.start.character, endLineIndex, selection.start.character + commentedText.length));
                    } else {
                        // Select entire 1 full line -> // at the beginning of the line
                        // Cursor at any point of line -> // at the beginning of the line
                        const selectedLines = [ editor.document.lineAt(startLineIndex).text ]
                        const leftmostColumn = findLeftmostColumn(selectedLines)
                        if (leftmostColumn === -1) {
                            return;
                        }
                        const commentedText = insertStringAtIndex(fullLine, "// ", leftmostColumn);
                        editBuilder.replace(editor.document.lineAt(startLineIndex).range, commentedText);
                        modifiedSelections.push(new vscode.Selection(startLineIndex, 0, endLineIndex, fullLine.length + 3));
                    }
                } else {
                    // Select entire 2 full lines -> // at the beginning of both lines
                    // Select 2 lines, start not from the beginning -> // at the beginning of both lines

                    // Calculate at which position the // should be at
                    const selectedLines = []
                    for (let lineIndex = startLineIndex; lineIndex <= endLineIndex; lineIndex++) {
                        selectedLines.push(editor.document.lineAt(lineIndex).text)
                    }
                    const leftmostColumn = findLeftmostColumn(selectedLines)
                    for (let lineIndex = startLineIndex; lineIndex <= endLineIndex; lineIndex++) {
                        const fullLine = editor.document.lineAt(lineIndex).text;
                        if (fullLine === '') {
                            continue;
                        }
                        const commentedText = insertStringAtIndex(fullLine, "// ", leftmostColumn);
                        editBuilder.replace(editor.document.lineAt(lineIndex).range, commentedText);
                    }
                    modifiedSelections.push(new vscode.Selection(startLineIndex, 0, endLineIndex, editor.document.lineAt(endLineIndex).text.length + 3));
                }
            });
        });

        // Set the modified selections
        editor.selections = modifiedSelections;
    });
    context.subscriptions.push(commentSelectedTextCommand);

    // Keybind uncomment logic (ctrl+k ctrl+u)
    const uncommentSelectedTextCommand = vscode.commands.registerCommand('editor.action.removeCommentLine', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        // Get the selected text ranges
        const selections = editor.selections;
        // Array to store the modified selections. Used to modify selection to include the entire line
        const modifiedSelections = [];

        // Iterate over selections and comment each line
        editor.edit((editBuilder) => {
            selections.forEach((selection) => {
                const startLineIndex = selection.start.line;
                const endLineIndex = selection.end.line;
                if (startLineIndex === endLineIndex) {
                    const fullLine = editor.document.lineAt(startLineIndex).text;
                    const selectedText = editor.document.getText(selection);

                    if (!fullLine.includes("//") && !fullLine.includes("/*")) {
                        return
                    }

                    if (fullLine !== selectedText) {
                        // Select a part of 1 full line
                        if (fullLine.includes("//")) {
                            // Cursor at any point of line
                            let resultString = fullLine.replace(/\/\/\s?/, '');
                            editBuilder.replace(editor.document.lineAt(startLineIndex).range, resultString);
                            modifiedSelections.push(new vscode.Selection(startLineIndex, 0, endLineIndex, editor.document.lineAt(endLineIndex).text.length - 2));
                            editor.selections = modifiedSelections;
                        } else if (selectedText.includes("/*")) {
                            // Select /* text */
                            const uncommentedText = selectedText.replace(/\/\*|\*\//g, '');
                            editBuilder.replace(selection, uncommentedText);
                        }
                    } else {
                        // Select entire 1 full line
                        let resultString = fullLine.replace(/\/\/\s?/, '');
                        editBuilder.replace(editor.document.lineAt(startLineIndex).range, resultString);
                        modifiedSelections.push(new vscode.Selection(startLineIndex, 0, endLineIndex, editor.document.lineAt(endLineIndex).text.length - 2));
                        editor.selections = modifiedSelections;
                    }
                } else {
                    for (let lineIndex = startLineIndex; lineIndex <= endLineIndex; lineIndex++) {
                        // Select entire 2 full lines
                        // Select 2 lines, start not from the beginning
                        const fullLine = editor.document.lineAt(lineIndex).text;
                        if (fullLine === '') {
                            continue;
                        }
                        let resultString = fullLine.replace(/\/\/\s?/, '');
                        editBuilder.replace(editor.document.lineAt(lineIndex).range, resultString);
                    }
                }
            });
        });
    });
    context.subscriptions.push(uncommentSelectedTextCommand);
}

function insertStringAtIndex(string, stringToInsert, index) {
    return string.slice(0, index) + stringToInsert + string.slice(index)
}

function findLeftmostColumn(lines) {
    if (lines.length === 0) {
        return -1
    }

    let leftmostColumn = Number.MAX_SAFE_INTEGER
    for (const line of lines) {
        // Get the index of the first non-whitespace character
        const firstNonWhitespaceIndex = line.search(/\S/)

        // Update leftmostColumn if necessary
        if (firstNonWhitespaceIndex !== -1 && firstNonWhitespaceIndex < leftmostColumn) {
            leftmostColumn = firstNonWhitespaceIndex
        }
    }

    // If leftmostColumn remains unchanged, all lines are empty or contain only whitespace
    if (leftmostColumn === Number.MAX_SAFE_INTEGER) {
        return -1 // No non-whitespace characters found
    }

    return leftmostColumn
}

function compileCLPS2C() {
	utils.ConsoleWriteCLPS2C("DEBUG LOG START")

    if (canExecute() === false) {
        return
    }
    
    let Editor = vscode.window.activeTextEditor
    let InputFilePath = Editor.document.uri.fsPath
    // Unnecessary?
    // if (InputFilePath !== '') {
    //     utils.ConsoleWriteCLPS2C(`InputFilePath: ${InputFilePath}`)
    // } else {
    //     utils.ConsoleWriteErrorCLPS2C("No input file found.")
    //     return
    // }

    // If the opened file does not have .clps2c extension
    if (path.extname(InputFilePath) !== ".clps2c") {
        Msg = `The opened file '${path.basename(InputFilePath)}' does not have '.clps2c' extension.`
        utils.ConsoleWriteErrorCLPS2C(Msg)
        vscode.window.showErrorMessage(Msg)
        return
    }

    // Get values from settings.json.
    // Consider the filepath of the InputFilePath
    const configFile = path.join(path.dirname(InputFilePath), 'settings.json')
    if (!fs.existsSync(configFile)) {
        Msg = `settings.json file not found in '${path.dirname(InputFilePath)}'.`
        utils.ConsoleWriteErrorCLPS2C(Msg)
        vscode.window.showErrorMessage(Msg)
        return
    }
    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'))
    let ExeFilePath = config.exe
    const outputFilePath = config.output
    const usePnachFormat = config.pnach
    const useDTypeCode = config.dtype

    // Check if a key is not present
    if (ExeFilePath === undefined) {
        Msg = `The 'exe' key was not found in the 'settings.json' file.`
        utils.ConsoleWriteErrorCLPS2C(Msg)
        vscode.window.showErrorMessage(Msg)
        return
    } else if (outputFilePath === undefined) {
        Msg = `The 'output' key was not found in the 'settings.json' file.`
        utils.ConsoleWriteErrorCLPS2C(Msg)
        vscode.window.showErrorMessage(Msg)
        return
    } else if (usePnachFormat === undefined) {
        Msg = `The 'pnach' key was not found in the 'settings.json' file.`
        utils.ConsoleWriteErrorCLPS2C(Msg)
        vscode.window.showErrorMessage(Msg)
        return
    } else if (useDTypeCode === undefined) {
        Msg = `The 'dtype' key was not found in the 'settings.json' file.`
        utils.ConsoleWriteErrorCLPS2C(Msg)
        vscode.window.showErrorMessage(Msg)
        return
    }

    utils.ConsoleWriteCLPS2C(`ExeFilePath: ${ExeFilePath}`)
    if (ExeFilePath === "undefined") {
        ExeFilePath = 'CLPS2C-Compiler'
        utils.ConsoleWriteErrorCLPS2C(`exe key set to 'undefined'. Will try '${ExeFilePath}'`)
    }

    let Final = `${ExeFilePath} -i "${InputFilePath}"`

    if (outputFilePath === "undefined") {
        utils.ConsoleWriteErrorCLPS2C(`output key set to 'undefined'. The output file will have the same path as the input's`)
    } else {
        Final = `${Final} -o "${outputFilePath}"`
        utils.ConsoleWriteCLPS2C(`outputFilePath: ${outputFilePath}`)
    }

    if (usePnachFormat === "true") {
        Final = `${Final} -p`
        utils.ConsoleWriteCLPS2C(`usePnachFormat option set to true.`)
    } else {
        utils.ConsoleWriteErrorCLPS2C(`usePnachFormat option not set to true. usePnachFormat: ${usePnachFormat}`)
    }

    if (useDTypeCode === "true") {
        Final = `${Final} -d`
        utils.ConsoleWriteCLPS2C(`useDTypeCode option set to true.`)
    } else {
        utils.ConsoleWriteErrorCLPS2C(`useDTypeCode option not set to true. useDTypeCode: ${useDTypeCode}`)
    }

    let ExistingTerminal = findTerminalByName('CLPS2C-Terminal')
    if (ExistingTerminal === null) {
		utils.ConsoleWriteErrorCLPS2C(`Terminal not found. Creating terminal "CLPS2C-Terminal"`)
        ExistingTerminal = vscode.window.createTerminal('CLPS2C-Terminal')
    }

    Editor.document.save()
	utils.ConsoleWriteCLPS2C(`Command launched: ${Final}`)
    ExistingTerminal.sendText(Final)
	utils.ConsoleWriteCLPS2C(`DEBUG LOG END`)
}

function pasteExampleCLPS2C() {
    if (canExecute() === false) {
        return
    }
    let Editor = vscode.window.activeTextEditor
    Editor.edit(editBuilder => {
        editBuilder.insert(Editor.selection.active, utils.GetExampleCode());
    });
}

function pasteAsmExample() {
    if (canExecute() === false) {
        return
    }
    let Editor = vscode.window.activeTextEditor
    Editor.edit(editBuilder => {
        editBuilder.insert(Editor.selection.active, utils.GetAsmExampleCode());
    });
}

function pasteAsmRegisters() {
    if (canExecute() === false) {
        return
    }
    let Editor = vscode.window.activeTextEditor
    Editor.edit(editBuilder => {
        editBuilder.insert(Editor.selection.active, utils.GetAsmRegistersCode());
    });
}

function pasteAsmAritInstructions() {
    if (canExecute() === false) {
        return
    }
    let Editor = vscode.window.activeTextEditor
    Editor.edit(editBuilder => {
        editBuilder.insert(Editor.selection.active, utils.GetAsmAritInstructionsCode());
    });
}

function pasteAsmLogicalInstructions() {
    if (canExecute() === false) {
        return
    }
    let Editor = vscode.window.activeTextEditor
    Editor.edit(editBuilder => {
        editBuilder.insert(Editor.selection.active, utils.GetAsmLogicalInstructionsCode());
    });
}

function pasteAsmLoadStoreInstructions() {
    if (canExecute() === false) {
        return
    }
    let Editor = vscode.window.activeTextEditor
    Editor.edit(editBuilder => {
        editBuilder.insert(Editor.selection.active, utils.GetAsmLoadStoreInstructionsCode());
    });
}

function pasteAsmBranchJumpInstructions() {
    if (canExecute() === false) {
        return
    }
    let Editor = vscode.window.activeTextEditor
    Editor.edit(editBuilder => {
        editBuilder.insert(Editor.selection.active, utils.GetAsmBranchJumpInstructionsCode());
    });
}

function pasteAsmFloatingPointInstructions() {
    if (canExecute() === false) {
        return
    }
    let Editor = vscode.window.activeTextEditor
    Editor.edit(editBuilder => {
        editBuilder.insert(Editor.selection.active, utils.GetAsmFloatingPointInstructionsCode());
    });
}

function canExecute() {
    // If no "opened folder" is opened
    if (vscode.workspace.workspaceFolders === undefined) {
        Msg = `No opened folder found. Open folder with 'File -> Open Folder'`
        utils.ConsoleWriteErrorCLPS2C(Msg)
        vscode.window.showErrorMessage(Msg)
        return false
    }

    // The vscode.window.activeTextEditor is the file that has focus
    // If no file in focus
    if (vscode.window.activeTextEditor === undefined) {
        Msg = `No opened file detected.`
        utils.ConsoleWriteErrorCLPS2C(Msg)
        vscode.window.showErrorMessage(Msg)
        return false
    }
    return true
}

function findTerminalByName(terminalName) {
    const terminals = vscode.window.terminals
    for (const terminal of terminals) {
        if (terminal.name === terminalName) {
            return terminal
        }
    }
    return null
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
