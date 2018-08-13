import { forEach, orderBy } from 'lodash';
import Axios, { AxiosError, AxiosInstance } from 'axios';

import { Coin, Wallet } from '../../';
import { WalletTransaction } from '../../Wallet/Entity';
import { TAdapterOption, Blockcypher } from '../Api';
import { wrapLimiterMethod } from '../Limmiters/Blockcypher';
import { NetworkClient } from './NetworkClient';

export default class BlockcypherBIPNetworkClient extends NetworkClient {
    protected client: AxiosInstance;

    constructor(coin: Coin.CoinInterface, options: TAdapterOption) {
        super(coin, options);

        this.client = Axios.create({
            baseURL: this.getApiUrl(),
            timeout: 10000,
        });
    }

    public getTx(txid: string): Promise<Wallet.Entity.WalletTransaction | null> {
        const onRequestSuccess = (response) => {
            const tx: Blockcypher.Transaction = response.data;

            return Blockcypher.toWalletTx(tx, this.coin);
        };

        const onError = (error: AxiosError) => {
            if (error.response.status == 404) {
                return null;
            }

            throw error;
        };

        return wrapLimiterMethod(() => {
            return this.client
                .get('/txs/' + txid)
                .then(onRequestSuccess)
                .catch(onError);
        });
    }


    public getBlock(blockHash: string): Promise<Wallet.Entity.Block> {
        throw new Error('Must be implement');
    }


    public broadCastTransaction(transaction: Coin.Transaction.Transaction): Promise<string> {
        const requestData = {
            tx: transaction.toBuffer().toString('hex'),
        };

        const onSuccess = (response) => {
            const tx: Blockcypher.Transaction = response.data;

            return tx.hash as string;
        };

        return wrapLimiterMethod(() => {
            return this.client
                .post('/txs/push', requestData)
                .then(onSuccess);
        });
    }


    public getAddressTxs(address: string): Promise<Wallet.Entity.BIPTransaction[]> {
        const onRequestSuccess = (response) => {
            const addressData: Blockcypher.AddressInfo = response.data;

            const txList: Wallet.Entity.BIPTransaction[] = [];
            const extractTxCallback = (tx: Blockcypher.Transaction) => {
                txList.push(Blockcypher.toWalletTx(tx, this.coin));
            };

            forEach(orderBy(addressData.txs, 'block_height', 'asc'), extractTxCallback);

            return txList;
        };

        return wrapLimiterMethod(() => {
            return this.client
                .get('/addrs/' + address + '/full')
                .then(onRequestSuccess);
        });
    }
}
