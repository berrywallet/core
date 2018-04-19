import debug from 'debug';

export type BerryDebug = (message?: any, ...optionalParams: any[]) => void;

export function create(key: string): BerryDebug {
    return debug('berry:' + key);
}