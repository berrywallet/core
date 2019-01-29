import BigNumber from 'bignumber.js';
import { Coin, Constants, Wallet } from '../../';

namespace etherscan {
    export interface Transaction {
        hash: string;
        blockNumber: string | number;
        timeStamp: string | number;
        nonce: string | number;
        blockHash: string;
        transactionIndex: string | number;
        from: string;
        to: string;
        value: string | number;
        gas: string | number;
        gasPrice: string | number;
        isError: string;
        txreceipt_status: string;
        input: string;
        contractAddress: string;
        cumulativeGasUsed: string | number;
        gasUsed: string | number;
        confirmations: string | number;
    }

    export interface InternalTransaction extends Transaction {
    }

    export interface AddressInfo {
    }

    /**
     * @param {CoinInterface} coin
     * @param {Transaction} tx
     * @returns {EtherTransaction}
     */
    export function toWalletTx(coin: Coin.CoinInterface, tx: Transaction): Wallet.Entity.EtherTransaction {
        const txResult = {
            coin: coin.getUnit(),
            txid: tx.hash,
            scheme: Coin.TransactionScheme.FROM_TO,
            value: new BigNumber(tx.value).div(Constants.WEI_PER_COIN).toString(),
            gasPrice: new BigNumber(tx.gasPrice).div(Constants.WEI_PER_COIN).toString(),
            gasLimit: tx.gas,
            to: tx.to,
            from: tx.from,
            data: tx.input,
            nonce: tx.nonce,
        } as Wallet.Entity.EtherTransaction;

        if (tx.blockNumber) {
            txResult.blockHeight = new BigNumber(tx.blockNumber).toNumber();
            txResult.blockTime = new BigNumber(tx.timeStamp).times(1000).toNumber();
            txResult.receiptStatus = !!(new BigNumber(tx.txreceipt_status).toNumber());
            txResult.gasUsed = new BigNumber(tx.gasUsed).toString();
        }

        return txResult;
    }
}

export default etherscan;
