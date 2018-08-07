import BigNumber from "bignumber.js";

import {Coin, HD} from "../../../../";
import * as Entity from "../../../Entity";
import SimpleProvider from "../SimpleProvider";
import * as Provider from "../../";
import {IPrivateProvider} from "./";

export abstract class AbstractPrivateProvider extends SimpleProvider implements IPrivateProvider {

    protected readonly seed: Buffer;
    protected readonly privateCoin: Coin.Private.MasterNodeInterface;

    /**
     * @param {Buffer} seed
     * @param {WDProvider} wdProvider
     */
    constructor(seed: Buffer, wdProvider: Provider.WDProvider) {
        super(wdProvider);

        this.seed = seed;
        this.privateCoin = this.wdProvider.coin.makePrivateFromSeed(seed);
    }

    /**
     * @param {BigNumber} value
     * @param {Address} address
     * @param {FeeTypes} feeType
     *
     * @returns {Promise<BigNumber>}
     */
    abstract calculateFee(value: BigNumber, address: Coin.Key.Address, feeType: Coin.FeeTypes): Promise<BigNumber>;

    /**
     * @param {Address} address
     * @param {BigNumber} value
     * @param {FeeTypes} feeType
     *
     * @returns {Promise<Transaction>}
     */
    abstract createTransaction(address: Coin.Key.Address, value: BigNumber, feeType: Coin.FeeTypes): Promise<Coin.Transaction.Transaction>;

    /**
     * @param {WalletAddress} wdAddress
     * @returns {NodeInterface}
     */
    deriveAddressNode(wdAddress: Entity.WalletAddress): Coin.Private.NodeInterface {
        return this.privateCoin.deriveAddress(wdAddress.type, wdAddress.index);
    }

    /**
     * @param {AddressType} type
     *
     * @returns {WalletAddress}
     */
    deriveNew(type: HD.BIP44.AddressType): Entity.WalletAddress {

        const addrProvider = this.wdProvider.address;

        const newAddrIndex = addrProvider.count(type);
        const derivedAddress = this.privateCoin.deriveAddress(type, newAddrIndex);

        return addrProvider.add(
            derivedAddress.getAddress().toString(),
            type,
            newAddrIndex
        );
    }

    /**
     * @param {Transaction} transaction
     *
     * @returns {Promise<string>} transaction TXID
     */
    broadcastTransaction(transaction: Coin.Transaction.Transaction): Promise<string> {
        if (false === transaction.isSigned) {
            throw new Error('Transaction must be signet!');
        }

        return this.wdProvider.getNetworkProvider().broadCastTransaction(transaction);
    }
}