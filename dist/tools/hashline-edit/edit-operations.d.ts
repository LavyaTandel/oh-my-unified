export interface HashlineEdit {
    type: 'replace' | 'append' | 'prepend';
    targetHash?: string;
    targetContent?: string;
    newContent: string;
    filePath: string;
}
export declare function applyHashlineEdits(content: string, edits: HashlineEdit[]): string;
//# sourceMappingURL=edit-operations.d.ts.map