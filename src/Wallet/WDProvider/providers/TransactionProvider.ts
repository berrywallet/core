import {Dictionary, filter} from 'lodash';
import {Entity} from "../../";
import SimpleProvider from './SimpleProvider';

export default class TransactionProvider extends SimpleProvider {
    /**
     * @param {WalletTransaction} tx
     */
    add(tx: Entity.WalletTransaction): void {
        if (tx.coin !== this.getCoin().getUnit()) {
            throw new Error("Impossible adding transaction!");
        }

        let newTx, oldTx = this.get(tx.txid),
            emitEvent: string;

        if (oldTx) {
            newTx = Object.assign({}, oldTx, tx);

            if (!oldTx.blockHash && tx.blockHash) {
                emitEvent = 'tx:confirm';
            }
        } else {
            newTx = {
                ...tx,
                receiveTime: new Date().getTime()
            };
            emitEvent = 'tx:new';
        }

        this.setData({
            txs: {
                ...this.list(),
                [tx.txid]: newTx
            }
        });

        if (emitEvent) {
            this.emitEvent(emitEvent, newTx);
        }
    }

    /**
     * Get List of transactions
     *
     * @returns {Dictionary<WalletTransaction>}
     */
    list(): Dictionary<Entity.WalletTransaction> {
        return this.getWalletData().txs;
    }

    /**
     * @returns {WalletTransaction[]}
     */
    unconfirmedList(): Entity.WalletTransaction[] {
        return filter(this.getWalletData().txs, (tx: Entity.WalletTransaction): boolean => !tx.blockHeight);
    }

    /**
     * @param {string} txid
     *
     * @returns {WalletTransaction | null}
     */
    get(txid: string): Entity.WalletTransaction | null {
        return this.list()[txid] || null;
    }
}
