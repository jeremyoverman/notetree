import * as Evernote from 'evernote';
import * as vscode from 'vscode';
import * as turndown from 'turndown';
import * as marked from 'marked';

import NotebookProvider, { INotebookNode } from '../implementations/provider';


export default class EvernoteProvider implements NotebookProvider {
    token = vscode.workspace.getConfiguration().notetree.evernote.token;
    client = new Evernote.Client({ token: this.token });
    noteStore = this.client.getNoteStore();

    private handleError (err: any) {
        let message = err.message || `(${err.errorCode}) ${err.parameter}`;

        vscode.window.showErrorMessage(`notetree: ${message}`);

        throw err;
    }

    private async filterNotes (filter: Evernote.NoteFilter) {
        let spec = {
            includeTitle: true,
            includeLargestResourceMime: true
        };

        let result = await this.noteStore.findNotesMetadata(filter, 0, 1000, spec);

        return result.notes.map(note => {
            return {
                resource: note.guid,
                name: note.title,
                isDirectory: false
            };
        });

    }

    private mdToEnml(content: string) {
        return `
            <?xml version="1.0" encoding="UTF-8"?>
            <!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">
            <en-note>
                ${marked(content, {
                    xhtml: true
                })}
            </en-note>
        `.trim();
    }

    async getNotebooks () {
        let notebooks = await this.noteStore.listNotebooks();

        return notebooks.map(notebook => {
            return {
                resource: notebook.guid || '',
                name: notebook.name || '',
                isDirectory: true
            };
        });
    }

    async getNotes (node: INotebookNode) {
        return this.filterNotes({
            notebookGuid: node.resource
        });
    }

    async openNote(guid: string) {
        let note = await this.noteStore.getNote(guid, true, true, true, true);

        let parser = new turndown();
        let content = parser.turndown(note.content);

        return {
            title: note.title || 'New Note',
            content: content || '',
            tags: note.tagNames || []
        };
    }

    async saveNote(guid: string, title: string, content: string) {
        let enml = this.mdToEnml(content);

        return this.noteStore.updateNote({
            guid: guid,
            content: enml,
            title: title
        }).catch(err => this.handleError(err));
    }

    async renameNote(guid: string, title: string) {
        return this.noteStore.updateNote({
            guid: guid,
            title: title
        }).catch(err => this.handleError(err));
    }

    async createNote(notebookGuid: string, title: string) {
        let note = await this.noteStore.createNote({
            notebookGuid,
            title,
            content: this.mdToEnml('')
        }).catch(err => this.handleError(err));

        if (!note) { return; }

        return {
            resource: note.guid,
            name: note.title,
            isDirectory: false
        };
    } 

    async createNotebook(title: string) {
        let notebook = await this.noteStore.createNotebook({
            name: title
        }).catch(err => this.handleError(err));

        if (!notebook) { return; }

        return {
            resource: notebook.guid || '',
            name: notebook.name || '',
            isDirectory: true
        };
    }

    async deleteNote(guid: string) {
        return this.noteStore.deleteNote(guid)
            .catch(err => this.handleError(err));
    }

    async searchNotes(query: string) {
        return this.filterNotes({
            words: query,
        });
    }
}