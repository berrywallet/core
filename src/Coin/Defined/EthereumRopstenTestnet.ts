import * as Coin from "../index";
import Ethereum from './Ethereum';
import * as Constants from "../../Constants";
import BigNumber from "bignumber.js";

export default class EthereumRopstenTestnet extends Ethereum {
    getUnit(): Coin.Unit {
        return Coin.Unit.ETHt;
    }

    getName(): string {
        return 'EthereumRopstenTestnet';
    }

    getHDCoinType(): number {
        return 60;
    }

    readonly defaultGasPrice: BigNumber = new BigNumber(8).div(Constants.GWEI_PER_COIN); //5 GWei

    readonly chainId: number = 3;
}