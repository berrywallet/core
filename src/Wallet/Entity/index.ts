import BigNumber from 'bignumber.js';
import { Dictionary, List } from 'lodash';
import { Coin, HD } from '../../';

interface Block {
    hash: string;
    height: number;
    time: number;
    txids: string[];
    original?: any;
}


interface WalletAddress {
    address: string;
    type: HD.BIP44.AddressType;
    index: number;
}


interface WalletTransaction {
    txid: string;
    coin: Coin.Unit;
    blockHash?: string;
    blockHeight?: number;
    blockTime?: number;         // Unix Timestamp
    receiveTime?: number;
    scheme: Coin.TransactionScheme;
}


interface BIPInput {
    prevTxid: string;
    sequence: number;
    scriptSig: string;
    prevOutIndex: number;
}


interface BIPOutput {
    value: string;
    scriptPubKey: string;
    addresses?: string[];    // @TODO Need find why there is used an Array instead of primitive
    scriptType?: string;     // @TODO Need declare specific script types
}


interface BIPTransaction extends WalletTransaction {
    inputs: BIPInput[];
    outputs: BIPOutput[];
    version: number;
    lockTime: number;
}


interface EtherTransaction extends WalletTransaction {
    from: string;
    to: string;
    value: string;
    nonce: number;
    data: string;
    gasPrice: string;
    gasLimit: string;
    gasUsed?: string;
    receiptStatus?: boolean;
    r?: string;
    s?: string;
    v?: string;
}


interface WalletData {
    coin: Coin.Unit;
    txs: Dictionary<WalletTransaction>;
    addresses: WalletAddress[];
}


interface UnspentTXOutput {
    txid: string;
    addresses: string[];
    index: number;
    value: BigNumber;
    confirmed: boolean;
}


interface Balance {
    receive: BigNumber;
    spend: BigNumber;
    unconfirmed?: BigNumber;
}


interface WDBalance {
    addrBalances: Dictionary<Balance>;
    txBalances: Dictionary<Balance>;
    utxo: UnspentTXOutput[];
}


export {
    Block,
    WalletAddress,
    BIPInput,
    BIPOutput,
    WalletTransaction,
    BIPTransaction,
    EtherTransaction,
    Balance,
    UnspentTXOutput,
    WDBalance,
    WalletData,
};
