export interface INotebookNode {
    resource: any;
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
    connect?: () => Promise<any>;
    createSubfolder?: (parentResource: any, title: string) => Promise<INotebookNode> | INotebookNode;
    deleteContainer?: (resource: any) => Promise<any> | any;
    
    abstract getNotebooks(): INodeArray;
    abstract getChildren(node: INotebookNode): INodeArray;
    abstract openNote(resource: any): Promise<INote> | INote;
    abstract saveNote(resource: any, title: string, contents: string): Promise<any> | any;
    abstract renameNote(resource: any, title: string): Promise<any> | any;
    abstract createNote(resource: any, title: string): INodeOrUndef;
    abstract createNotebook(title: string): INodeOrUndef;
    abstract deleteNote(resource: any): Promise<any> | any;
    abstract searchNotes(query: string): Promise<INotebookNode[]> | INotebookNode[];
}