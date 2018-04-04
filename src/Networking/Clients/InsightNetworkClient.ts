import {each, orderBy, Dictionary} from 'lodash';
import Bottleneck from 'bottleneck';
import Axios, {AxiosInstance, AxiosResponse} from "axios";

import {Coin, Wallet} from "../../";
import {AdapterOptionInterface, Insight} from '../Api';
import {NetworkClient} from "./";
import {ITrackerClient} from "./Tracker";
import {InsightTrackerProvider} from "./Tracker/InsightTrackerProvider";
import BigNumber from "bignumber.js";
import {BIPGenericCoin} from "../../Coin";

export default class InsightNetworkClient extends NetworkClient {
    protected client: AxiosInstance;
    protected trackerClient: ITrackerClient;
    protected limiter: Bottleneck;

    /**
     * @param {CoinInterface} coin
     * @param {AdapterOptionInterface} options
     */
    constructor(coin: Coin.CoinInterface, options: AdapterOptionInterface) {
        if (false === (coin instanceof Coin.BIPGenericCoin)) {
            throw new Error('Insigne network for BIP Coin only');
        }
        
        super(coin, options);

        this.client = Axios.create({
            baseURL: this.getApiUrl(),
            timeout: 10000
        });

        this.limiter = new Bottleneck(1, 500);
    }

    /**
     * @param {() => PromiseLike<R>} cb
     * @param {number} priority
     * @returns {Promise<R>}
     */
    protected wrapperLimiter<R>(cb: () => PromiseLike<R>, priority: number = 5): Promise<R> {
        return this.limiter.schedulePriority(priority, cb);
    }

    /**
     * @param {string} url
     * @param {Object} postParams
     * @returns {Promise<R>}
     */
    protected sendRequest<R>(url: string, postParams: any = null): Promise<R> {
        const resolvePromise = (resolve, reject) => {
            const onRequestSuccess = (response: AxiosResponse) => resolve(response.data);

            const requestParams = {
                url: url,
                method: postParams ? 'POST' : 'GET',
                data: postParams ? postParams : null
            };

            return this.client
                .request(requestParams).then(onRequestSuccess)
                .catch(error => reject(error));
        };

        return this.wrapperLimiter<R>(() => {
            return new Promise<any>(resolvePromise);
        });
    }

    /**
     * @param {string} txid
     * @returns {Promise<WalletTransaction>}
     */
    getTx(txid: string): Promise<Wallet.Entity.BIPTransaction | null> {
        const onRequestSuccess = (data: any) => {
            const tx: Insight.Transaction = data;

            return tx ? Insight.toWalletTx(tx, this.coin) : null;
        };

        return this
            .sendRequest(`/tx/${txid}`)
            .then(onRequestSuccess);
    }

    getFeesPerKB(): Promise<Dictionary<BigNumber>> {
        const resolveFeePerByte = (data, index, defaultFeeProp: string): BigNumber => {
            if (data[index] > 0) {
                return new BigNumber(data[index]).div(1024).round(8);
            }

            return this.coin[defaultFeeProp];
        };

        const onRequestSuccess = (data: any) => {
            return {
                low: resolveFeePerByte(data, 12, 'lowFeePerByte'),
                standard: resolveFeePerByte(data, 3, 'defaultFeePerByte'),
                high: resolveFeePerByte(data, 1, 'highFeePerByte')
            }
        };

        const onRequestError = () => {
            return {
                low: (this.coin as BIPGenericCoin).lowFeePerByte,
                standard: (this.coin as BIPGenericCoin).defaultFeePerByte,
                high: (this.coin as BIPGenericCoin).highFeePerByte
            }
        };

        return this
            .sendRequest('/utils/estimatefee?nbBlocks=1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16')
            .then(onRequestSuccess)
            .catch(onRequestError);
    }

    /**
     * @param {string} blockHash
     * @returns {Promise<Block>}
     */
    getBlock(blockHash: string): Promise<Wallet.Entity.Block> {
        const onRequestSuccess = (block: Insight.Block) => {
            return {
                hash: block.hash,
                height: block.height,
                time: block.time * 1000,
                txids: block.tx,
                original: block
            } as Wallet.Entity.Block
        };

        return this
            .sendRequest<Insight.Block>(`/block/${blockHash}`)
            .then(onRequestSuccess);
    }

    /**
     * @param {Transaction} transaction
     * @returns {Promise<string>}
     */
    broadCastTransaction(transaction: Coin.Transaction.Transaction): Promise<string> {
        const requestData = {
            rawtx: transaction.toBuffer().toString('hex')
        };

        const onRequestSuccess = (data: any) => data.txid;

        return this
            .sendRequest<string>('/tx/send', requestData)
            .then(onRequestSuccess);
    }

    /**
     * @param {string[]} addrs
     * @param {number} from
     * @param {number} limit
     * @returns {Promise<BIPTransaction[]>}
     */
    protected pureGetAddrsTxs(addrs: string[], from: number = 0, limit: number = 50): Promise<Wallet.Entity.BIPTransaction[]> {
        if (!addrs.length) {
            throw new Error('There is no addresses to request!');
        }

        const onRequestSuccess = (data: any) => {
            const rawTxs: Insight.Transaction[] = data.items;
            const txList: Wallet.Entity.BIPTransaction[] = [];

            const extractTxCallback = (tx: Insight.Transaction) => {
                txList.push(Insight.toWalletTx(tx, this.coin));
            };

            each(orderBy(rawTxs, 'blockheight', 'asc'), extractTxCallback);

            return txList;
        };

        return this
            .sendRequest<Insight.Transaction[]>(`/addrs/${addrs.join(',')}/txs?from=${from}&to=${from + limit}`)
            .then(onRequestSuccess);
    }

    /**
     * @param {string} address
     * @returns {Promise<BIPTransaction[]>}
     */
    getAddressTxs(address: string): Promise<Wallet.Entity.BIPTransaction[]> {
        return this.pureGetAddrsTxs([address], 0, 50);
    }

    /**
     * @param {string[]} addrs
     * @returns {Promise<WalletTransaction[]>}
     */
    getBulkAddrsTxs(addrs: string[]): Promise<Wallet.Entity.WalletTransaction[]> {
        return this.pureGetAddrsTxs(addrs, 0, 50);
    }

    /**
     * @returns {ITrackerClient}
     */
    getTracker(): ITrackerClient {
        if (!this.trackerClient) {
            this.trackerClient = new InsightTrackerProvider(this);
        }

        return this.trackerClient;
    }

    destruct() {
        if (this.trackerClient) {
            this.trackerClient.destruct();

            delete this.trackerClient;
        }

        this.limiter.stopAll();
        delete this.client;
    }
}
