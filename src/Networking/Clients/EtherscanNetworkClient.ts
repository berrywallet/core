import {wrapLimiterMethod as etherscanWrap} from "../Limmiters/Etherscan";

const EtherscanApi = require('etherscan-api');
import {each, Dictionary} from 'lodash';
import BigNumber from "bignumber.js";

import {Coin, Wallet, Constants} from "../../";
import {AdapterOptionInterface, Etherscan} from '../Api';
import {NetworkClient, IEthereumNetworkClient, GasPrice} from './NetworkClient';

export default class EtherscanNetworkClient extends NetworkClient implements IEthereumNetworkClient {
    protected etherscanClient;

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

        const {network = null} = options;

        this.etherscanClient = EtherscanApi.init(Constants.ETHERSCAN_API_KEY, network);
    }

    /**
     * Get Transaction information by TX Hash
     *
     * @param {string} txid
     * @returns {WalletTransaction}
     */
    getTx(txid: string): Promise<Wallet.Entity.WalletTransaction | undefined> {
        const onRequestSuccess = (response) => {
            const tx: Etherscan.Transaction = response.result;

            return {
                coin: this.coin.getUnit(),
                txid: tx.hash,
                blockHeight: new BigNumber(tx.blockNumber).toNumber(),
                blockTime: +tx.timeStamp * 1000,
                scheme: Coin.TransactionScheme.FROM_TO,
                value: new BigNumber(tx.value).div(Constants.WEI_PER_COIN).toString(),
                gasPrice: new BigNumber(tx.gasPrice).div(Constants.WEI_PER_COIN).toString(),
                to: tx.to,
                from: tx.from,
                gasLimit: tx.gas,
                data: tx.input,
                nonce: tx.nonce
            } as Wallet.Entity.EtherTransaction;
        };

        const onRequestError = () => {
            return null;
        };


        return this
            .etherscanClient
            .proxy
            .eth_getTransactionByHash(txid)
            .then(onRequestSuccess)
            .catch(onRequestError);
    }


    /**
     * @param {string} blockHash
     * @returns {Block}
     */
    getBlock(blockHash: string): Promise<Wallet.Entity.Block> {
        throw new Error('Must be implement');
    }


    /**
     * Find and get GAS Price of Ethereum
     *
     * @returns {Promise<GasPrice>}
     */
    getGasPrice(): Promise<GasPrice> {
        return this
            .etherscanClient
            .proxy
            .eth_gasPrice()
            .then((res) => {
                const estimateGasPrice = new BigNumber(res.result).div(Constants.WEI_PER_COIN);

                return {
                    low: estimateGasPrice.div(2),
                    standard: estimateGasPrice,
                    high: estimateGasPrice.mul(5),
                } as GasPrice;
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
    }


    /**
     * Broadcast Raw transaction to Etherscan NETWORK
     *
     * @param {Transaction} transaction
     * @returns {Promise<string>}
     */
    broadCastTransaction(transaction: Coin.Transaction.Transaction): Promise<string> {
        return this
            .etherscanClient
            .proxy
            .eth_sendRawTransaction(transaction.toBuffer().toString('hex'))
            .then((response) => response.result as string);
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

                // @TODO Need review error of transaction
                if (+tx.isError) return;

                const txData: Wallet.Entity.EtherTransaction = {
                    coin: this.coin.getUnit(),
                    txid: tx.hash,
                    blockHeight: new BigNumber(tx.blockNumber).toNumber(),
                    blockTime: +tx.timeStamp * 1000,
                    scheme: Coin.TransactionScheme.FROM_TO,
                    value: new BigNumber(tx.value).div(Constants.WEI_PER_COIN).toString(),
                    gasPrice: new BigNumber(tx.gasPrice).div(Constants.WEI_PER_COIN).toString(),
                    to: tx.to,
                    from: tx.from,
                    gasLimit: tx.gas,
                    data: tx.input,
                    nonce: tx.nonce
                } as Wallet.Entity.EtherTransaction;

                txList.push(txData);
            });

            return txList;
        };

        const onRequestError = () => {
            return [];
        };

        return this.etherscanClient
            .account.txlist(address.toLowerCase(), 1, 'latest', 'asc')
            .then(onRequestSuccess)
            .catch(onRequestError)
    }
}
