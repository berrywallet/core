import BigNumber from "bignumber.js";
import { Dictionary, each, map, findIndex } from "lodash";
import { Coin, Wallet } from '../../';
import { Destructable } from '../../Utils/Destructable';
import { Api, Events } from '../';
import * as Tracker from './Tracker';


interface INetworkClient extends Destructable {
    getCoin(): Coin.CoinInterface;

    getApiUrl(): string;

    getWSUrl(): string;

    getOptions(): Api.AdapterOptionInterface;

    getBlock(blockHash: string): Promise<Wallet.Entity.Block>;

    getTx(txid: string): Promise<Wallet.Entity.WalletTransaction | undefined>;

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

    protected onBlocksCbs: Events.NewBlockCallback[] = [];
    protected onAddrTXCbs: Dictionary<Events.NewTxCallback[]> = {};

    constructor(protected readonly coin: Coin.CoinInterface,
                protected readonly options: Api.AdapterOptionInterface) {
    }

    abstract getTx(txid: string): Promise<Wallet.Entity.WalletTransaction | undefined>;

    abstract getBlock(blockHash: string): Promise<Wallet.Entity.Block>;

    abstract getAddressTxs(address: string): Promise<Wallet.Entity.WalletTransaction[]>;

    abstract broadCastTransaction(transaction: Coin.Transaction.Transaction): Promise<string>;

    public getCoin(): Coin.CoinInterface {
        return this.coin;
    }

    public getApiUrl(): string {
        return this.options.url;
    }

    public getWSUrl(): string {
        return this.options.wsUrl as string;
    }

    public enabledWS(): boolean {
        return !!this.getWSUrl();
    }

    public getOptions(): Api.AdapterOptionInterface {
        return this.options;
    }

    /**
     * @todo Must be implement this method for
     */
    public getTracker(): Tracker.ITrackerClient {
        throw new Error("Tracker Client must be implement!");
    }

    public async getBulkAddrsTxs(addrs: string[]): Promise<Wallet.Entity.WalletTransaction[]> {
        const promiseMap = map(addrs, (addr: string) => {
            return this.getAddressTxs(addr);
        });


        const txChunks: Array<Wallet.Entity.WalletTransaction[]> = await Promise.all(promiseMap);

        const txList = [];

        each(txChunks, (txs) => {
            each(txs, (tx) => {
                const indx = findIndex(txList, { txid: tx.txid } as any);
                if (indx >= 0) {
                    txList[indx] = Object.assign(txList[indx], tx);
                } else {
                    txList.push(tx);
                }
            });
        });

        return txList;
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
    NetworkClient,
};
