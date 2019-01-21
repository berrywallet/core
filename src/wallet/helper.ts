import { forEach, map } from 'lodash';
import BigNumber from 'bignumber.js';
import BitcoinJS from 'bitcoinjs-lib';
import { Coin, Constants } from '../';
import { BalanceException } from './exceptions';
import { WDProvider } from './wd-provider';
import * as Entity from './entity';

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


export function calculateTxBalance(balance: Entity.WDBalance, txid: string): number {
    const txBalance: Entity.Balance = balance.txBalances[txid];

    if (!txBalance) {
        throw new BalanceException(`Transaction with TXID '${txid}' not found`);
    }

    return txBalance.receive.minus(txBalance.spend).toNumber();
}

export function createWDProvider(walletData: Entity.WalletData): WDProvider {
    return new WDProvider(walletData);
}


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


function mapBIPTransaction(walletTransaction: Entity.BIPTransaction,
                           coinTx: Coin.Transaction.BIPTransaction,
                           coin: Coin.BIPGenericCoin): Entity.BIPTransaction {

    walletTransaction.version = coinTx.version;
    walletTransaction.lockTime = coinTx.bitcoinJsTransaction.locktime;

    walletTransaction.inputs = map(coinTx.inputs, (input: BitcoinJS.In) => {
        return {
            prevTxid: (input.hash.reverse() as Buffer).toString('hex'),
            prevOutIndex: input.index,
            sequence: input.sequence,
            scriptSig: input.script.toString('hex'),
        } as Entity.BIPInput;
    });

    walletTransaction.outputs = map(coinTx.outputs, (output: BitcoinJS.Out): Entity.BIPOutput => {
        let address;
        try {
            address = BitcoinJS.address.fromOutputScript(output.script, coin.networkInfo());
        } catch (e) {
        }

        const scriptType = BitcoinJS.script.classifyOutput(output.script) as Coin.ScriptType;

        return {
            value: new BigNumber(output.value).div(Constants.SATOSHI_PER_COIN).toFixed(),
            scriptPubKey: output.script.toString('hex'),
            addresses: address ? [address] : [],
            scriptType: scriptType,
        };
    });

    return walletTransaction;
}


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
