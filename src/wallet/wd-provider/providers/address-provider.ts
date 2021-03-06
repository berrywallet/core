import { filter, find, first, sumBy } from 'lodash';

import * as HD from '../../../hd';
import * as Coin from '../../../coin';
import * as Entity from '../../entity';

import { SimpleProvider } from './simple-provider';

export class AddressProvider extends SimpleProvider {

    public add(address: string, type: HD.BIP44.AddressType, index: number): Entity.WalletAddress {
        const existedAddress = this.get(address);
        if (existedAddress) {
            return existedAddress;
        }

        const newAddress: Entity.WalletAddress = {
            address: address,
            type: type,
            index: index,
        };

        this.setData({
            addresses: [
                ...this.getWalletData().addresses,
                newAddress
            ],
        });

        return newAddress;
    }


    public count(addressType: HD.BIP44.AddressType = null): number {
        return this.list(addressType).length;
    }


    public list(addressType: HD.BIP44.AddressType = null): Entity.WalletAddress[] {
        if (null !== addressType) {
            return filter(this.getWalletData().addresses, wlt => wlt.type === addressType);
        }

        return this.getWalletData().addresses;
    }


    public get(address: string): Entity.WalletAddress | undefined {
        return find(this.getWalletData().addresses, { address: address });
    }


    public getAddrBalances(): Record<string, Entity.Balance> {
        const balance = this.wdProvider.balance;

        return balance.addrBalances;
    }


    public pureAddrCount(type: HD.BIP44.AddressType): number {
        let addresses = this.list(type);
        const addrBalances = this.getAddrBalances();

        return sumBy(addresses, (addr: Entity.WalletAddress): number => {
            const addrBalance = addrBalances[addr.address];

            if (!addrBalance) return 0;

            return addrBalance.receive.isZero() && addrBalance.spend.isZero() ? 1 : 0;
        });
    }


    public last(type: HD.BIP44.AddressType, balance: Entity.WDBalance = null): Entity.WalletAddress | null {
        let addresses = this.list(type);

        // @TODO Need to review model and change
        if (this.getCoin() instanceof Coin.Defined.Ethereum) {
            return first(addresses);
        }

        if (!balance) {
            balance = this.wdProvider.balance;
        }

        return find(addresses, (addr: Entity.WalletAddress) => {
            const addrBalance = balance.addrBalances[addr.address];

            if (!addrBalance) return false;

            return addrBalance.receive.isZero() && addrBalance.spend.isZero();
        });
    }
}
