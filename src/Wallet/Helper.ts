import { forEach, map } from 'lodash';
import BigNumber from 'bignumber.js';
import * as BitcoinJS from 'bitcoinjs-lib';

import { Coin, Constants } from '../';
import { Provider, Entity, Exceptions } from './';

/**
 * @param {WDBalance} balance
 * @param {boolean} withUnconfirmed
 *
 * @returns {number}
 */
export function calculateBalance(balance: Entity.WDBalance, withUnconfirmed = false): number {
    let totalBalance = new BigNumber(0);

    forEach(balance.addrBalances, (b: Entity.Balance) => {
        totalBalance = totalBalance.plus(b.receive).minus(b.spend);

        if (!withUnconfirmed) {
            totalBalance = totalBalance.minus(b.unconfirmed);
        }
    });

    return totalBalance.toNumber();
}


/**
 * @param {WDBalance} balance
 * @param {string} txid
 *
 * @returns {number}
 *
 * @throws Wallet.Exceptions.BalanceException
 */
export function calculateTxBalance(balance: Entity.WDBalance, txid: string): number {
    const transactionBalance = balance.txBalances[txid];

    if (!transactionBalance) {
        throw new Exceptions.BalanceException(`Transaction with TXID '${txid}' not found`);
    }

    return transactionBalance.receive.minus(transactionBalance.spend).toNumber();
}


/**
 * Create WDProvider by WalletData
 *
 * @param {WalletData} walletData
 *
 * @returns {WDProvider}
 */
export function createWDProvider(walletData: Entity.WalletData): Provider.WDProvider {
    return new Provider.WDProvider(walletData);
}


/**
 * @param {string} txid
 * @param {Transaction} coinTx
 * @param {CoinInterface} coin
 *
 * @returns {WalletTransaction}
 */
export function coinTxToWalletTx(txid: string,
                                 coinTx: Coin.Transaction.Transaction,
                                 coin: Coin.CoinInterface): Entity.WalletTransaction {

    if (false === coinTx.isSigned) {
        throw new Error('Transaction must be signed');
    }

    const walletTransaction: Entity.WalletTransaction = {
        coin: coin.getUnit(),
        txid: txid,
        receiveTime: new Date().getTime(),
    } as Entity.WalletTransaction;

    switch (coin.getTransactionScheme()) {
        case Coin.TransactionScheme.INPUTS_OUTPUTS: {
            return mapBIPTransaction(
                walletTransaction as Entity.BIPTransaction,
                coinTx as Coin.Transaction.BIPTransaction,
                coin as Coin.BIPGenericCoin,
            );
        }

        case Coin.TransactionScheme.FROM_TO: {
            return mapEtherTransaction(
                walletTransaction as Entity.EtherTransaction,
                coinTx as Coin.Transaction.EthereumTransaction,
                coin,
            );
        }
    }

    throw new Error('Invalid transaction scheme');
}


/**
 * @param {BIPTransaction} walletTransaction
 * @param {BIPTransaction} coinTx
 * @param {CoinInterface} coin
 *
 * @returns {BIPTransaction}
 */
function mapBIPTransaction(walletTransaction: Entity.BIPTransaction,
                           coinTx: Coin.Transaction.BIPTransaction,
                           coin: Coin.BIPGenericCoin): Entity.BIPTransaction {

    walletTransaction.version = coinTx.version;
    walletTransaction.lockTime = coinTx.bitcoinJsTransaction.locktime;

    walletTransaction.inputs = map(coinTx.inputs, (input: BitcoinJS.In) => {
        return {
            prevTxid: input.hash.reverse().toString(),
            prevOutIndex: input.index,
            sequence: input.sequence,
            scriptSig: input.script.toString('hex'),
        } as Entity.BIPInput;
    });

    walletTransaction.outputs = map(coinTx.outputs, (output: BitcoinJS.Out) => {
        const address = BitcoinJS.address.fromOutputScript(output.script, coin.networkInfo());

        return {
            value: new BigNumber(output.value).div(Constants.SATOSHI_PER_COIN).toFixed(),
            scriptPubKey: output.script.toString('hex'),
            addresses: [address],
            scriptType: null,
        } as Entity.BIPOutput;
    });

    return walletTransaction;
}


/**
 * @param {EtherTransaction} walletTransaction
 * @param {EthereumTransaction} coinTx
 * @param {CoinInterface} coin
 *
 * @returns {EtherTransaction}
 */
function mapEtherTransaction(walletTransaction: Entity.EtherTransaction,
                             coinTx: Coin.Transaction.EthereumTransaction,
                             coin: Coin.CoinInterface): Entity.EtherTransaction {

    walletTransaction.from = coinTx.from.toString();
    walletTransaction.to = coinTx.to.toString();
    walletTransaction.value = coinTx.value.toString();
    walletTransaction.nonce = coinTx.ethereumTx.nonce;
    walletTransaction.data = coinTx.data.toString('hex');
    walletTransaction.r = coinTx.ethereumTx.r;
    walletTransaction.s = coinTx.ethereumTx.s;
    walletTransaction.v = coinTx.ethereumTx.v;
    walletTransaction.gasPrice = coinTx.gasPrice.toString();
    walletTransaction.gasLimit = coinTx.gasLimit.toString();

    return walletTransaction;
}