import * as vscode from 'vscode';
import EvernoteProvider from './providers/evernote';
import { NotebookTreeProvider } from './noteTree';
import { NoteProvider } from './noteProvider';
import { INotebookNode } from './implementations/provider';

export async function activate(context: vscode.ExtensionContext) {
    let noteProvider = new EvernoteProvider();
    let treeDataProvider = new NotebookTreeProvider(noteProvider);
    let fsProvider = new NoteProvider(noteProvider);

    vscode.workspace.registerFileSystemProvider('vsnote', fsProvider, {
        isCaseSensitive: true
    });

    vscode.window.createTreeView('notes', {
        treeDataProvider
    });

    vscode.commands.registerCommand('vsnote.search', async () => {
        let query = await vscode.window.showInputBox({
            prompt: 'Search for notes'
        });

        if (!query) { return; }

        let results = await noteProvider.searchNotes(query);

        let choice = await vscode.window.showQuickPick(results.map((result, idx) => {
            return `${idx}: ${result.name}`;
        }), {
            canPickMany: false,
            placeHolder: 'Search Results'
        });

        if (!choice) { return; }

        let element = results[Number(choice.split(':')[0])];
        let uri = vscode.Uri.parse(`vsnote://note/${element.name}.md/?guid=${element.resource}`);

        vscode.commands.executeCommand('vsnote.openNote', uri);

    });

    vscode.commands.registerCommand('vsnote.refresh', () => {
        treeDataProvider.onDidChangeTreeDataEvent.fire();
    });

    vscode.commands.registerCommand('vsnote.newNotebook', async () => {
        let name = await vscode.window.showInputBox({
            prompt: 'Create notebook',
        });

        if (!name) { return; }

        await noteProvider.createNotebook(name);

        treeDataProvider.onDidChangeTreeDataEvent.fire();
    });

    vscode.commands.registerCommand('vsnote.newNote', async (ctx: INotebookNode) => {
        let name = await vscode.window.showInputBox({
            prompt: 'Create note',
        });

        if (!name) { return; }

        let element = await noteProvider.createNote(ctx.resource, name);

        if (element) {
            treeDataProvider.onDidChangeTreeDataEvent.fire();

            let uri = vscode.Uri.parse(`vsnote://note/${element.name}.md/?guid=${element.resource}`);

            vscode.commands.executeCommand('vsnote.openNote', uri);
        }
    });

    vscode.commands.registerCommand('vsnote.deleteNote', async (ctx: INotebookNode) => {
        if (!ctx) { return; }

        let answer = await vscode.window.showQuickPick([
            'Yes',
            'No'
        ], {
            canPickMany: false,
            placeHolder: `Delete note ${ctx.name}?`
        });

        if (answer === 'Yes') {
            await noteProvider.deleteNote(ctx.resource);

            treeDataProvider.onDidChangeTreeDataEvent.fire();
        }
    });

    vscode.commands.registerCommand('vsnote.renameNote', async (ctx: INotebookNode) => {
        let newName = await vscode.window.showInputBox({
            prompt: 'Rename note',
            value: ctx.name
        });

        if (!newName) { return; }

        noteProvider.renameNote(ctx.resource, newName);
        treeDataProvider.onDidChangeTreeDataEvent.fire();
    });

    vscode.commands.registerCommand('vsnote.openNote', async uri => {
        if (!uri) { return; }
        
        let document;

        try {
            document = await vscode.workspace.openTextDocument(uri);
        } catch (err) {
            vscode.window.showErrorMessage(err.message);
        }

        if (document) {
            vscode.window.showTextDocument(document);
        }
    });
}