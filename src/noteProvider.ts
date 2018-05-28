import * as vscode from 'vscode';
import NotebookProvider from './implementations/provider';
import * as textEncoding from 'text-encoding';

function getGuid (uri: vscode.Uri) {
    let params: {[param: string]: string} = {};

    uri.query.split('&').forEach(segment => {
        let split_segment = segment.split('=');

        params[split_segment[0]] = split_segment[1];
    });

    return params.guid;
}

function getTitle (uri: vscode.Uri) {
    let path = uri.path.replace(/\/$/, '');

    return path.split('/').pop() || '';
}

export class NoteProvider implements vscode.FileSystemProvider {
    readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this.handleChangeFile;

    constructor(private readonly notebookProvider: NotebookProvider) {}

    handleChangeFile() {
        return new vscode.EventEmitter();
    }

    watch(uri: vscode.Uri, options: { recursive: boolean; excludes: string[] }): vscode.Disposable {
        return new vscode.Disposable(() => {});
    }

    stat(uri: vscode.Uri): vscode.FileStat | Thenable<vscode.FileStat> {
        return {
            type: vscode.FileType.Unknown,
            ctime: Date.now(),
            mtime: Date.now(),
            size: 1024
        };
    }

    async readFile(uri: vscode.Uri): Promise<Uint8Array> {
        let guid = getGuid(uri);

        let note = await this.notebookProvider.openNote(guid);

        return new textEncoding.TextEncoder('utf-8').encode(note.content);
    }

    async writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean, overwrite: boolean }): Promise<void> {
        let guid = getGuid(uri);
        let title = getTitle(uri);
        let output = new textEncoding.TextDecoder('utf-8').decode(content);

        return this.notebookProvider.saveNote(guid, title, output);
    }

    delete(uri: vscode.Uri, options: { recursive: boolean }): void | Thenable<void> { }
    rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean }): void | Thenable<void> { }
    copy(source: vscode.Uri, destination: vscode.Uri, options: { overwrite: boolean }): void | Thenable<void> { }
    readDirectory(uri: vscode.Uri): [string, vscode.FileType][] | Thenable<[string, vscode.FileType][]> { return []; }
    createDirectory(uri: vscode.Uri): void | Thenable<void> { }
}