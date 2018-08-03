import debug, { IDebugger } from 'debug';

export type BerryDebug = (message?: any, ...optionalParams: any[]) => void;

export function create(key: string): IDebugger {
    return debug('berry:' + key);
}
