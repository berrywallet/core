import { find, forEach, reduce, map } from 'lodash';
import BigNumber from 'bignumber.js';

import * as Coin from '../../../Coin';
import * as Wallet from '../../';

export interface InputElement {
    txid: string;
    prevTxid: string;
    prevOutIndex: number;
}

export class BalanceCalculator {

    private readonly coin: Coin.CoinInterface;
    private readonly wdProvider: Wallet.Provider.WDProvider;

    public constructor(wdProvider: Wallet.Provider.WDProvider) {
        this.wdProvider = wdProvider;
        this.coin = this.wdProvider.coin;
    }

    public calc(): Wallet.Entity.WDBalance {
        switch (this.coin.getBalanceScheme()) {
            case Coin.BalanceScheme.UTXO: {
                return this.calcUTXOBalance();
            }

            case Coin.BalanceScheme.ADDRESS_BALANCE: {
                return this.calcAddressBalance();
            }
        }

        throw new Error('Not implement balance scheme');
    }


    protected generateEmptyBalance(): Wallet.Entity.WDBalance {
        const balance: Wallet.Entity.WDBalance = {
            addrBalances: {},
            txBalances: {},
            utxo: [],
        };

        const { addresses, txs } = this.wdProvider.getData();

        forEach(addresses, (addr: Wallet.Entity.WalletAddress) => {
            const normalizedAddress = this.coin.getKeyFormat().parseAddress(addr.address).toString();
            balance.addrBalances[normalizedAddress] = {
                receive: new BigNumber(0),
                spend: new BigNumber(0),
                unconfirmed: new BigNumber(0),
            };
        });

        forEach(txs, (tx: Wallet.Entity.WalletTransaction) => {
            balance.txBalances[tx.txid] = {
                receive: new BigNumber(0),
                spend: new BigNumber(0),
            };
        });

        return balance;
    }


    protected generateInputMap = (): InputElement[] => {
        const { txs = {} } = this.wdProvider.getData();

        return reduce(txs, (list: any[], tx: Wallet.Entity.BIPTransaction) => {
            return [
                ...list,
                ...map(tx.inputs, (input: Wallet.Entity.BIPInput) => {
                    return {
                        txid: tx.txid,
                        prevTxid: input.prevTxid,
                        prevOutIndex: input.prevOutIndex,
                    };
                }),
            ];
        }, []);
    };


    protected calcUTXOBalance(): Wallet.Entity.WDBalance {
        const wdBalance = this.generateEmptyBalance();

        const { txs = {} } = this.wdProvider.getData();
        const inputMap = this.generateInputMap();

        forEach(txs, (tx: Wallet.Entity.BIPTransaction) => {
            forEach(tx.outputs, (out: Wallet.Entity.BIPOutput, index: number) => {
                // @TODO Need review and change model of calculate addresses data
                if (!(out.addresses[0] in wdBalance.addrBalances)) {
                    return;
                }

                let txBalance = wdBalance.txBalances[tx.txid];
                let wdAddressBalance = wdBalance.addrBalances[out.addresses[0]];

                wdAddressBalance.receive = wdAddressBalance.receive.plus(out.value);
                if (null === tx.blockHeight) {
                    wdAddressBalance.unconfirmed = wdAddressBalance.unconfirmed.plus(out.value);
                }

                txBalance.receive = txBalance.receive.plus(out.value);

                const spendableInput = find(inputMap, { prevTxid: tx.txid, prevOutIndex: index });
                if (spendableInput) {
                    wdAddressBalance.spend = wdAddressBalance.spend.plus(out.value);

                    let spendTxBalance = wdBalance.txBalances[spendableInput.txid];
                    spendTxBalance.spend = spendTxBalance.spend.plus(out.value);
                } else {
                    wdBalance.utxo.push({
                        txid: tx.txid,
                        index: index,
                        value: new BigNumber(out.value),
                        addresses: out.addresses,
                        confirmed: null !== tx.blockHeight,
                    });
                }
            });
        });

        return wdBalance;
    }


    protected calcAddressBalance(): Wallet.Entity.WDBalance {
        const wdBalance = this.generateEmptyBalance();

        const { txs = {} } = this.wdProvider.getData();

        forEach(txs, (tx: Wallet.Entity.EtherTransaction) => {
            let txBalance = wdBalance.txBalances[tx.txid];

            const txGas = new BigNumber(tx.gasUsed ? tx.gasUsed : tx.gasLimit).times(tx.gasPrice);

            const confirmed = Boolean(tx.blockHeight);

            let toAddr = wdBalance.addrBalances[tx.to];
            let fromAddr = wdBalance.addrBalances[tx.from];

            if (toAddr) {
                if (tx.receiptStatus) {
                    txBalance.receive = txBalance.receive.plus(tx.value);
                    toAddr.receive = toAddr.receive.plus(tx.value);
                }

                if (!confirmed) {
                    toAddr.unconfirmed = toAddr.unconfirmed.plus(tx.value);
                }
            }

            if (fromAddr) {
                fromAddr.spend = fromAddr.spend.plus(txGas);
                txBalance.spend = txBalance.spend.plus(txGas);

                if (confirmed) {
                    if (tx.receiptStatus) {
                        fromAddr.spend = fromAddr.spend.plus(tx.value);
                        txBalance.spend = txBalance.spend.plus(tx.value);
                    }
                } else {
                    fromAddr.spend = fromAddr.spend.plus(tx.value);
                    txBalance.spend = txBalance.spend.plus(tx.value);
                }
            }
        });

        return wdBalance;
    }
}