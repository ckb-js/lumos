import { CKBComponents } from './types/api';
declare class Method {
    #private;
    get name(): string;
    constructor(node: CKBComponents.Node, options: CKBComponents.Method);
    call: (...params: (string | number | object)[]) => Promise<any>;
    getPayload: (...params: (string | number | object)[]) => {
        id: number;
        method: string;
        params: any[];
        jsonrpc: string;
    };
}
export default Method;
