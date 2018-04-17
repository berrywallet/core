import * as BitcoinJS from 'bitcoinjs-lib';
import BigNumber from "bignumber.js";
import * as Coin from "../";
import * as Utils from "../../Utils";
import * as Constants from "../../Constants";
import {BIPGenericCoin} from "../BIPGenericCoin";
import * as Transaction from "./";
import * as Key from "../Key";

const EthereumTx = require('ethereumjs-tx');

export interface TransactionBuilder {
    readonly scheme: Coin.TransactionScheme;

    buildSigned(keys: Key.Private[]): Transaction.Transaction;

    buildUnsigned(): Transaction.Transaction;

    reset();
}

export class BIPTransactionBuilder implements TransactionBuilder {

    protected txBuilder: BitcoinJS.TransactionBuilder;
    protected readonly coin: BIPGenericCoin;
    protected readonly network: BitcoinJS.Network;

    constructor(coin: Coin.CoinInterface) {
        if (!(coin instanceof BIPGenericCoin)) {
            throw TypeError("Only BIPGenericCoin supported");
        }

        this.coin = coin as BIPGenericCoin;
        this.network = this.coin.networkInfo;
        this.reset();
    }

    get scheme(): Coin.TransactionScheme {
        return Coin.TransactionScheme.INPUTS_OUTPUTS
    }

    protected createTxBuilder(): BitcoinJS.TransactionBuilder {
        return new BitcoinJS.TransactionBuilder(this.network);
    }

    buildSigned(keys: Array<Key.Private>): Transaction.BIPTransaction {
        for (let i in keys) {
            this.txBuilder.sign(Number(i), BitcoinJS.ECPair.fromWIF(keys[i].toString(), this.network));
        }

        return new Transaction.BIPTransaction(this.coin, this.txBuilder.build());
    }

    buildUnsigned(): Transaction.BIPTransaction {
        return new Transaction.BIPTransaction(this.coin, this.txBuilder.buildIncomplete());
    }

    reset() {
        this.txBuilder = this.createTxBuilder();
    }

    addInput(tx: string | Transaction.BIPTransaction, vout: number, sequence?: number, prevOutScript?: Buffer): number {
        if (tx instanceof Transaction.BIPTransaction) {
            tx = tx.hash.toString('hex');
        }

        return this.txBuilder.addInput(tx, vout, sequence, prevOutScript);
    }

    addOutput(address: Key.Address, value: BigNumber): number {
        Utils.validateAmountValue(value, this.coin.minValue, false);

        return this.txBuilder.addOutput(address.toString(), value.mul(Constants.SATOSHI_PER_COIN).toNumber());
    }

    setLockTime(locktime: number): void {
        this.txBuilder.setLockTime(locktime);
    }

    setVersion(version: number): void {
        this.txBuilder.setVersion(version);
    }

    static fromBuffer(coin: Coin.CoinInterface, txBuffer: Buffer): Transaction.BIPTransaction {
        return new Transaction.BIPTransaction(coin, txBuffer);
    }
}


export class EthereumTransactionBuilder implements TransactionBuilder {

    protected readonly coin: Coin.Defined.Ethereum;

    private _nonce: number;
    private _gasLimit: number;
    private _gasPrice: BigNumber;
    private _value: BigNumber;
    private _data: Buffer;
    private _to: Key.Address;

    constructor(coin: Coin.Defined.Ethereum) {
        if (!(coin instanceof Coin.Defined.Ethereum)) {
            throw TypeError("Only Ethereum coin supported");
        }

        this.coin = coin as Coin.Defined.Ethereum;
        this.reset();
    }

    get scheme(): Coin.TransactionScheme {
        return Coin.TransactionScheme.FROM_TO
    }

    buildSigned(keys: Key.Private[]): Transaction.EthereumTransaction {
        if (keys.length !== 1) {
            throw new Error("Ethereum requires one private key");
        }

        let tx = this.buildUnsigned().ethereumTx;
        tx.sign(keys[0].toBuffer());

        return new Transaction.EthereumTransaction(this.coin, tx);
    }

    buildUnsigned(): Transaction.EthereumTransaction {
        if (this.to === null && this.data === null) {
            throw new Error("Either data or to must be set");
        }

        let ethTx = new EthereumTx;
        ethTx.chainId = this.coin.chainId;
        ethTx.nonce = this.nonce;
        ethTx.gasPrice = Utils.bigNumberToBuffer(this.gasPrice.mul(Constants.WEI_PER_COIN));
        ethTx.gasLimit = this.gasLimit;
        ethTx.to = this.to ? this.to.toBuffer() : new Buffer('');
        ethTx.data = this.data;
        ethTx.value = Utils.bigNumberToBuffer(this.value.mul(Constants.WEI_PER_COIN));

        return new Transaction.EthereumTransaction(this.coin, ethTx);
    }

    reset() {
        this.nonce = 0;
        this.gasPrice = this.coin.defaultGasPrice;
        this.gasLimit = this.coin.defaultGasLimit;
        this.value = new BigNumber(0);
        this.data = null;
        this.to = null;
    }


    get nonce(): number {
        return this._nonce;
    }

    set nonce(value: number) {
        if (!new BigNumber(value).isInt() || value < 0) {
            throw new RangeError("Nonce must be a positive integer");
        }
        this._nonce = value;
    }

    get gasPrice(): BigNumber {
        return this._gasPrice;
    }

    set gasPrice(value: BigNumber) {
        Utils.validateAmountValue(value, this.coin.minValue, true);
        this._gasPrice = value;
    }

    get gasLimit(): number {
        return this._gasLimit;
    }

    set gasLimit(value: number) {
        let bn = new BigNumber(value);
        if (!bn.isInt() || bn.isNegative()) {
            throw new RangeError("gasLimit must be a positive integer");
        }
        this._gasLimit = value;
    }

    get value(): BigNumber {
        return this._value;
    }

    set value(value: BigNumber) {
        Utils.validateAmountValue(value, this.coin.minValue, true);
        this._value = value;
    }

    get data(): Buffer {
        return this._data;
    }

    set data(value: Buffer) {
        this._data = value;
    }

    get to(): Key.Address {
        return this._to;
    }

    set to(value: Key.Address) {
        this._to = value;
    }
}