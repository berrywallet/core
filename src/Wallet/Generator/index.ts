import {IWDGenerator, WDGenerator} from './WDGenerator';
import {BIPWalletGenerator} from './BIPWalletGenerator';
import {EthereumWalletGenerator} from './EthereumWalletGenerator';
import * as Coin from "../../Coin";

function createGenerator(coin: Coin.CoinInterface, seed: Buffer): IWDGenerator {
    if (coin instanceof Coin.BIPGenericCoin) {
        return new BIPWalletGenerator(coin, seed);
    }

    return new EthereumWalletGenerator(coin, seed);
}

export {
    IWDGenerator,
    createGenerator
}