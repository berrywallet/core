import { forEach } from 'lodash';
import { Coin, Wallet, Debug } from '../';
import * as Networking from './';
import { Destructable } from '../Utils/Destructable';

export interface ClientUnit {
    options: Networking.Api.TAdapterOption;
    client: Networking.Clients.INetworkClient;
    banned: boolean;
}

export interface NetworkProviderInterface extends Destructable {

    getClient(index: number): Networking.Clients.INetworkClient;

    broadCastTransaction(transaction: Coin.Transaction.Transaction): Promise<string>;

    getAddressTxs(address: string): Promise<Wallet.Entity.WalletTransaction[]>;

    getTx(txid: string): Promise<Wallet.Entity.WalletTransaction | undefined>;

    getTracker(): Networking.Clients.Tracker.ITrackerClient;

    onNewBlock(callback: Networking.Events.NewBlockCallback): void;

    onAddrsTx(address: string[], callback: Networking.Events.NewTxCallback): void;

    onTransactionConfirm(txid: string, callback: Networking.Events.NewTxCallback): void;
}


export class NetworkProvider implements NetworkProviderInterface {

    protected clientList: ClientUnit[] = [];
    protected currentClientIndex = 0;
    protected debug: Debug.BerryDebug;

    public constructor(protected readonly coin: Coin.CoinInterface) {

        this.debug = Debug.create('NetworkProvider:' + this.coin.getUnit());

        const clientOptions = Networking.Adapter.getNetworkAdapters(coin);

        if (clientOptions.length < 1) {
            throw new Error(`No providers for ${coin.getUnit()}`);
        }

        forEach(clientOptions, (props: Networking.Api.TAdapterProps, indx: number) => {
            const client = Networking.createClient(this.coin, props);
            this.clientList.push({
                client: client,
                banned: false,
                options: props.options,
            } as ClientUnit);
        });
    }

    protected getClientCount(): number {
        return this.clientList.length;
    }

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
     * @TODO Need add normal client observer
     */
    public getAddressTxs(address: string): Promise<Wallet.Entity.WalletTransaction[]> {
        const client = this.getClient(0);

        return client
            .getAddressTxs(address)
            .catch(this.catchError('getAddressTxs', client));
    }

    public getBulkAddrTxs(addrs: string[]): Promise<Wallet.Entity.WalletTransaction[]> {
        const client = this.getClient(0);

        return client.getBulkAddrsTxs(addrs).catch(this.catchError('getBulkAddrTxs', client));
    }

    public getTx(txid: string): Promise<Wallet.Entity.WalletTransaction | undefined> {
        const client = this.getClient(0);

        return client.getTx(txid).catch(this.catchError('getTx', client));
    }

    public getTracker(): Networking.Clients.Tracker.ITrackerClient {
        return this.clientList[0].client.getTracker();
    }

    public onNewBlock(callback: Networking.Events.NewBlockCallback): void {
        this.getTracker().onBlock(callback);
    }

    public onTransactionConfirm(txid: string, callback: Networking.Events.NewTxCallback) {
        this.getTracker().onTransactionConfirm(txid, callback);
    }

    public onAddrsTx(addrs: string[], callback: Networking.Events.NewTxCallback): void {
        this.getTracker().onAddrsTx(addrs, callback);
    }

    public getClient(index: number = 0): Networking.Clients.INetworkClient {
        return this.clientList[index].client;
    }

    public broadCastTransaction(transaction: Coin.Transaction.Transaction): Promise<string> {
        return this.getClient(0).broadCastTransaction(transaction);
    }

    public destruct() {
        for (let i in this.clientList) {
            if (this.clientList[i].client) {
                this.clientList[i].client.destruct();
            }

            delete this.clientList[i];
        }

        this.clientList = [];
    }

    protected catchError = (method: string, client) => {
        return (error: Error) => {
            this.debug(`ERROR in ${method}`, error.message, typeof client, client.getOptions());

            throw error;
        };
    };
}
