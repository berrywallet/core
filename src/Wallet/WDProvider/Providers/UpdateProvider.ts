import {Provider} from "../../";

const queue = require('queue');
import {map, each, chunk} from 'lodash';
import {Wallet, Constants} from "../../../";
import SimpleProvider from "./SimpleProvider";

export default class UpdateProvider extends SimpleProvider {

    /**
     * @param {string[]} addrs
     * @returns {Promise<any>}
     */
    protected updateTransactions(addrs: Wallet.Entity.WalletAddress[]): Promise<any> {

        const networkProvider = this.wdProvider.getNetworkProvider();
        const txListResolver = (txs: Wallet.Entity.WalletTransaction[]) => {
            each(txs, (tx: Wallet.Entity.WalletTransaction) => {
                this.wdProvider.tx.add(tx);
            });
        };

        const rawAddrs = map(addrs, (addr) => addr.address);

        return networkProvider.getBulkAddrTxs(rawAddrs).then(txListResolver);
    }

    /**
     * @returns {Promise<WDProvider>}
     */
    update(): Promise<Provider.WDProvider> {
        const promiseResolver = (resolve, reject) => {
            const mapChunkIterator = (addrs: Wallet.Entity.WalletAddress[]) => {
                return (done) => {
                    this.updateTransactions(addrs)
                        .then(() => done());
                };
            };

            const requestList = map(
                chunk(this.wdProvider.address.list(), 10),
                mapChunkIterator
            );

            const updaterQueue = queue();

            updaterQueue.push(...requestList);
            updaterQueue.start((err) => {
                if (err) throw err;

                resolve(this.wdProvider);
            });
        };

        return new Promise(promiseResolver);
    }
}