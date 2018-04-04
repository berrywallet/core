import {Constants, Coin} from "../../";
import {Network} from "bitcoinjs-lib";
import {BIPGenericCoin} from "../BIPGenericCoin";
import BigNumber from "bignumber.js";

export default class DashTestnet extends BIPGenericCoin {

    get isSegWitAvailable(): boolean {
        return false;
    }

    getUnit(): Coin.Unit {
        return Coin.Unit.DASHt;
    }

    getName(): string {
        return 'Dash Testnet';
    }

    getHDCoinType(): number {
        return 5;
    }

    get networkInfo(): Network {
        return {
            bip32: {
                "public": 0x043587cf,
                "private": 0x04358394
            },
            messagePrefix: '\x19Dash Signed Message:\n',
            pubKeyHash: 0x8c,
            scriptHash: 0x13,
            wif: 0xef
        };
    }

    get defaultFeePerByte(): BigNumber {
        return new BigNumber(8).div(Constants.SATOSHI_PER_COIN);
    }
}