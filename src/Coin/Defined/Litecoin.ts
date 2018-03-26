import {Constants, Coin} from "../../";
import {Network} from "bitcoinjs-lib";
import {BIPGenericCoin} from "../BIPGenericCoin";
import BigNumber from "bignumber.js";

export default class Litecoin extends BIPGenericCoin {

    get isSegWitAvailable(): boolean {
        return true;
    }

    getUnit(): Coin.Unit {
        return Coin.Unit.LTC;
    }

    getName(): string {
        return 'Litecoin';
    }

    getHDCoinType(): number {
        return 2;
    }

    get networkInfo(): Network {
        return {
            bip32: {
                "public": 0x019da462,
                "private": 0x019d9cfe
            },
            messagePrefix: '\x19Litecoin Signed Message:\n',
            pubKeyHash: 0x30,
            scriptHash: 0x32,
            wif: 0xb0
        };
    }

    get defaultFeePerByte(): BigNumber {
        return new BigNumber(10).div(Constants.SATOSHI_PER_COIN);
    }
}