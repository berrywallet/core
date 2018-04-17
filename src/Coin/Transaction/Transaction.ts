import {TransactionScheme} from "../";

export interface Transaction {
    id: string;
    hash: Buffer;
    scheme: TransactionScheme;
    version: number;
    byteLength: number;
    isSigned: boolean;

    toBuffer(): Buffer;
}