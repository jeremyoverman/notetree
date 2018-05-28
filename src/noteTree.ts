import * as vscode from 'vscode';
import NotebookProvider, { INotebookNode } from './implementations/provider';

export class NotebookTreeProvider implements vscode.TreeDataProvider<INotebookNode> {
    onDidChangeTreeDataEvent = new vscode.EventEmitter<INotebookNode>();
    onDidChangeTreeData = this.onDidChangeTreeDataEvent.event;

    constructor (private readonly notebookProvider: NotebookProvider) { }

    public async getChildren (element?: INotebookNode) {
        let nodes;

        if (element) {
            nodes = await this.notebookProvider.getNotes(element);
        } else {
            nodes = await this.notebookProvider.getNotebooks();
        }

        return nodes;
    }

    public getTreeItem(element: INotebookNode): vscode.TreeItem {
        let uri = vscode.Uri.parse(`notetree://note/${element.name}.md/?guid=${element.resource}`);

        return {
            label: element.name,
            collapsibleState: element.isDirectory ? vscode.TreeItemCollapsibleState.Collapsed : void 0,
            command: element.isDirectory ? void 0 : {
                command: 'notetree.openNote',
                arguments: [uri],
                title: 'Open Note'
            },
            contextValue: element.isDirectory ? 'notetree.notebook' : 'notetree.note'
        };
    }
}