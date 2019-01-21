import { map, find } from 'lodash';
import { EventEmitter } from 'events';
import { Wallet, Debug } from '../../../';
import { Destructable } from '../../../utils';
import { Events } from '../../';
import { INetworkClient } from '../';

export enum TrackerEvent {
    Connect = 'connect',
    Disconnect = 'disconnect',
    ConnectionError = 'connection_error',
    Error = 'error',
    Block = 'block',
    Tx = 'tx'
}

export interface ITrackerClient extends Destructable, EventEmitter {
    onConnect(callback): ITrackerClient;

    onBlock(callback: Events.NewBlockCallback): ITrackerClient;

    onAddrsTx(addrs: string[], callback: Events.NewTxCallback): ITrackerClient;

    onTransactionConfirm(txid: string, callback: Events.NewTxCallback): ITrackerClient;

    onDisconnect(callback: (...args: any[]) => void): ITrackerClient;

    onConnectionError(callback: (...args: any[]) => void): ITrackerClient;

    isAddrTrack(addr: string | Buffer): boolean;
}

export interface IAddressTrackEvent {
    addrs: Buffer[];
    callback?: Events.NewTxCallback;
}


export class TrackerClient<T extends INetworkClient> extends EventEmitter implements ITrackerClient {
    protected debug;
    protected readonly networkClient: T;
    protected addrTxEvents: IAddressTrackEvent = {
        addrs: [],
        callback: undefined,
    };


    public constructor(networkClient: T) {
        super();

        this.networkClient = networkClient;
        this.debug = Debug.create('TRACKER_CLIENT::' + this.networkClient.getCoin().getUnit().toString());
    }


    public onConnect(callback): ITrackerClient {
        this.on(TrackerEvent.Connect, callback);

        return this;
    }


    public onDisconnect(callback): ITrackerClient {
        this.on(TrackerEvent.Disconnect, callback);

        return this;
    }


    public onConnectionError(callback): ITrackerClient {
        this.on(TrackerEvent.ConnectionError, callback);

        return this;
    }


    public onBlock(callback: Events.NewBlockCallback): ITrackerClient {
        this.on(TrackerEvent.Block, callback);

        return this;
    }


    public onTransactionConfirm(txid: string, callback: Events.NewTxCallback): ITrackerClient {
        this.once(`tx.${txid}`, callback);

        return this;
    }


    public onAddrsTx(addrs: string[], callback: Events.NewTxCallback): ITrackerClient {
        const coinKeyFormatter = this.networkClient.getCoin().getKeyFormat();

        const addrBuffers: Buffer[] = map(addrs, (addr: string) => {
            return coinKeyFormatter.parseAddress(addr).getData();
        });

        this.addrTxEvents = {
            addrs: addrBuffers,
            callback: callback,
        };

        return this;
    }


    public isAddrTrack(address: string | Buffer): boolean {
        if (!address) {
            // For the case, when no FROM or TO in transaction
            return false;
        }

        let buffer;
        if (address instanceof Buffer) {
            buffer = address;
        } else {
            const coinKeyFormatter = this.networkClient.getCoin().getKeyFormat();
            try {
                buffer = coinKeyFormatter.parseAddress(address).getData();
            } catch (error) {
                this.debug("Can not parse address %s", address);

                return false;
            }
        }

        const { addrs = [] } = this.addrTxEvents;

        return !!find(addrs, (addr: Buffer) => {
            return buffer.equals(addr);
        });
    }


    protected fireNewBlock(block: Wallet.Entity.Block): boolean {
        return this.emit(TrackerEvent.Block, block);
    }


    protected fireConnect(): boolean {
        return this.emit(TrackerEvent.Connect);
    }


    protected fireDisconnect(): boolean {
        return this.emit(TrackerEvent.Disconnect);
    }


    protected fireConnectionError(error: Error): boolean {
        return this.emit(TrackerEvent.ConnectionError, error);
    }

    protected async fireTxidConfirmation(tx: Wallet.Entity.WalletTransaction): Promise<void> {
        this.emit(`tx.${tx.txid}`, tx);
    }

    public destruct() {
        this.addrTxEvents = { addrs: [], callback: undefined };

        this.removeAllListeners('tx.*');
        this.removeAllListeners('addr.*');
    }
}
