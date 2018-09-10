import BigNumber from 'bignumber.js';
import BitcoinJS from 'bitcoinjs-lib';
import { Constants, Coin } from '../../';
import { BIPGenericCoin } from '../bip-generic-coin';

export class LitecoinTestnet extends BIPGenericCoin {

    public getUnit(): Coin.Unit {
        return Coin.Unit.LTCt;
    }

    public getName(): string {
        return 'Litecoin Test';
    }

    public getHDCoinType(): number {
        return 2;
    }

    public networkInfo(): BitcoinJS.Network {
        return {
            bip32: {
                'public': 0x043587CF,
                'private': 0x04358394,
            },
            messagePrefix: '\x19Litecoin Test Signed Message:\n',
            pubKeyHash: 0x6f,
            scriptHash: 0xc4,
            wif: 0xef,
            bech32: 'tltc',
        };
    }

    public get defaultFeePerByte(): BigNumber {
        return new BigNumber(200).div(Constants.SATOSHI_PER_COIN);
    }

    public get minFeePerByte(): BigNumber {
        return new BigNumber(100).div(Constants.SATOSHI_PER_COIN);
    }
}
