import {each, reduce, find} from 'lodash';
import {Wallet} from '../../../';
import {InsightNetworkClient} from '../';
import {TrackerClient} from './';

const io = require('socket.io-client');

export class InsightTrackerProvider extends TrackerClient<InsightNetworkClient> {

    socket: SocketIOClient.Socket;
    connected: boolean;
    enableReconnect: boolean = true;

    /**
     * @param {InsightNetworkClient} networkClient
     */
    constructor(networkClient: InsightNetworkClient) {
        super(networkClient);

        this.connected = false;

        setTimeout(() => {
            this.createSocketConnection();
        }, 1);
    }

    createSocketConnection() {
        this.socket = io.connect(this.networkClient.getWSUrl(), {
            timeout: 1000,
            autoConnect: false,
            rejectUnauthorized: true,
            transports: ['websocket']
        });

        this.socket.on('connect', () => {
            console.log('Socket connected!');

            setTimeout(this.fireConnect.bind(this), 500);
        });

        this.socket.on('error', (error) => {
            console.error(error);
            console.log('Socket connection error');
            this.fireConnectionError(error);

            this.reconnectSocket();
        });

        this.socket.on('connect_timeout', (timeout) => {
            console.log('Socket connection timeout');

            this.reconnectSocket();
        });

        this.socket.on('disconnect', () => {
            this.reconnectSocket();
        });

        this.socket.on('block', (blockHash: string) => this.handleNewBlock(blockHash));
        this.socket.on('tx', (tx: any) => {
            const {callback, addrs} = this.addrTxEvents;
            if (callback && addrs.length) {
                const transactionAddrs = reduce(
                    tx.vout,
                    (list, vout) => [...list, ...Object.keys(vout)],
                    []
                );

                const addr = find(transactionAddrs, (addr) => this.isAddrTrack(addr));

                if (addr) {
                    const onSuccessResponse = (tx: Wallet.Entity.BIPTransaction) => {
                        callback(tx);
                    };

                    this.networkClient.getTx(tx.txid).then(onSuccessResponse);
                }
            }
        });

        this.socket.open();
    }

    protected reconnectSocket() {
        if (!this.enableReconnect) {
            return;
        }

        this.connected = false;
        if (this.socket) {
            this.socket.close();
            delete this.socket;
        }
        console.log('Start reconnecting...');

        setTimeout(() => {
            this.createSocketConnection();
        }, 2000)
    }

    protected fireConnect(): boolean {
        if (!this.socket) {
            throw new Error('No socket connection');
        }

        this.socket.emit('subscribe', 'inv');
        this.connected = true;

        return super.fireConnect();
    }

    /**
     * @param {Block} block
     */
    protected fireNewBlock(block: Wallet.Entity.Block): boolean {
        each(block.txids, (txid) => {
            if (this.listenerCount('tx.' + txid) === 0) return;

            this.networkClient
                .getTx(txid)
                .then(tx => {
                    this.fireTxidConfirmation(tx);
                });
        });

        return super.fireNewBlock(block);
    }

    /**
     * @param {string} blockHash
     */
    protected handleNewBlock(blockHash: string) {
        const onBlockGot = (block: Wallet.Entity.Block) => {
            this.fireNewBlock(block);
        };

        this.networkClient.getBlock(blockHash).then(onBlockGot);
    }

    destruct() {
        this.enableReconnect = false;
        this.connected = false;

        if (this.socket) {
            this.socket.close();
            delete this.socket;
        }

        super.destruct();
    }
}