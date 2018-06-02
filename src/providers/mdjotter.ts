import NotebookProvider, { INotebookNode } from "../implementations/provider";
import * as vscode from 'vscode';
import * as jotter from 'mdjotter-api';

export default class MDJotterAdapter implements NotebookProvider {
    jotter: jotter.MDJotter;

    constructor () {
        let config = vscode.workspace.getConfiguration().notetree.mdjotter;

        this.jotter = new jotter.MDJotter(Object.assign({
            hostname: 'http://mdjotter.com',
            port: 3000,
        }, {
            hostname: config.hostname,
            port: config.port,
            username: config.username,
            password: config.password
        }));
    }

    async connect() {
        return this.jotter.connect();
    }

    async getNotebooks () {
        let rootContainers = await this.jotter.getRootContainers();

        return rootContainers.map(container => {
            return {
                resource: container.id,
                name: container.name,
                isDirectory: true
            };
        });
    }

    async getChildren (node: INotebookNode) {
        let children = await this.jotter.getChildren(node.resource);

        let notes = children.notes.map(note => {
            return {
                resource: note.id,
                name: note.title,
                isDirectory: false
            };
        });

        let containers = children.containers.map(container => {
            return {
                resource: container.id,
                name: container.name,
                isDirectory: true
            };
        });

        return [...notes, ...containers];
    }

    async openNote (resource: number) {
        let note = await this.jotter.getNote(resource);

        return {
            title: note.title,
            content: note.contents || ''
        };
    }

    async createNote (notebookId: number, title: string) {
        let note = await this.jotter.createNote({
            title,
            containerId: notebookId
        });
        
        return {
            resource: note.id,
            name: title,
            isDirectory: false
        };
    }

    async createNotebook (name: string, parent?: number) {
        let container = await this.jotter.createContainer({ name });

        return {
            resource: container.id,
            name: name,
            isDirectory: true
        };
    }

    async deleteNote (id: number) {
        return this.jotter.deleteNote(id);
    }

    async saveNote (id: number, title: string, contents: string) {
        return this.jotter.updateNote(id, { title, contents });
    }

    async renameNote (id: number, title: string) {
        return this.jotter.updateNote(id, { title });
    }

    async searchNotes (query: string) {
        let notes = await this.jotter.searchNotes(query);

        return notes.map(note => {
            return {
                resource: note.id,
                name: note.title,
                isDirectory: false
            };
        });
    }

    async createSubfolder (parentId: number, name: string) {
        let container = await this.jotter.createContainer({ parentId, name });

        return {
            resource: container.id,
            name: container.name,
            isDirectory: true
        };
    }

    async deleteContainer (id: number) {
        return this.jotter.deleteContainer(id);
    }
}