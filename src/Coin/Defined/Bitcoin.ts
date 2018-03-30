import {Constants, Coin} from "../../";
import {Network} from "bitcoinjs-lib";
import {BIPGenericCoin} from "../BIPGenericCoin";
import BigNumber from "bignumber.js";

export default class Bitcoin extends BIPGenericCoin {

    get isSegWitAvailable() {
        return true;
    }

    getUnit(): Coin.Unit {
        return Coin.Unit.BTC;
    }

    getName(): string {
        return 'Bitcoin';
    }

    getHDCoinType(): number {
        return 0;
    }

    get networkInfo(): Network {
        return {
            bip32: {
                "public": 0x0488b21e,
                "private": 0x0488ade4
            },
            messagePrefix: '\x19Bitcoin Signed Message:\n',
            pubKeyHash: 0x00,
            scriptHash: 0x05,
            wif: 0x80
        };
    }

    get defaultFeePerByte(): BigNumber {
        return new BigNumber(8).div(Constants.SATOSHI_PER_COIN); //4 satoshi
    }
}