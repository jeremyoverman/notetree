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
export type INodeOrUndef =  Promise<INotebookNode | undefined> | INotebookNode | undefined;

export default abstract class NotebookProvider {
    abstract getNotebooks(): INodeArray;
    abstract getNotes(node: INotebookNode): INodeArray;
    abstract openNote(resource: string): Promise<INote> | INote;
    abstract saveNote(guid: string, title: string, contents: string): Promise<any> | any;
    abstract renameNote(guid: string, title: string): Promise<any> | any;
    abstract createNote(notebookGuid: string, title: string): INodeOrUndef;
    abstract createNotebook(title: string): INodeOrUndef;
    abstract deleteNote(guid: string): Promise<any> | any;
    abstract searchNotes(query: string): Promise<INotebookNode[]> | INotebookNode[];
}