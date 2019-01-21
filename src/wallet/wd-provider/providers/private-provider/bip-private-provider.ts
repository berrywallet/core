import { forEach, filter } from 'lodash';
import BigNumber from 'bignumber.js';
import BitcoinJS from 'bitcoinjs-lib';
import { Coin, Constants, HD } from '../../../../';
import { Entity } from '../../../';
import { AbstractPrivateProvider } from './abstract-private-provider';
import { FeeRecord, InsightNetworkClient } from '../../../../networking/clients';

import coinSelect, { CoinSelectResult } from 'coinselect';

export class BIPPrivateProvider extends AbstractPrivateProvider {

    protected getCoin(): Coin.BIPGenericCoin {
        return super.getCoin() as Coin.BIPGenericCoin;
    }

    protected async getFee(coin: Coin.BIPGenericCoin, feeType: Coin.FeeTypes): Promise<number> {
        let networkClient = this.wdProvider.getNetworkProvider().getClient(0);

        if (networkClient instanceof InsightNetworkClient) {

            const fees: FeeRecord = await networkClient.getFeesPerKB();

            let responseFee: BigNumber = fees.standard;

            switch (feeType) {
                case Coin.FeeTypes.High:
                    responseFee = fees.high;
                    break;

                case Coin.FeeTypes.Low:
                    responseFee = fees.low;
                    break;
            }

            if (responseFee.isLessThan(coin.minFeePerByte)) {
                responseFee = coin.minFeePerByte;
            }

            return responseFee.times(Constants.SATOSHI_PER_COIN).toNumber();
        }

        return coin.defaultFeePerByte.times(Constants.SATOSHI_PER_COIN).toNumber();
    }


    protected async calculateOptimalInputs(balance: Entity.WDBalance,
                                           address: string,
                                           value: BigNumber,
                                           feeType: Coin.FeeTypes = Coin.FeeTypes.Medium): Promise<CoinSelectResult> {

        const coin = this.wdProvider.coin as Coin.BIPGenericCoin;

        const possibleInputs: Entity.UnspentTXOutput[] = filter(balance.utxo, { confirmed: true }) as any[];

        const targetOutput = [{
            address: address,
            script: BitcoinJS.address.toOutputScript(address, this.getCoin().networkInfo()),
            value: value.times(Constants.SATOSHI_PER_COIN).toNumber(),
        }];

        const feeRate = await this.getFee(coin, feeType);

        return coinSelect(possibleInputs, targetOutput, feeRate);
    }


    public getPureChangeAddress(balance: Entity.WDBalance = null): Entity.WalletAddress {
        let pureChangeAddr = this.wdProvider.address.last(HD.BIP44.AddressType.CHANGE, balance);

        if (!pureChangeAddr) {
            pureChangeAddr = this.wdProvider.getPrivate(this.seed).deriveNew(HD.BIP44.AddressType.CHANGE);
        }

        return pureChangeAddr;
    }


    public async calculateFee(value: BigNumber,
                              address: Coin.Key.Address,
                              feeType: Coin.FeeTypes = Coin.FeeTypes.Medium): Promise<BigNumber> {

        const balance = this.wdProvider.balance;

        let { fee = 0 } = await this.calculateOptimalInputs(balance, address.toString(), value, feeType);

        return new BigNumber(fee.toFixed(8)).div(Constants.SATOSHI_PER_COIN);
    }


    public async createTransaction(
        address: Coin.Key.Address,
        value: BigNumber,
        feeType: Coin.FeeTypes = Coin.FeeTypes.Medium,
    ): Promise<Coin.Transaction.Transaction> {

        const balance = this.wdProvider.balance;

        const coin = this.wdProvider.coin as Coin.BIPGenericCoin;
        const txPrivateKeys: Coin.Key.Private[] = [];
        const inputData: Coin.SignInputData[] = [];
        const txBuilder = new Coin.Transaction.BIPTransactionBuilder(this.wdProvider.coin);

        const coinSelectResponse: CoinSelectResult = await this.calculateOptimalInputs(
            balance,
            address.toString(),
            value,
            feeType,
        );

        let { inputs = [], outputs = [], fee = 0 } = coinSelectResponse;

        if (!inputs || inputs.length === 0) {
            throw new Error('Insufficient funds');
        }

        forEach(inputs, (inp: Entity.UnspentTXOutput) => {
            const address = inp.addresses[0];

            const walletAddress = this.wdProvider.address.get(address);
            if (!walletAddress) {
                throw new Error(`Address '${inp.address}' not found in WalletData`);
            }

            txBuilder.addInput(inp.txid, inp.vout, undefined, Buffer.from(inp.prevScript, 'hex'));
            txPrivateKeys.push(this.deriveAddressNode(walletAddress).getPrivateKey());
            inputData.push({
                value: inp.value,
            });
        });

        forEach(outputs, (out) => {
            let curAddress = out.address || null;
            if (!curAddress) {
                curAddress = this.getPureChangeAddress(balance).address;
            }

            txBuilder.addOutput(
                coin.getKeyFormat().parseAddress(curAddress),
                new BigNumber(out.value).div(Constants.SATOSHI_PER_COIN),
            );
        });

        return txBuilder.buildSigned(txPrivateKeys, inputData);
    }
}
