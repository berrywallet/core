import {Constants, Coin} from "../../";
import {Network} from "bitcoinjs-lib";
import {BIPGenericCoin} from "../BIPGenericCoin";
import BigNumber from "bignumber.js";

export default class LitecoinTestnet extends BIPGenericCoin {

    get isSegWitAvailable(): boolean {
        return true;
    }

    getUnit(): Coin.Unit {
        return Coin.Unit.LTCt;
    }

    getName(): string {
        return 'Litecoin Test';
    }

    getHDCoinType(): number {
        return 2;
    }

    get networkInfo(): Network {
        return {
            bip32: {
                "public": 0x043587CF,
                "private": 0x04358394
            },
            messagePrefix: '\x19Litecoin Test Signed Message:\n',
            pubKeyHash: 111,
            scriptHash: 196,
            wif: 239
        };
    }

    get defaultFeePerByte(): BigNumber {
        return new BigNumber(10).div(Constants.SATOSHI_PER_COIN);
    }
}