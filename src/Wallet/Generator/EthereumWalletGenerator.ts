import * as Wallet from "../";
import {WDGenerator} from "./WDGenerator";
import * as HD from "../../HD";

export class EthereumWalletGenerator extends WDGenerator {
    fill(): Promise<Wallet.Provider.WDProvider> {

        const networkProvider = this.wdProvider.getNetworkProvider();
        const privateProvider = this.wdProvider.getPrivate(this.seed);

        // @TODO Hardcoded for Ethereum wallet types
        const addr = privateProvider.deriveNew(HD.BIP44.AddressType.RECEIVE);

        const resolveAddressTransactions = (txs: Wallet.Entity.WalletTransaction[]) => {
            this.resolveAddrsTxs(txs);

            return this.wdProvider;
        };

        return networkProvider
            .getAddressTxs(addr.address)
            .then(resolveAddressTransactions);
    }
}