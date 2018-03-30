import {WDGenerator} from "./WDGenerator";
import {times} from 'lodash';
import Bottleneck from "bottleneck";
import * as Coin from "../../Coin";
import * as Wallet from "../index";
import * as HD from "../../HD";
import * as Constants from "../../Constants";

export class BIPWalletGenerator extends WDGenerator {

    protected readonly limiter: Bottleneck;

    constructor(coin: Coin.CoinInterface, seed: Buffer) {
        super(coin, seed);

        this.limiter = new Bottleneck(1, 100);
    }

    /**
     * @param addressCount
     * @param {AddressType} addressType
     */
    deriveAddresses(addressCount: number,
                    addressType: HD.BIP44.AddressType): Promise<string[]> {

        const privateProvider = this.wdProvider.getPrivate(this.seed);
        const addrsPromises: Promise<string>[] = [];

        times(addressCount, (num: number) => {
            addrsPromises.push(this.limiter.schedule(() => {
                const addr = privateProvider.deriveNew(addressType);

                return Promise.resolve(addr.address);
            }));
        });

        return Promise.all(addrsPromises)
    }

    extractAddrsTxs(addrs: string[]): Promise<any> {
        const networkProvider = this.wdProvider.getNetworkProvider();

        return networkProvider
            .getBulkAddrTxs(addrs)
            .then((txs: Wallet.Entity.WalletTransaction[]) => {
                this.resolveAddrsTxs(txs);

                return txs;
            });
    }

    /**
     * @param {AddressType} addressType
     *
     * @returns {Promise<boolean>}
     */
    bulkAddrGenerate(addressType: HD.BIP44.AddressType): Promise<boolean> {
        const onAddressGenerated = (addrs: string[]) => {
            return this.extractAddrsTxs(addrs).then(() => {

                const pureAddrCount = this.wdProvider.address.pureAddrCount(addressType);
                if (pureAddrCount < Constants.MIN_ADDRESS_COUNT) {
                    return this.bulkAddrGenerate(addressType);
                }

                return Promise.resolve(true);
            });
        };

        return this
            .deriveAddresses(Constants.MIN_ADDRESS_COUNT, addressType)
            .then(onAddressGenerated);
    }


    /**
     * @returns {Promise<WDProvider>}
     */
    fill(): Promise<Wallet.Provider.WDProvider> {
        return new Promise<Wallet.Provider.WDProvider>((resolve, reject) => {

            const addressGenerators = [
                this.bulkAddrGenerate(HD.BIP44.AddressType.RECEIVE),
                this.bulkAddrGenerate(HD.BIP44.AddressType.CHANGE)
            ];

            Promise.all(addressGenerators).then(() => {
                resolve(this.wdProvider);
            });
        });
    }
}