import {filter, each, chain, Dictionary} from 'lodash';
import BigNumber from "bignumber.js";

import {Coin, Networking, Constants} from '../../../../';
import {Entity} from "../../../";

import {AbstractPrivateProvider} from './AbstractPrivateProvider';
import {IEthereumNetworkClient, GasPrice} from "../../../../Networking/Clients";

export class EthereumPrivateProvider extends AbstractPrivateProvider {

    public getTxNonce(fromAddress: Entity.WalletAddress) {
        return filter(
            this.wdProvider.tx.list(),
            (tx: Entity.EtherTransaction) => (tx.from.toLowerCase() === fromAddress.address.toLowerCase())
        ).length;
    }

    /**
     * @param {Address} address
     * @param {BigNumber} value
     *
     * @returns {Promise<BigNumber>}
     */
    public getGasLimit(address: Coin.Key.Address = null, value: BigNumber = null): Promise<BigNumber> {
        if (address && value) {
            const networkClient = this.wdProvider.getNetworkProvider().getClient(0);
            // @TODO Need to request a etherscan for optimal gasLimit for current address transaction
            // return (networkClient as IEthereumNetworkClient)
            //     .estimateGas(address, value)
            //     .catch(() => {
            //         return Constants.MIN_GAS_LIMIT;
            //     });
        }

        return Promise.resolve<BigNumber>(Constants.MIN_GAS_LIMIT);
    }

    /**
     * @param {FeeTypes} feeType
     *
     * @returns {Promise<BigNumber>}
     */
    public async getGasPrice(feeType: Coin.FeeTypes = Coin.FeeTypes.Medium): Promise<BigNumber> {
        const networkClient = this.wdProvider.getNetworkProvider().getClient(0);

        const gasPrices: GasPrice = await (networkClient as IEthereumNetworkClient).getGasPrice();

        let gasPriceGWEI = gasPrices.standard;
        switch (feeType) {
            case Coin.FeeTypes.High:
                gasPriceGWEI = gasPrices.high;
                break;

            case Coin.FeeTypes.Low:
                gasPriceGWEI = gasPrices.low;
                break;
        }

        return Promise.resolve(gasPriceGWEI)
    }

    /**
     * @param {BigNumber} value
     * @param {Address} address
     * @param {FeeTypes} feeType
     *
     * @returns {Promise<BigNumber>}
     */
    public async calculateFee(value: BigNumber,
                              address: Coin.Key.Address,
                              feeType: Coin.FeeTypes = Coin.FeeTypes.Medium): Promise<BigNumber> {
        const promises = [
            this.getGasPrice(feeType),
            this.getGasLimit(address, value)
        ];

        const [gasPrice, gasLimit]: BigNumber[] = await Promise.all(promises);

        return Promise.resolve(gasLimit.mul(gasPrice.div(Constants.GWEI_PER_COIN)));
    }

    /**
     * @param {Address} address
     * @param {BigNumber} value
     * @param {FeeTypes} feeType
     *
     * @returns {Transaction}
     */
    public createTransaction(address: Coin.Key.Address,
                             value: BigNumber,
                             feeType: Coin.FeeTypes = Coin.FeeTypes.Medium): Promise<Coin.Transaction.Transaction> {

        let coin = this.wdProvider.coin as Coin.Defined.Ethereum;
        let balance = this.wdProvider.balance;

        let [addressFrom] = this.wdProvider.address.list();

        const privateNodeFrom = this.deriveAddressNode(addressFrom);
        const addressBalance = balance.addrBalances[addressFrom.address];

        const currentBalance = addressBalance.receive
            .sub(addressBalance.spend)
            .sub(addressBalance.unconfirmed);

        if (currentBalance.lessThan(value)) {
            throw new Error("Insufficient funds");
        }

        let txBuilder = new Coin.Transaction.Builder.EthereumTransactionBuilder(coin);
        txBuilder.to = address;
        txBuilder.value = value;
        txBuilder.nonce = this.getTxNonce(addressFrom);

        let privateKeys: Coin.Key.Private[] = [privateNodeFrom.getPrivateKey()];

        const promises = [
            this.getGasPrice(feeType),
            this.getGasLimit(address, value)
        ];

        return Promise.all(promises).then((results: BigNumber[]) => {
            const [gasPrice, gasLimit] = results;

            txBuilder.gasPrice = gasPrice.div(Constants.GWEI_PER_COIN);
            txBuilder.gasLimit = gasLimit.toNumber();

            return txBuilder.buildSigned(privateKeys);
        });
    }
}