import BigNumber from "bignumber.js";
import {Dictionary, each, map, findIndex} from "lodash";

import {Coin, Wallet} from "../../";
import {Destructable} from "../../Utils/Destructable";
import {Api, Events} from "../";

import * as Tracker from './Tracker';


interface INetworkClient extends Destructable {
    getCoin(): Coin.CoinInterface;

    getApiUrl(): string;

    getWSUrl(): string;

    getOptions(): Api.AdapterOptionInterface;

    getBlock(blockHash: string): Promise<Wallet.Entity.Block>;

    getTx(txid: string): Promise<Wallet.Entity.WalletTransaction | null>;

    getAddressTxs(address: string): Promise<Wallet.Entity.WalletTransaction[]>;

    getBulkAddrsTxs(addrs: string[]): Promise<Wallet.Entity.WalletTransaction[]>;

    broadCastTransaction(transaction: Coin.Transaction.Transaction): Promise<string>;

    getTracker(): Tracker.ITrackerClient;
}

interface GasPrice {
    low: BigNumber,
    standard: BigNumber,
    high: BigNumber
}

interface IEthereumNetworkClient extends INetworkClient {
    getGasPrice(): Promise<GasPrice>;

    estimateGas(address: Coin.Key.Address, value: BigNumber): Promise<BigNumber>;
}


abstract class NetworkClient implements INetworkClient {

    protected onBlocksCbs: Events.NewBlockCallback[];
    protected onAddrTXCbs: Dictionary<Events.NewTxCallback[]>;

    constructor(protected readonly coin: Coin.CoinInterface,
                protected readonly options: Api.AdapterOptionInterface) {
    }

    abstract getTx(txid: string): Promise<Wallet.Entity.WalletTransaction | null>;

    abstract getBlock(blockHash: string): Promise<Wallet.Entity.Block>;

    abstract getAddressTxs(address: string): Promise<Wallet.Entity.WalletTransaction[]>;

    abstract broadCastTransaction(transaction: Coin.Transaction.Transaction): Promise<string>;

    /**
     * @returns {CoinInterface}
     */
    getCoin(): Coin.CoinInterface {
        return this.coin;
    }

    /**
     * @returns {string}
     */
    getApiUrl(): string {
        return this.options.url;
    }

    /**
     * @returns {string}
     */
    getWSUrl(): string {
        return this.options.wsUrl;
    }

    /**
     * @returns {boolean}
     */
    enabledWS(): boolean {
        return !!this.getWSUrl();
    }

    /**
     * @returns {AdapterOptionInterface}
     */
    getOptions(): Api.AdapterOptionInterface {
        return this.options;
    }

    /**
     * @todo Must be implement this method for:
     * @see {EtherscanNetworkClient}
     * @see {BlockcypherBIPNetworkClient}
     *
     * @returns {ITrackerClient}
     */
    getTracker(): Tracker.ITrackerClient {
        throw new Error("Tracker Client must be implement!");
    }

    /**
     * @todo Must be implement this method for:
     * @see {InfuraNetworkClient}
     * @see {EtherscanNetworkClient}
     * @see {BlockcypherBIPNetworkClient}
     *
     * @param {string[]} addrs
     * @returns {Promise<WalletTransaction[]>}
     */
    getBulkAddrsTxs(addrs: string[]): Promise<Wallet.Entity.WalletTransaction[]> {

        const promisMap = map(addrs, (addr: string) => {
            return this.getAddressTxs(addr);
        });

        return Promise.all(promisMap)
            .then((txChunks: Array<Wallet.Entity.WalletTransaction[]>) => {
                const txList = [];

                each(txChunks, (txs) => {
                    each(txs, (tx) => {
                        const indx = findIndex(txList, {txid: tx.txid});
                        if (indx >= 0) {
                            txList[indx] = Object.assign(txList[indx], tx);
                        } else {
                            txList.push(tx);
                        }
                    });
                });

                return txList;
            });
    }

    destruct() {
        this.onBlocksCbs = [];
        this.onAddrTXCbs = {};
    }
}


export {
    Tracker,
    INetworkClient,
    GasPrice,
    IEthereumNetworkClient,
    NetworkClient
}