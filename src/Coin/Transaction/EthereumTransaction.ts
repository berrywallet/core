import BigNumber from "bignumber.js";

import * as Key from "../Key";
import * as Utils from "../../Utils";
import * as Constants from "../../Constants";

import {CoinInterface, TransactionScheme} from "../";
import {Transaction} from './Transaction';
import {Ethereum} from "../Defined";


const EthereumTx = require('ethereumjs-tx');

export class EthereumTransaction implements Transaction {

    private readonly coin: Ethereum;

    constructor(coin: CoinInterface, protected readonly ethTx: any) {

        if (!(coin instanceof Ethereum)) {
            throw TypeError("Only Ethereum coin supported");
        }

        if (ethTx.constructor != EthereumTx) {
            throw new TypeError("Invalid type for ethTx");
        }

        this.coin = coin as Ethereum;
    }

    get scheme(): TransactionScheme {
        return TransactionScheme.FROM_TO;
    }

    get id(): string {
        return Utils.addHexPrefix(this.hash.toString('hex'));
    }

    get hash(): Buffer {
        return this.ethTx.hash();
    }

    get version(): number {
        return 0;
    }

    get byteLength(): number {
        return this.toBuffer().length;
    }

    toBuffer(): Buffer {
        return this.ethTx.serialize();
    }

    get isSigned(): boolean {
        return this.ethTx.verifySignature();
    }

    get from(): Key.Address {
        return new Key.Address(0, this.ethTx.from, new Key.EthereumKeyFormat());
    }

    get to(): Key.Address {
        return new Key.Address(0, this.ethTx.to, new Key.EthereumKeyFormat());
    }

    get value(): BigNumber {
        return Utils.bufferToBigNumber(this.ethTx.value).div(Constants.WEI_PER_COIN);
    }

    get gasPrice(): BigNumber {
        return Utils.bufferToBigNumber(this.ethTx.gasPrice).div(Constants.WEI_PER_COIN);
    }

    get gasLimit(): number {
        return Utils.bufferToBigNumber(this.ethTx.gasLimit).toNumber();
    }

    /**
     * The up front amount that an account must have for this transaction to be valid
     * @returns {BigNumber}
     */
    get upfrontCost(): BigNumber {
        return Utils.bufferToBigNumber(this.ethTx.getUpfrontCost()).div(Constants.WEI_PER_COIN);
    }

    get data(): Buffer {
        return this.ethTx.data;
    }

    get ethereumTx(): any {
        return this.ethTx;
    }
}