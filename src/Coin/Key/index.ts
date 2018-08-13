import { OptionsInterface } from '../Options';

export { BIPKeyFormat } from './BIPKeyFormat';
export { EthereumKeyFormat } from './EthereumKeyFormat';

export interface FormatInterface {
    isValidAddress(address: string): boolean;

    isValidPublicKey(publicKey: string): boolean;

    isValidPrivateKey(privateKey: string): boolean;

    parseAddress(address: string): Address;

    parsePublicKey(publicKey: string): Public;

    parsePrivateKey(privateKey: string): Private;

    publicToAddress(publicKey: Public): Address;

    formatAddress(version: number, buffer: Buffer, options?: any): string;

    formatPublicKey(buffer: Buffer, options?: any): string;

    formatPrivateKey(buffer: Buffer, options?: any): string;
}

export class Address {
    constructor(protected readonly version: number, protected readonly address: Buffer, protected readonly formatter: FormatInterface) {

    }

    getVersion(): number {
        return this.version;
    }

    toBuffer(): Buffer {
        return this.address;
    }

    toString(options?: any): string {
        return this.formatter.formatAddress(this.getVersion(), this.toBuffer(), options);
    }
}

export class Public {
    constructor(protected readonly key: Buffer, protected readonly formatter: FormatInterface) {

    }

    toBuffer(): Buffer {
        return this.key;
    }

    toAddress(): Address {
        return this.formatter.publicToAddress(this);
    }

    toString(options?: any): string {
        return this.formatter.formatPublicKey(this.toBuffer(), options);
    }
}

export class Private {
    constructor(protected readonly key: Buffer, protected readonly formatter: FormatInterface) {

    }

    toBuffer(): Buffer {
        return this.key;
    }

    toString(options?: OptionsInterface): string {
        return this.formatter.formatPrivateKey(this.toBuffer(), options);
    }
}
