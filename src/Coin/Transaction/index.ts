import {CoinInterface} from "../";
import {BIPGenericCoin} from "../BIPGenericCoin";
import {Ethereum} from "../Defined";
import * as Builder from "./Builder";

import {Transaction} from './Transaction';
import {BIPTransaction} from "./BIPTransaction";
import {EthereumTransaction} from "./EthereumTransaction";


function constructTransaction(coin: CoinInterface, tx: Buffer): Transaction {

    if (coin instanceof BIPGenericCoin) {
        return new BIPTransaction(coin, tx);
    }

    if (coin instanceof Ethereum) {
        return new EthereumTransaction(coin, tx);
    }

    throw Error('Unknown coin type');
}


export {
    Builder,
    constructTransaction,

    Transaction,
    BIPTransaction,
    EthereumTransaction
}