const PURPOSE = 44;

export const enum AddressType {
    RECEIVE = 0,
    CHANGE = 1
}

export class Helper {
    public static getHDPath(coinType: number,
                            accountIndex: number,
                            addressType: AddressType = AddressType.RECEIVE,
                            index: number = 0
    ): string {
        return `m/${PURPOSE}'/${coinType}'/${accountIndex}'/${addressType}/${index}`;
    }

    public static getAccountHDPath(coinType: number,
                                   accountIndex: number): string {
        return `m/${PURPOSE}'/${coinType}'/${accountIndex}'`;
    }

    public static getHDPathFromAccount(addressType: AddressType = AddressType.RECEIVE,
                                       index: number = 0): string {
        return `m/${addressType}/${index}`;
    }
}