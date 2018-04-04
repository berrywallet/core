import {Constants, Coin} from "../../";
import {Network} from "bitcoinjs-lib";
import {BIPGenericCoin} from "../BIPGenericCoin";
import BigNumber from "bignumber.js";

export default class BitcoinTestnet extends BIPGenericCoin {

    get isSegWitAvailable() {
        return true;
    }

    getUnit(): Coin.Unit {
        return Coin.Unit.BTCt;
    }

    getName(): string {
        return 'Bitcoin Testnet';
    }

    getHDCoinType(): number {
        return 1;
    }

    get networkInfo(): Network {
        return {
            bip32: {
                "public": 0x043587cf,
                "private": 0x04358394
            },
            messagePrefix: '\x19Bitcoin Signed Message:\n',
            pubKeyHash: 0x6f,
            scriptHash: 0xc4,
            wif: 0xef
        };
    }

    get defaultFeePerByte(): BigNumber {
        return new BigNumber(8).div(Constants.SATOSHI_PER_COIN);
    }
}