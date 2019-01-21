import { times } from 'lodash';
import Bottleneck from 'bottleneck';
import { WDGenerator } from './wd-generator';
import { Coin, Wallet, HD, Constants } from '../../';

export class BIPWalletGenerator extends WDGenerator {
    protected readonly limiter: Bottleneck;


    public constructor(coin: Coin.CoinInterface, seed: Buffer) {
        super(coin, seed);

        this.limiter = new Bottleneck(1, 100);
    }


    public deriveAddresses(addressCount: number,
                           addressType: HD.BIP44.AddressType): Promise<string[]> {

        const privateProvider = this.wdProvider.getPrivate(this.seed);
        const addrsPromises: Promise<string>[] = [];

        times(addressCount, () => {
            addrsPromises.push(
                this.limiter.schedule(async () => privateProvider.deriveNew(addressType).address)
            );
        });

        return Promise.all(addrsPromises);
    }


    public async extractAddrsTxs(addrs: string[]): Promise<Wallet.Entity.WalletTransaction[]> {
        const networkProvider = this.wdProvider.getNetworkProvider();

        return networkProvider.getBulkAddrTxs(addrs);
    }


    public async bulkAddrGenerate(addressType: HD.BIP44.AddressType): Promise<void> {
        const addrs: string[] = await this.deriveAddresses(Constants.MIN_ADDRESS_COUNT, addressType);

        const txs: Wallet.Entity.WalletTransaction[] = await this.extractAddrsTxs(addrs);
        this.fillAddrsTxs(txs);

        const pureAddrCount = this.wdProvider.address.pureAddrCount(addressType);
        if (pureAddrCount < Constants.MIN_ADDRESS_COUNT) {
            this.bulkAddrGenerate(addressType);
        }
    }


    public async fill(): Promise<Wallet.Provider.WDProvider> {
        await this.bulkAddrGenerate(HD.BIP44.AddressType.RECEIVE);
        await this.bulkAddrGenerate(HD.BIP44.AddressType.CHANGE);

        return this.wdProvider;
    }
}
