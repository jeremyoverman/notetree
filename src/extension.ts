import * as vscode from 'vscode';
import EvernoteProvider from './providers/evernote';
import { NotebookTreeProvider } from './noteTree';
import NotebookProvider, { INotebookNode } from './implementations/provider';
import { NoteProvider } from './noteProvider';

interface INoteProviders {
    [name: string]: new () => NotebookProvider;
}

const NOTE_PROVIDERS: INoteProviders = {
    evernote: EvernoteProvider
};

export async function activate(context: vscode.ExtensionContext) {
    let noteProviderName = vscode.workspace.getConfiguration().notetree.provider;

    let noteProvider = new NOTE_PROVIDERS[noteProviderName]();
    let treeDataProvider = new NotebookTreeProvider(noteProvider);
    let fsProvider = new NoteProvider(noteProvider);

    vscode.workspace.registerFileSystemProvider('notetree', fsProvider, {
        isCaseSensitive: true
    });

    vscode.window.createTreeView('notes', {
        treeDataProvider
    });

    vscode.commands.registerCommand('notetree.search', async () => {
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
        let uri = vscode.Uri.parse(`notetree://note/${element.name}.md/?guid=${element.resource}`);

        vscode.commands.executeCommand('notetree.openNote', uri);

    });

    vscode.commands.registerCommand('notetree.refresh', () => {
        treeDataProvider.onDidChangeTreeDataEvent.fire();
    });

    vscode.commands.registerCommand('notetree.newNotebook', async () => {
        let name = await vscode.window.showInputBox({
            prompt: 'Create notebook',
        });

        if (!name) { return; }

        await noteProvider.createNotebook(name);

        treeDataProvider.onDidChangeTreeDataEvent.fire();
    });

    vscode.commands.registerCommand('notetree.newNote', async (ctx: INotebookNode) => {
        let name = await vscode.window.showInputBox({
            prompt: 'Create note',
        });

        if (!name) { return; }

        let element = await noteProvider.createNote(ctx.resource, name);

        if (element) {
            treeDataProvider.onDidChangeTreeDataEvent.fire();

            let uri = vscode.Uri.parse(`notetree://note/${element.name}.md/?guid=${element.resource}`);

            vscode.commands.executeCommand('notetree.openNote', uri);
        }
    });

    vscode.commands.registerCommand('notetree.deleteNote', async (ctx: INotebookNode) => {
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

    vscode.commands.registerCommand('notetree.renameNote', async (ctx: INotebookNode) => {
        let newName = await vscode.window.showInputBox({
            prompt: 'Rename note',
            value: ctx.name
        });

        if (!newName) { return; }

        noteProvider.renameNote(ctx.resource, newName);
        treeDataProvider.onDidChangeTreeDataEvent.fire();
    });

    vscode.commands.registerCommand('notetree.openNote', async uri => {
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