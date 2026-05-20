export interface Statement<Row = any, Params = any> {
    run(...params: any[]): {
        changes: number;
        lastInsertRowid: number | bigint;
    };
    get(...params: any[]): Row | undefined;
    all(...params: any[]): Row[];
}
export interface DatabaseInterface {
    run(sql: string, ...params: any[]): {
        changes: number;
        lastInsertRowid: number | bigint;
    };
    prepare<Row = any, Params = any>(sql: string): Statement<Row, Params>;
    close(): void;
}
interface DatabaseConstructor {
    new (path?: string): DatabaseInterface;
}
declare const TypedDatabase: DatabaseConstructor;
export { TypedDatabase as Database };
export type Database = DatabaseInterface;
//# sourceMappingURL=sqlite.d.ts.map