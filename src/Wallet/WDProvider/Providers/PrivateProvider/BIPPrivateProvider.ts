import {each, chain, Dictionary} from 'lodash';
import BigNumber from "bignumber.js";
import {Coin, Constants, HD} from "../../../../";
import {Entity} from "../../../";
import {AbstractPrivateProvider} from './AbstractPrivateProvider';
import InsightNetworkClient from "../../../../Networking/Clients/InsightNetworkClient";
import {BIPGenericCoin} from "../../../../Coin";

const coinSelect = require('coinselect');

export interface CoinSelectResponse {
    inputs?: any[];
    outputs?: any[];
    fee?: number;
}

export class BIPPrivateProvider extends AbstractPrivateProvider {

    /**
     * @param {BIPGenericCoin} coin
     * @param {FeeTypes} feeType
     *
     * @returns {number}
     */
    protected getFeeByType(coin: Coin.BIPGenericCoin, feeType: Coin.FeeTypes): Promise<number> {

        let networkClient = this.wdProvider.getNetworkProvider().getClient(0);

        if (networkClient instanceof InsightNetworkClient) {
            const resolveFees = (fees: Dictionary<BigNumber>) => {
                let responseFee: BigNumber = fees.standard;

                switch (feeType) {
                    case Coin.FeeTypes.High:
                        responseFee = fees.high;
                        break;

                    case Coin.FeeTypes.Low:
                        responseFee = fees.low;
                        break;
                }

                return responseFee.mul(Constants.SATOSHI_PER_COIN).toNumber();
            };

            return networkClient.getFeesPerKB().then(resolveFees);
        }

        return Promise.resolve(
            coin.defaultFeePerByte
                .mul(Constants.SATOSHI_PER_COIN)
                .toNumber()
        )
    }

    /**
     * @param {WDBalance} balance
     * @param {string | null} address
     * @param {BigNumber} value
     * @param {FeeTypes} feeType
     *
     * @returns Promise{CoinSelectResponse}
     */
    protected calculateOptimalInputs(balance: Entity.WDBalance,
                                     address: string | null,
                                     value: BigNumber,
                                     feeType: Coin.FeeTypes = Coin.FeeTypes.Medium): Promise<CoinSelectResponse> {

        const coin = this.wdProvider.coin as Coin.BIPGenericCoin;
        const utxos = chain(balance.utxo)
            .filter({confirmed: true})
            .map((inp: Entity.UnspentTXOutput) => {
                const curAddress = inp.addresses[0];
                return {
                    txId: inp.txid,
                    vout: inp.index,
                    address: curAddress,
                    
                    // @TODO review this peas with 'coinselect' npm library
                    script: {length: 107},
                    value: inp.value.mul(Constants.SATOSHI_PER_COIN).toNumber()
                };
            })
            .value();

        if (!address) {
            address = '';
        }

        const targets = [{
            address: address,
            value: value.mul(Constants.SATOSHI_PER_COIN).toNumber()
        }];

        return this.getFeeByType(coin, feeType)
            .then(feeRate => {
                return coinSelect(utxos, targets, feeRate);
            });
    }

    /**
     * @param {WDBalance} balance
     * @returns {WalletAddress}
     */
    getPureChangeAddress(balance: Entity.WDBalance = null): Entity.WalletAddress {
        let pureChangeAddr = this.wdProvider.address.last(HD.BIP44.AddressType.CHANGE, balance);

        if (!pureChangeAddr) {
            pureChangeAddr = this.wdProvider
                .getPrivate(this.seed)
                .deriveNew(HD.BIP44.AddressType.CHANGE);
        }

        return pureChangeAddr;
    }

    /**
     * @param {BigNumber} value
     * @param {FeeTypes} feeType
     * @param {Address} address
     *
     * @returns {Promise<BigNumber>}
     */
    calculateFee(value: BigNumber, address: Coin.Key.Address, feeType: Coin.FeeTypes = Coin.FeeTypes.Medium): Promise<BigNumber> {
        return new Promise<BigNumber>((resolve) => {
            const balance = this.wdProvider.balance;

            this.calculateOptimalInputs(balance, address && address.toString(), value, feeType)
                .then(coinSelectResponse => {
                    let {fee = 0} = coinSelectResponse;
                    resolve(new BigNumber(fee.toFixed(8)).div(Constants.SATOSHI_PER_COIN));
                });
        });
    }

    /**
     * @param {Address} address
     * @param {BigNumber} value
     * @param {FeeTypes} feeType
     *
     * @returns {Promise<Transaction>}
     */
    createTransaction(address: Coin.Key.Address,
                      value: BigNumber,
                      feeType: Coin.FeeTypes = Coin.FeeTypes.Medium): Promise<Coin.Transaction.Transaction> {

        const balance = this.wdProvider.balance;

        let coin = this.wdProvider.coin as Coin.BIPGenericCoin,
            txPrivateKeys: Array<Coin.Key.Private> = [],
            txBuilder = new Coin.Transaction.Builder.BIPTransactionBuilder(this.wdProvider.coin);

        const resolveOptimalInputs = (coinSelectResponce: CoinSelectResponse) => {
            let {
                inputs = [],
                outputs = [],
                fee = 0
            } = coinSelectResponce;

            if (!inputs || inputs.length === 0) {
                throw new Error('Insufficient funds');
            }

            each(inputs, (inp) => {
                txBuilder.addInput(inp.txId, inp.vout);
                const walletAddress = this.wdProvider.address.get(inp.address);
                if (!walletAddress) {
                    throw new Error(`Address '${inp.address}' not found in WalletData`);
                }

                txPrivateKeys.push(this.deriveAddressNode(walletAddress).getPrivateKey());
            });

            each(outputs, (out) => {
                let curAddress = out.address || null;
                if (!curAddress) {
                    curAddress = this.getPureChangeAddress(balance).address;
                }

                txBuilder.addOutput(
                    coin.getKeyFormat().parseAddress(curAddress),
                    new BigNumber(out.value).div(Constants.SATOSHI_PER_COIN)
                );
            });

            return txBuilder.buildSigned(txPrivateKeys);
        };

        return this.calculateOptimalInputs(balance, address.toString(), value, feeType).then(resolveOptimalInputs);
    }
}