export interface OptionsInterface {
    get(key: string): any

    has(key: string): boolean

    toObject(): any
}

export abstract class AbstractCoinOptions implements OptionsInterface {

    constructor(protected options?: any) {
        if (!this.options) {
            this.options = {};
        }
    }

    get(key: string): any {
        if (this.has(key)) {
            return this.options[key];
        }

        throw TypeError(`No option for key ${key}`);
    }

    has(key: string): boolean {
        return this.options.hasOwnProperty(key);
    }

    toObject(): any {
        return this.options;
    }
}

export class BIPCoinOptions extends AbstractCoinOptions {

    constructor() {
        super();
        //set default
        this.useSegWit = false;
    }

    set useSegWit(use: boolean) {
        this.options.useSegWit = use;
    }

    get useSegWit(): boolean {
        return this.options.useSegWit;
    }
}

export class EthereumOptions extends AbstractCoinOptions {

}

export function decorateOptions<T extends AbstractCoinOptions>(type: { new(any): T }, options: OptionsInterface): T {
    return new type(options.toObject());
}
