import BigNumber from 'bignumber.js';
import BitcoinJS  from 'bitcoinjs-lib';
import { Constants, Coin } from '../../';
import { BIPGenericCoin } from '../BIPGenericCoin';

export default class Bitcoin extends BIPGenericCoin {

    public isSegWitAvailable() {
        return true;
    }

    public getUnit(): Coin.Unit {
        return Coin.Unit.BTC;
    }

    public getName(): string {
        return 'Bitcoin';
    }

    public getHDCoinType(): number {
        return 0;
    }

    public networkInfo(): BitcoinJS.Network {
        return {
            bip32: {
                "public": 0x0488b21e,
                "private": 0x0488ade4,
            },
            messagePrefix: '\x19Bitcoin Signed Message:\n',
            pubKeyHash: 0x00,
            scriptHash: 0x05,
            wif: 0x80,
        };
    }

    public get defaultFeePerByte(): BigNumber {
        return new BigNumber(8).div(Constants.SATOSHI_PER_COIN);
    }
}
