import { forEach, orderBy } from 'lodash';
import { Coin, Wallet } from '../../';
import BigNumber from 'bignumber.js';
import { Insight } from './';

interface Network {
    info: {
        version: number;
        protocolversion: number;
        blocks: number;
        timeoffset: number;
        connections: number;
        proxy: string;
        difficulty: number;
        testnet: false;
        relayfee: number;
        errors: string;
        network: string;
    }
}

interface Input {
    txid: string;
    vout: number;
    sequence: number;
    n: number;
    addr: string;
    valueSat: number;
    value: number;
    doubleSpentTxID?: string;
    scriptSig: {
        asm: string;
        hex: string;
    };
}

interface Output {
    value: string;
    n: number;
    scriptPubKey: {
        hex: string;
        asm: string;
        addresses: string[];
        type: string;
    },
    spentTxId?: string;
    spentIndex?: number;
    spentHeight?: number;
}

interface Transaction {
    txid: string;
    version: number;
    locktime: number;
    vin: Input[];
    vout: Output[];
    blockhash: string;
    blockheight: number;
    confirmations: number;
    time: number;
    blocktime: number;
    valueOut: number;
    size: number;
    valueIn: number;
    fees: number;
}

interface AddressInfo {
    addrStr: string;
    balance: number;
    balanceSat: number;
    totalReceived: number;
    totalReceivedSat: number;
    totalSent: number;
    totalSentSat: number;
    unconfirmedBalance: number;
    unconfirmedBalanceSat: number;
    unconfirmedTxApperances: number;
    txApperances: number;
    transactions: string[];
}

interface Block {
    hash: string;
    size: number;
    height: number;
    version: number;
    merkleroot: string;
    tx: string[];
    time: number;
    nonce: number;
    bits: string;
    difficulty: number;
    chainwork: string;
    confirmations: number;
    previousblockhash: string;
    reward: number;
    isMainChain: true;
    poolInfo: any;
}

function toWalletTx(tx: Transaction, coin: Coin.CoinInterface): Wallet.Entity.BIPTransaction {
    const txData: Wallet.Entity.BIPTransaction = {
        coin: coin.getUnit(),
        txid: tx.txid,
        blockHeight: (+tx.blockheight > 0) ? tx.blockheight : null,
        blockTime: tx.blocktime * 1000,
        scheme: Coin.TransactionScheme.INPUTS_OUTPUTS,
        version: tx.version,
        lockTime: tx.locktime,
        inputs: [],
        outputs: [],
    } as Wallet.Entity.BIPTransaction;

    forEach(orderBy(tx.vin, 'n', 'asc'), (vin: Insight.Input) => {
        if (!vin.txid) return;

        txData.inputs.push({
            prevTxid: vin.txid,
            prevOutIndex: vin.vout,
            scriptSig: vin.scriptSig.hex,
            sequence: vin.sequence,
        });
    });

    forEach(orderBy(tx.vout, 'n', 'asc'), (vout: Insight.Output) => {
        const spk = vout.scriptPubKey;
        if (!spk.addresses) return;

        txData.outputs.push({
            scriptPubKey: spk.hex,
            scriptType: spk.type,
            addresses: spk.addresses,
            value: new BigNumber(vout.value).toString(10),
        });
    });

    return txData;
}

export {
    Network,
    Input,
    Output,
    Transaction,
    Block,
    AddressInfo,

    toWalletTx,
};
