import {each} from 'lodash';

import * as Coin from '../../Coin';
import * as Wallet from '../../Wallet';



export interface IWDGenerator {
    fill(): Promise<Wallet.Provider.WDProvider>;
}


export abstract class WDGenerator implements IWDGenerator {

    protected readonly coin: Coin.CoinInterface;
    protected readonly seed: Buffer;
    protected readonly wdProvider: Wallet.Provider.WDProvider;

    constructor(coin: Coin.CoinInterface, seed: Buffer) {
        this.coin = coin;
        this.seed = seed;

        this.wdProvider = Wallet.Provider.WDProvider.makeEmpty(this.coin);
    }

    protected resolveAddrsTxs(txs: Wallet.Entity.WalletTransaction[]) {
        each(txs, (tx: Wallet.Entity.WalletTransaction) => this.wdProvider.tx.add(tx));
    };

    abstract fill(): Promise<Wallet.Provider.WDProvider>;
}
