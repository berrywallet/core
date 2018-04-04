import * as Key from "./Key";
import * as Defined from "./Defined"
import * as Private from "./Private"
import * as Options from "./Options"
import * as Helper from "./Helper";
import {FeeTypes} from "./Fee";
import {BIPGenericCoin} from "./BIPGenericCoin"
import * as Transaction from "./Transaction/index"
import BigNumber from "bignumber.js";

enum BalanceScheme {
    UTXO, //bitcoin model
    ADDRESS_BALANCE //ethereum model
}

enum TransactionScheme {
    INPUTS_OUTPUTS, //bitcoin model
    FROM_TO //ethereum model
}

enum Unit {
    BTC = 'BTC',
    LTC = 'LTC',
    ETH = 'ETH',
    DASH = 'DASH',

    // Testnet
    BTCt = 'BTCt',
    LTCt = 'LTCt',
    ETHt = 'ETHt',
    DASHt = 'DASHt'
}

interface CoinInterface {
    getOptions(): Options.OptionsInterface;

    getUnit(): Unit;

    getName(): string;

    /**
     * Returns coin type according to SLIP-0044.
     *
     * @link https://github.com/satoshilabs/slips/blob/master/slip-0044.md
     * @returns {number}
     */
    getHDCoinType(): number;

    getKeyFormat(): Key.FormatInterface;

    getBalanceScheme(): BalanceScheme;

    getTransactionScheme(): TransactionScheme;

    isMultiAddressAccount(): boolean;

    readonly minValue: BigNumber;

    makePrivateFromSeed(seed: Buffer): Private.MasterNodeInterface
}

const coinMap = {};

coinMap[Unit.BTC] = Defined.Bitcoin;
coinMap[Unit.ETH] = Defined.Ethereum;
coinMap[Unit.LTC] = Defined.Litecoin;
coinMap[Unit.DASH] = Defined.Dash;

coinMap[Unit.BTCt] = Defined.BitcoinTestnet;
coinMap[Unit.ETHt] = Defined.EthereumRopstenTestnet;
coinMap[Unit.LTCt] = Defined.LitecoinTestnet;
coinMap[Unit.DASHt] = Defined.DashTestnet;


function makeCoin(unit: Unit, options?: Options.OptionsInterface): CoinInterface {
    const coinClass = coinMap[unit];
    if (!coinClass) {
        throw new Error(`Coin unit '${unit}' not found!`);
    }

    return new (coinClass)(options);
}


function makePrivateCoin(unit: Unit, seed: Buffer, options?: Options.OptionsInterface): Private.MasterNodeInterface {
    return makeCoin(unit, options).makePrivateFromSeed(seed);
}


export {
    Key,
    Defined,
    Private,
    Options,
    Helper,
    FeeTypes,
    Transaction,
    BIPGenericCoin,

    BalanceScheme,
    TransactionScheme,
    Unit,

    CoinInterface,

    makeCoin,
    makePrivateCoin
}