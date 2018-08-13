import { Provider } from '../../';

import { map, forEach, chunk } from 'lodash';
import { Wallet } from '../../../';
import SimpleProvider from './SimpleProvider';

const queue = require('queue');

export default class UpdateProvider extends SimpleProvider {

    protected async updateTransactions(addrs: Wallet.Entity.WalletAddress[]): Promise<any> {

        const networkProvider = this.wdProvider.getNetworkProvider();
        const rawAddrs = map(addrs, (addr) => addr.address);

        const txs: Wallet.Entity.WalletTransaction[] = await networkProvider.getBulkAddrTxs(rawAddrs);

        forEach(txs, (tx: Wallet.Entity.WalletTransaction) => {
            this.wdProvider.tx.add(tx);
        });
    }


    public update(): Promise<Provider.WDProvider> {
        const promiseResolver = (resolve) => {
            const mapChunkIterator = (addrs: Wallet.Entity.WalletAddress[]) => {
                return (done) => {
                    this.updateTransactions(addrs)
                        .then(() => done());
                };
            };

            const requestList = map(
                chunk(this.wdProvider.address.list(), 10),
                mapChunkIterator,
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
