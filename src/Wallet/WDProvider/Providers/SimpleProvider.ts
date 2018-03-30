import {CoinInterface} from "../../../Coin";
import {Provider, Entity} from "../../../Wallet";

export default class SimpleProvider {

    constructor(protected readonly wdProvider: Provider.WDProvider) {
    }

    /**
     * @param newState
     */
    protected setData(newState: any) {
        this.wdProvider.setData(newState);
    }

    /**
     * @returns {WalletData}
     */
    protected getWalletData(): Entity.WalletData {
        return this.wdProvider.getData();
    }

    /**
     * @returns {CoinInterface}
     */
    protected getCoin(): CoinInterface {
        return this.wdProvider.coin;
    }

    /**
     * @param {string} event
     * @param args
     */
    protected emitEvent(event: string, ...args: any[]): boolean {
        return this.wdProvider.emit(event, ...args)
    }
}
