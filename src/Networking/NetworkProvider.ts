import {filter, each} from 'lodash';
import {Coin, Wallet, Utils, Debug} from "../";
import * as Networking from "./";
import {Destructable} from "../Utils/Destructable";


interface ClientUnit {
    options: Networking.Api.AdapterOptionInterface;
    client: Networking.Clients.INetworkClient;
    banned: boolean;
}


interface NetworkProviderInterface extends Destructable {

    getClient(index: number): Networking.Clients.INetworkClient;

    broadCastTransaction(transaction: Coin.Transaction.Transaction): Promise<string>;

    getAddressTxs(address: string): Promise<Wallet.Entity.WalletTransaction[]>;

    getTx(txid: string): Promise<Wallet.Entity.WalletTransaction>;

    getTracker(): Networking.Clients.Tracker.ITrackerClient;

    onNewBlock(callback: Networking.Events.NewBlockCallback): void;

    onAddrsTx(address: string[], callback: Networking.Events.NewTxCallback): void;

    onTransactionConfirm(txid: string, callback: Networking.Events.NewTxCallback): void;
}


class NetworkProvider implements NetworkProviderInterface {

    protected clientList: ClientUnit[] = [];
    protected currentClientIndex = 0;
    protected debug: Debug.BerryDebug;

    /**
     * @param {CoinInterface} coin
     */
    constructor(protected readonly coin: Coin.CoinInterface) {

        this.debug = Debug.create('NetworkProvider:' + this.coin.getUnit());

        const clientOptions = Networking.Adapter.getNetworkAdapters(coin);

        if (clientOptions.length < 1) {
            throw new Error(`No providers for ${coin.getUnit()}`);
        }

        each(clientOptions, (props: Networking.Api.AdapterPropsInterface, indx: number) => {
            const client = Networking.createClient(this.coin, props);
            this.clientList.push({
                client: client,
                banned: false,
                options: props.options
            } as ClientUnit);
        });
    }

    /**
     * @returns {number}
     */
    protected getClientCount(): number {
        return this.clientList.length;
    }

    /**
     * @param {number} depth
     * @returns {INetworkClient}
     */
    protected rotateClient(depth: number = 0): Networking.Clients.INetworkClient {
        if (depth > 0 && depth > this.getClientCount()) {
            throw new Error('All clients are wrong..!');
        }

        this.currentClientIndex++;
        if (this.currentClientIndex >= this.getClientCount()) {
            this.currentClientIndex = 0;
        }

        return this.clientList[this.currentClientIndex].client;
    }

    /**
     * @param {string} address
     * @returns {Promise<WalletTransaction[]>}
     * @TODO Need add normal client observer
     */
    public getAddressTxs(address: string): Promise<Wallet.Entity.WalletTransaction[]> {
        const client = this.getClient(0);

        return client
            .getAddressTxs(address)
            .catch(this.catchError('getAddressTxs', client));
    }

    /**
     * @param {string[]} addrs
     * @returns {Promise<WalletTransaction[]>}
     */
    public getBulkAddrTxs(addrs: string[]): Promise<Wallet.Entity.WalletTransaction[]> {
        const client = this.getClient(0);

        return client.getBulkAddrsTxs(addrs).catch(this.catchError('getBulkAddrTxs', client));
    }

    /**
     * @param {string} txid
     * @returns {Promise<WalletTransaction>}
     */
    public getTx(txid: string): Promise<Wallet.Entity.WalletTransaction | null> {
        const client = this.getClient(0); // this.rotateClient(0);

        return client.getTx(txid).catch(this.catchError('getTx', client));
    }

    /**
     * @returns {ITrackerClient}
     */
    getTracker(): Networking.Clients.Tracker.ITrackerClient {
        return this.clientList[0].client.getTracker();
    }

    /**
     * @param {NewBlockCallback} callback
     */
    onNewBlock(callback: Networking.Events.NewBlockCallback): void {
        this.getTracker().onBlock(callback);
    }

    /**
     * @param {string} txid
     * @param {NewTxCallback} callback
     */
    onTransactionConfirm(txid: string, callback: Networking.Events.NewTxCallback) {
        this.getTracker().onTransactionConfirm(txid, callback);
    }

    /**
     * @param {string[]} addrs
     * @param {NewTxCallback} callback
     */
    onAddrsTx(addrs: string[], callback: Networking.Events.NewTxCallback): void {
        this.getTracker().onAddrsTx(addrs, callback);
    }

    /**
     * @param {number} index
     * @returns {INetworkClient}
     */
    getClient(index: number = 0): Networking.Clients.INetworkClient {
        return this.clientList[index].client;
    }

    /**
     * @param {Transaction} transaction
     * @returns {Promise<string>} transaction TXID transaction
     */
    broadCastTransaction(transaction: Coin.Transaction.Transaction): Promise<string> {
        return this.getClient(0).broadCastTransaction(transaction);
    }

    destruct() {
        for (let i in this.clientList) {
            if (this.clientList[i].client) {
                this.clientList[i].client.destruct();
            }

            delete this.clientList[i];
        }

        this.clientList = [];
    }

    /**
     * @param {string} method
     * @param client
     * @returns {(error: Error) => void}
     */
    protected catchError = (method: string, client) => {
        return (error: Error) => {
            this.debug(`ERROR in ${method}`, error.message, typeof client, client.getOptions());

            throw error;
        }
    }
}


export {
    ClientUnit,
    NetworkProviderInterface,
    NetworkProvider
}
