import { each, map } from 'lodash';
import BigNumber from "bignumber.js";
import Axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from "axios";

import { Coin, Wallet, Constants, Utils } from "../../";
import { AdapterOptionInterface, Infura, Etherscan } from '../Api';
import { wrapLimiterMethod as infuraWrap } from '../Limmiters/Infura';
import { wrapLimiterMethod as etherscanWrap } from '../Limmiters/Etherscan';
import { wrapLimiterMethod as etherchainWrap } from '../Limmiters/Etherchain';
import { NetworkClient, IEthereumNetworkClient, GasPrice } from './NetworkClient';
import { ITrackerClient, InfuraTrackerProvider } from "./Tracker";

const EtherscanApi = require('etherscan-api');

/**
 * @TODO This is a temporary mechanism that helps to track blocks
 */
export default class InfuraNetworkClient extends NetworkClient implements IEthereumNetworkClient {
    protected client: AxiosInstance;
    protected etherchainClient: AxiosInstance;
    protected etherscanClient;

    protected trackerClient: ITrackerClient;

    /**
     * Constructor of EtherscanNetworkClient.
     *
     * @param {CoinInterface} coin
     * @param {AdapterOptionInterface} options
     */
    constructor(coin: Coin.CoinInterface, options: AdapterOptionInterface) {
        super(coin, options);

        if (false === (coin instanceof Coin.Defined.Ethereum)) {
            throw new Error("Invalid Coin. Just ETH Coin");
        }

        const { network = null } = this.getOptions();

        this.client = Axios.create({
            baseURL: `https://api.infura.io/v1/jsonrpc/${network ? network : 'mainnet'}`,
            timeout: 10000,
        });

        this.etherchainClient = Axios.create({
            baseURL: "https://www.etherchain.org/api",
            timeout: 10000,
        });

        this.etherscanClient = EtherscanApi.init(Constants.ETHERSCAN_API_KEY, network);
    }

    protected sendRequest(method: string,
                          params: any[] = null,
                          isPost: boolean = false): Promise<Infura.JsonRPCResponse> {

        if (params) {
            params = map(params, (elem) => {
                if (Number.isInteger(elem)) {
                    return Utils.numberToHex(elem);
                }

                if (elem instanceof Buffer) {
                    return Utils.addHexPrefix(elem.toString('hex'));
                }

                return elem;
            });
        }

        const requestConfig = {} as AxiosRequestConfig;
        if (isPost) {
            requestConfig.method = 'POST';
            requestConfig.headers = {
                'Content-Type': 'application/json',
            };
            requestConfig.data = {
                id: 1,
                jsonrpc: "2.0",
                method: method,
                params: params,
            };
        } else {
            requestConfig.url = `/${method}`;
            requestConfig.method = 'GET';
            requestConfig.params = {
                params: JSON.stringify(params),
            };
        }

        const handleResponse = (response: AxiosResponse) => {
            return response.data;
        };

        return infuraWrap(() => {
            return this.client.request(requestConfig).then(handleResponse);
        });
    }

    /**
     * Get Transaction information by TX Hash
     *
     * @param {string} txid
     * @returns {Promise<WalletTransaction>}
     */
    public getTx(txid: string): Promise<Wallet.Entity.EtherTransaction | undefined> {
        const onRequestSuccess = (response: Infura.JsonRPCResponse) => {
            const tx: Infura.Transaction = response.result;
            if (!tx) return null;

            const responseTx = {
                coin: this.coin.getUnit(),
                txid: tx.hash,
                scheme: Coin.TransactionScheme.FROM_TO,
                value: new BigNumber(tx.value).div(Constants.WEI_PER_COIN).toString(),
                gasPrice: new BigNumber(tx.gasPrice).div(Constants.WEI_PER_COIN).toString(),
                gasLimit: tx.gas,
                to: tx.to,
                from: tx.from,
                data: tx.input,
                nonce: new BigNumber(tx.nonce).toNumber(),
            } as Wallet.Entity.EtherTransaction;

            if (tx.blockNumber) {
                return this.checkAndMapTxReceipt(responseTx);
            }

            return responseTx;
        };

        return this.sendRequest('eth_getTransactionByHash', [txid]).then(onRequestSuccess);
    }

    /**
     * @param {string} txid
     * @returns {Promise<TransactionReceipt | null>}
     */
    public getTxReceipt(txid: string): Promise<Infura.TransactionReceipt | undefined> {
        const onRequestSuccess = (response: Infura.JsonRPCResponse) => {
            return response.result as Infura.TransactionReceipt;
        };

        return this.sendRequest('eth_getTransactionReceipt', [txid]).then(onRequestSuccess);
    }

