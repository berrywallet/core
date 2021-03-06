import { forEach, orderBy } from 'lodash';
import Axios, { AxiosInstance } from 'axios';

import { Coin, Wallet } from '../../';
import { TAdapterOption, Blockcypher } from '../api';
import { wrapLimiterMethod } from '../limmiters/blockcypher';
import { NetworkClient } from './network-client';

export class BlockcypherBIPNetworkClient extends NetworkClient {
    protected client: AxiosInstance;

    constructor(coin: Coin.CoinInterface, options: TAdapterOption) {
        super(coin, options);

        this.client = Axios.create({
            baseURL: this.getApiUrl(),
            timeout: 10000,
        });
    }

    public getTx(txid: string): Promise<Wallet.Entity.WalletTransaction | null> {
        return wrapLimiterMethod(async () => {
            try {
                const response = await this.client.get('/txs/' + txid);
                const tx: Blockcypher.Transaction = response.data;

                return Blockcypher.toWalletTx(tx, this.coin);
            } catch (error) {
                if (error.response.status == 404) {
                    return null;
                }

                throw error;
            }
        });
    }


    public getBlock(blockHash: string): Promise<Wallet.Entity.Block> {
        return wrapLimiterMethod(async () => {
            const response = await this.client.get('/blocks/' + blockHash);
            const block: Blockcypher.Block = response.data;

            return {
                hash: block.hash,
                height: block.depth,
                time: new Date(block.received_time).getTime(),
                txids: block.txids,
                original: block,
            };
        });
    }

    /**
     * @param transaction
     */
    public broadCastTransaction(transaction: Coin.Transaction.Transaction): Promise<string> {
        return wrapLimiterMethod(async () => {
            const response = await this.client.post('/txs/push', {
                tx: transaction.toBuffer().toString('hex'),
            });

            const tx: Blockcypher.Transaction = response.data;

            return tx.hash as string;
        });
    }


    public getAddressTxs(address: string): Promise<Wallet.Entity.BIPTransaction[]> {
        return wrapLimiterMethod(async () => {
            const response = await this.client.get('/addrs/' + address + '/full');

            const addressData: Blockcypher.AddressInfo = response.data;

            const txList: Wallet.Entity.BIPTransaction[] = [];
            const extractTxCallback = (tx: Blockcypher.Transaction) => {
                txList.push(Blockcypher.toWalletTx(tx, this.coin));
            };

            forEach(orderBy(addressData.txs, 'block_height', 'asc'), extractTxCallback);

            return txList;
        });
    }
}
