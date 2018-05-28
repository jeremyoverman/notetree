export interface INotebookNode {
    resource: string;
    name: string;
    isDirectory?: boolean;
}

export interface INote {
    title: string;
    content: string;
    tags?: string[];
}

export type INodeArray = Promise<INotebookNode[]> | INotebookNode[];

export default abstract class NotebookProvider {
    abstract getNotebooks (): INodeArray;
    abstract getNotes (node: INotebookNode): INodeArray;
    abstract openNote (resource: string): Promise<INote> | INote;
    abstract saveNote(guid: string, title: string, contents: string): Promise<any>;
}