    public async checkAndMapTxReceipt(tx: Wallet.Entity.EtherTransaction): Promise<Wallet.Entity.EtherTransaction> {
        const txReceipt: Infura.TransactionReceipt | undefined = await this.getTxReceipt(tx.txid);

        if (txReceipt) {
            const receiptProps = {
                blockHash: txReceipt.blockHash,
                blockHeight: new BigNumber(txReceipt.blockNumber).toNumber(),
                // blockTime: tx.blockTime ? new BigNumber(tx.blockTime).times(1000).toNumber() : null,
                gasUsed: new BigNumber(txReceipt.gasUsed).toString(),
                receiptStatus: !!(new BigNumber(txReceipt.status).toNumber()),
            };

            return Object.assign({}, tx, receiptProps);
        }

        return tx;
    }

    /**
     * @param {string} blockHash
     *
     * @returns {Promise<Block>}
     */
    public getBlock(blockHash: string): Promise<Wallet.Entity.Block> {
        throw new Error('Must be implement');
    }

    /**
     * @param {number} blockNumber
     *
     * @returns {Promise<Block>}
     */
    public async getBlockByNumber(blockNumber: number | string): Promise<Wallet.Entity.Block | undefined> {
        const response = await this.sendRequest('eth_getBlockByNumber', [blockNumber, true]);

        const blockRes: Infura.Block = response.result;
        if (!blockRes) {
            return;
        }

        return {
            hash: blockRes.hash,
            time: new BigNumber(blockRes.timestamp).times(1000).toNumber(),
            height: new BigNumber(blockRes.number).toNumber(),
            txids: map(blockRes.transactions, tx => tx.hash),
            original: blockRes,
        } as Wallet.Entity.Block;
    }


    /**
     * @returns {Promise<GasPrice>}
     */
    public getGasPrice(): Promise<GasPrice> {
        const standardGasPrice = new BigNumber(4).div(Constants.WEI_PER_COIN);

        const defaultGasPrice = {
            low: standardGasPrice,
            standard: standardGasPrice,
            high: standardGasPrice,
        };

        const handleResponse = (response: AxiosResponse) => {
            const gasPrices = response.data;

            if (!gasPrices) {
                return defaultGasPrice;
            }

            return {
                low: new BigNumber(gasPrices.safeLow),
                standard: new BigNumber(gasPrices.standard),
                high: new BigNumber(gasPrices.fast),
            } as GasPrice;
        };

        return etherchainWrap(() => {
            return this.etherchainClient
                .get("/gasPriceOracle")
                .then(handleResponse);
        });
    }

    /**
     * @param {Address} address
     * @param {BigNumber} value
     *
     * @returns {Promise<BigNumber>}
     */
    estimateGas(address: Coin.Key.Address, value: BigNumber): Promise<BigNumber> {
        throw new Error('Can not get Value');

        // const onRequestSuccess = (response) => {
        //     return new BigNumber(response.result);
        // };
        //
        // // @TODO Return something error from Server!
        // return etherscanWrap(() => {
        //     return this.etherscanClient
        //         .proxy.eth_estimateGas(
        //             address.toString().toLowerCase(),
        //             value.times(Constants.WEI_PER_COIN).toNumber()
        //         )
        //         .then(onRequestSuccess);
        // });
    }


    /**
     * Broadcast Raw transaction to Infura Network
     *
     * @param {Transaction} transaction
     *
     * @returns {Promise<string>}
     */
    broadCastTransaction(transaction: Coin.Transaction.Transaction): Promise<string> {
        return this
            .sendRequest('eth_sendRawTransaction', [transaction.toBuffer()], true)
            .then((data) => {
                if (data.error) {
                    throw new Error(data.error.message);
                }

                return data.result as string;
            });
    }

    /**
     * Get Address TXS
     *
     * @param {string} address
     * @returns {Promise<EtherTransaction[]>}
     */
    getAddressTxs(address: string): Promise<Wallet.Entity.EtherTransaction[]> {
        const onRequestSuccess = (response) => {
            const txList: Wallet.Entity.EtherTransaction[] = [];
            each(response.result, (tx: Etherscan.Transaction) => {
                const txData = Etherscan.toWalletTx(this.coin, tx);
                txList.push(txData);
            });

            return txList;
        };

        const onRequestError = () => {
            return [];
        };

        return etherscanWrap(() => {
            return this.etherscanClient
                .account.txlist(address.toLowerCase(), 1, 'latest', 'asc')
                .then(onRequestSuccess)
                .catch(onRequestError);
        });
    }

    /**
     * @returns {ITrackerClient}
     */
    getTracker(): ITrackerClient {
        if (!this.trackerClient) {
            this.trackerClient = new InfuraTrackerProvider(this);
        }

        return this.trackerClient;
    }

    destruct() {
        if (this.trackerClient) {
            this.trackerClient.destruct();

            delete this.trackerClient;
        }

        delete this.client;
        delete this.etherscanClient;
    }
}
