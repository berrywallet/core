import { forEach } from 'lodash';

import { Wallet } from '../../../';
import { Infura } from '../../Api';
import { InfuraNetworkClient } from '../';
import { TrackerClient } from './';

const NEW_BLOCK_CHECK_TIMEOUT = 15000;
const RECONNECT_TIMEOUT = 30000;
const CONNECTION_TIMEOUT = 60000 * 10;

export class InfuraTrackerProvider extends TrackerClient<InfuraNetworkClient> {

    protected currentBlockHeight?: number;
    protected currentBlockTime?: number;

    protected enableBlockTracking: boolean = false;
    protected connected: boolean = false;
    protected blockTrackInterval?: any;

    /**
     * @param {InfuraNetworkClient} networkClient
     */
    public constructor(networkClient: InfuraNetworkClient) {
        super(networkClient);

        this.startBlockTracking();
    }

    protected handleBlockError = (error): void => {
        if (this.blockTrackInterval) {
            clearInterval(this.blockTrackInterval);

            this.currentBlockHeight = undefined;
            this.currentBlockTime = undefined;
        }

        this.fireConnectionError(error);

        if (this.connected) {
            this.connected = false;
            this.fireDisconnect();
        }

        setTimeout(() => {
            this.startBlockTracking();
        }, RECONNECT_TIMEOUT);

        throw error;
    };

    protected startBlockTracking() {
        this.enableBlockTracking = true;

        this.trackLastOrNextBlock();

        this.blockTrackInterval = setInterval(() => {
            this.trackLastOrNextBlock();
        }, NEW_BLOCK_CHECK_TIMEOUT);
    }

    /**
     * @param {Block} block
     */
    protected fireNewBlock(block: Wallet.Entity.Block): boolean {
        this.currentBlockHeight = block.height;
        this.currentBlockTime = block.time;

        const originalResponse: Infura.Block = block.original;
        if (originalResponse) {
            const { addrs = [], callback = null } = this.addrTxEvents;
            forEach(originalResponse.transactions, (tx: Infura.Transaction) => {

                if (this.isAddrTrack(tx.to) || this.isAddrTrack(tx.from)) {
                    if (callback) {
                        const etherWalletTx = Infura.toWalletTx(tx, this.networkClient.getCoin(), block.time);
                        this.networkClient.checkAndMapTxReceipt(etherWalletTx).then(callback);
                    }
                }

                if (this.listenerCount(`tx.${tx.hash}`) > 0) {
                    this.fireTxidConfirmation(Infura.toWalletTx(tx, this.networkClient.getCoin(), block.time));
                }
            });
        }

        return super.fireNewBlock(block);
    }

    protected getCurrentBlockTime(): number {
        return this.currentBlockTime || 0;
    };

    /**
     * @param {WalletTransaction} tx
     */
    protected fireTxidConfirmation(tx: Wallet.Entity.EtherTransaction): boolean {
        this.networkClient
            .checkAndMapTxReceipt(tx)
            .then(rtx => super.fireTxidConfirmation(rtx));

        return true;
    }

    protected activateConnection() {
        if (!this.connected) {
            this.connected = true;
            this.fireConnect();
        }
    }

    protected async trackLastOrNextBlock(): Promise<Wallet.Entity.Block | void> {
        if (!this.enableBlockTracking) {
            return;
        }

        let blockHeight: string | number = 'latest';
        if (this.currentBlockHeight && (new Date().getTime() - this.getCurrentBlockTime() < CONNECTION_TIMEOUT)) {
            blockHeight = this.currentBlockHeight + 1;
        }

        try {
            const block: Wallet.Entity.Block | undefined = await this.networkClient.getBlockByNumber(blockHeight);
            this.activateConnection();

            if (!block) {
                return;
            }

            this.fireNewBlock(block);
            this.trackLastOrNextBlock();

            return block;
        } catch (error) {
            this.handleBlockError(error);

            return;
        }
    }

    public destruct() {
        this.enableBlockTracking = false;

        if (this.blockTrackInterval) {
            clearInterval(this.blockTrackInterval);
        }

        super.destruct();
    }
}
