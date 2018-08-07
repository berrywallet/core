import BigNumber from 'bignumber.js';
import { Dictionary } from 'lodash';
import { Coin, HD } from '../../';

type Block = {
    hash: string;
    height: number;
    time: number;
    txids: string[];
    original?: any;
};


type WalletAddress = {
    address: string;
    type: HD.BIP44.AddressType;
    index: number;
};


type WalletTransaction = {
    txid: string;
    coin: Coin.Unit;
    blockHash?: string;
    blockHeight?: number;
    blockTime?: number;         // Unix Timestamp
    receiveTime?: number;
    scheme: Coin.TransactionScheme;
};


type BIPInput = {
    prevTxid: string;
    sequence: number;
    scriptSig: string;
    prevOutIndex: number;
};


type BIPOutput = {
    value: string;
    scriptPubKey: string;
    addresses?: string[];    // @TODO Need find why there is used an Array instead of primitive
    scriptType?: string;     // @TODO Need declare specific script types
};


type BIPTransaction = WalletTransaction & {
    inputs: BIPInput[];
    outputs: BIPOutput[];
    version: number;
    lockTime: number;
}


type EtherTransaction = WalletTransaction & {
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


type WalletData = {
    coin: Coin.Unit;
    txs: Dictionary<WalletTransaction>;
    addresses: WalletAddress[];
};


type UnspentTXOutput = {
    txid: string;
    addresses: string[];
    index: number;
    value: BigNumber;
    confirmed: boolean;
};


type Balance = {
    receive: BigNumber;
    spend: BigNumber;
    unconfirmed?: BigNumber;
};


type WDBalance = {
    addrBalances: Dictionary<Balance>;
    txBalances: Dictionary<Balance>;
    utxo: UnspentTXOutput[];
};


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
