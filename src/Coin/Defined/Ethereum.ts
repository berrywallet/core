import * as Coin from "../";
import BigNumber from "bignumber.js";
import * as Constants from "../../Constants";

export default class Ethereum implements Coin.CoinInterface {
    constructor(protected options?: Coin.Options.EthereumOptions) {
    }

    getOptions(): Coin.Options.EthereumOptions {
        return this.options;
    }

    getBalanceScheme(): Coin.BalanceScheme {
        return Coin.BalanceScheme.ADDRESS_BALANCE
    }

    getTransactionScheme(): Coin.TransactionScheme {
        return Coin.TransactionScheme.FROM_TO
    }

    isMultiAddressAccount(): boolean {
        return false;
    }

    makePrivateFromSeed(seed: Buffer): Coin.Private.BasicMasterNode {
        return Coin.Private.BasicMasterNode.fromSeedBuffer(seed, this);
    }

    getUnit(): Coin.Unit {
        return Coin.Unit.ETH;
    }

    getName(): string {
        return 'Ethereum';
    }

    getHDCoinType(): number {
        return 60;
    }

    getKeyFormat(): Coin.Key.FormatInterface {
        return new Coin.Key.EthereumKeyFormat;
    }

    readonly minValue: BigNumber = new BigNumber(1).div(Constants.WEI_PER_COIN);

    readonly defaultGasLimit: number = 53000; //default transaction gas limit
    readonly defaultGasPrice: BigNumber = new BigNumber(8).div(Constants.GWEI_PER_COIN); //8 GWei

    readonly chainId: number = 1; // mainnet Tx EIP155
}