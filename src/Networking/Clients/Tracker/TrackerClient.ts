import {map, find} from 'lodash';
import {EventEmitter} from 'events';

import {Wallet, Debug} from '../../../';
import {Destructable} from "../../../Utils/Destructable";
import {Events} from "../../"
import {INetworkClient} from "../";

enum TrackerEvent {
    Connect = 'connect',
    Disconnect = 'disconnect',
    ConnectionError = 'connection_error',
    Error = 'error',
    Block = 'block',
    Tx = 'tx'
}

interface ITrackerClient extends Destructable, EventEmitter {
    onConnect(callback): ITrackerClient;

    onBlock(callback: Events.NewBlockCallback): ITrackerClient;

    onAddrsTx(addrs: string[], callback: Events.NewTxCallback): ITrackerClient;

    onTransactionConfirm(txid: string, callback: Events.NewTxCallback): ITrackerClient;

    onDisconnect(callback: (...args: any[]) => void): ITrackerClient;

    onConnectionError(callback: (...args: any[]) => void): ITrackerClient;

    isAddrTrack(addr: string | Buffer): boolean;
}

interface IAddressTrackEvent {
    addrs: Buffer[];
    callback?: Events.NewTxCallback;
}


class TrackerClient<T extends INetworkClient> extends EventEmitter implements ITrackerClient {
    protected addrTxEvents: IAddressTrackEvent = {
        addrs: [],
        callback: null
    };

    protected debug;

    constructor(protected readonly networkClient: T) {
        super();
        this.debug = Debug.create('TRACKER_CLIENT::' + this.networkClient.getCoin().getUnit().toString());
    }

    /**
     * @param callback
     * @returns {ITrackerClient}
     */
    public onConnect(callback): ITrackerClient {
        this.on(TrackerEvent.Connect, callback);

        return this;
    }

    /**
     * @param callback
     * @returns {ITrackerClient}
     */
    public onDisconnect(callback): ITrackerClient {
        this.on(TrackerEvent.Disconnect, callback);

        return this;
    }

    /**
     * @param callback
     *
     * @returns {ITrackerClient}
     */
    public onConnectionError(callback): ITrackerClient {
        this.on(TrackerEvent.ConnectionError, callback);

        return this;
    }

    /**
     * @param {NewBlockCallback} callback
     * @returns {ITrackerClient}
     */
    public onBlock(callback: Events.NewBlockCallback): ITrackerClient {
        this.on(TrackerEvent.Block, callback);

        return this;
    }

    /**
     * @param {string} txid
     * @param {NewTxCallback} callback
     *
     * @returns {ITrackerClient}
     */
    public onTransactionConfirm(txid: string, callback: Events.NewTxCallback): ITrackerClient {
        this.once(`tx.${txid}`, callback);

        return this;
    }

    /**
     * @param {string[]} addrs
     * @param {NewTxCallback} callback
     */
    public onAddrsTx(addrs: string[], callback: Events.NewTxCallback): ITrackerClient {
        const coinKeyFormatter = this.networkClient.getCoin().getKeyFormat();

        const addrBuffers: Buffer[] = map(addrs, (addr: string) => {
            return coinKeyFormatter.parseAddress(addr).toBuffer()
        });

        this.addrTxEvents = {
            addrs: addrBuffers,
            callback: callback
        };

        return this;
    }

    /**
     * @param {string} address
     * @returns {boolean}
     */
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
                buffer = coinKeyFormatter.parseAddress(address).toBuffer();
            } catch (error) {
                this.debug("Can not parse address %s", address);

                return false;
            }
        }

        const {addrs = []} = this.addrTxEvents;

        return !!find(addrs, (addr: Buffer) => {
            return buffer.equals(addr);
        });
    }

    /**
     * @param {Block} block
     *
     * @returns {boolean}
     */
    protected fireNewBlock(block: Wallet.Entity.Block): boolean {
        return this.emit(TrackerEvent.Block, block);
    }

    /**
     * @returns {boolean}
     */
    protected fireConnect(): boolean {
        return this.emit(TrackerEvent.Connect);
    }

    /**
     * @returns {boolean}
     */
    protected fireDisconnect(): boolean {
        return this.emit(TrackerEvent.Disconnect);
    }

    /**
     * @param {Error} error
     *
     * @returns {boolean}
     */
    protected fireConnectionError(error: Error): boolean {
        return this.emit(TrackerEvent.ConnectionError, error);
    }

    /**
     * @param {WalletTransaction} tx
     */
    protected fireTxidConfirmation(tx: Wallet.Entity.WalletTransaction): boolean {
        return this.emit(`tx.${tx.txid}`, tx);
    }

    public destruct() {
        this.addrTxEvents = {addrs: [], callback: null};
        this.removeAllListeners('tx.*');
        this.removeAllListeners('addr.*')
    }
}

export {
    TrackerEvent,
    IAddressTrackEvent,
    ITrackerClient,
    TrackerClient
}