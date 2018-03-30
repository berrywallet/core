import {Constants, Coin} from "../../";
import {Network} from "bitcoinjs-lib";
import {BIPGenericCoin} from "../BIPGenericCoin";
import BigNumber from "bignumber.js";

export default class Dash extends BIPGenericCoin {

    get isSegWitAvailable(): boolean {
        return false;
    }

    getUnit(): Coin.Unit {
        return Coin.Unit.DASH;
    }

    getName(): string {
        return 'Dash';
    }

    getHDCoinType(): number {
        return 5;
    }

    get networkInfo(): Network {
        return {
            bip32: {
                "public": 0x0488b21e,
                "private": 0x0288ade4
            },
            messagePrefix: '\x19Dash Signed Message:\n',
            pubKeyHash: 76,
            scriptHash: 16,
            wif: 204
        };
    }

    get defaultFeePerByte(): BigNumber {
        return new BigNumber(8).div(Constants.SATOSHI_PER_COIN); //4 satoshi
    }
}