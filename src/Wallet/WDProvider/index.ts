import {each} from 'lodash';

import {Coin, Networking} from '../../';
import {Entity} from '../';

import {BalanceCalculator} from "./Providers/BalanceCalculator";
import AddressProvider from './Providers/AddressProvider';
import TransactionProvider from './Providers/TransactionProvider';
import UpdateProvider from './Providers/UpdateProvider';
import {PrivateProviderInterface, createPrivateProvider} from "./Providers/PrivateProvider";
import {Destructable} from "../../Utils/Destructable";

export type WalletDataListener = (newWd: Entity.WalletData, oldWd: Entity.WalletData) => void;
import {EventEmitter} from 'events';

class WDProvider extends EventEmitter implements Destructable {
    protected walletData: Entity.WalletData;
    protected eventListeners: WalletDataListener[] = [];
    protected networkProvider: Networking.NetworkProvider;

    /**
     * @param {WalletData} walletData
     */
    constructor(walletData: Entity.WalletData) {
        super();
        
        this.walletData = {...walletData};
    }

    /**
     * @param {CoinInterface} coin
     *
     * @returns {WDProvider}
     */
    static makeEmpty(coin: Coin.CoinInterface): WDProvider {
        return new WDProvider({
            coin: coin.getUnit(),
            addresses: [],
            txs: {}
        });
    }

    /**
     * @returns {CoinInterface}
     */
    get coin(): Coin.CoinInterface {
        return Coin.makeCoin(this.walletData.coin);
    }

    /**
     * @returns {WDBalance}
     */
    get balance(): Entity.WDBalance {
        return new BalanceCalculator(this).calc();
    }

    /**
     * @returns {AddressProvider}
     */
    get address(): AddressProvider {
        return new AddressProvider(this);
    }

    /**
     * @returns {AddressProvider}
     */
    get tx(): TransactionProvider {
        return new TransactionProvider(this);
    }

    /**
     * @returns {WalletData}
     */
    getData(): Entity.WalletData {
        return this.walletData;
    }

    /**
     * @returns {UpdateProvider}
     */
    getUpdater(): UpdateProvider {
        return new UpdateProvider(this);
    }

    /**
     * @param newWDState
     */
    setData(newWDState: any): void {
        const oldWd = {...this.walletData};
        this.walletData = Object.assign({}, oldWd, newWDState);

        each(this.eventListeners, (el) => {
            el(this.walletData, oldWd);
        });
    }

    /**
     * @param {WalletDataListener} eventListener
     */
    onChange(eventListener: WalletDataListener): void {
        this.eventListeners.push(eventListener);
    }

    /**
     * @returns {NetworkProvider}
     */
    getNetworkProvider(): Networking.NetworkProvider {
        if (!this.networkProvider) {
            this.networkProvider = new Networking.NetworkProvider(this.coin);
        }

        return this.networkProvider;
    }

    /**
     * @param {Buffer} seed
     * @returns {PrivateProviderInterface}
     */
    getPrivate(seed: Buffer): PrivateProviderInterface {
        return createPrivateProvider(seed, this);
    }

    destruct() {
        this.eventListeners = [];

        if (this.networkProvider) {
            this.networkProvider.destruct();
            delete this.networkProvider;
        }
    }
}

export {
    WDProvider
}
