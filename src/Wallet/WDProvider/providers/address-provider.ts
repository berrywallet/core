import { filter, find, first, Dictionary, sumBy } from 'lodash';

import * as HD from '../../../HD';
import * as Coin from '../../../Coin';
import * as Entity from '../../Entity';

import SimpleProvider from './SimpleProvider';

export default class AddressProvider extends SimpleProvider {

    /**
     * @param {string} address
     * @param {AddressType} type
     * @param {number} index
     *
     * @returns {WalletAddress}
     */
    add(address: string, type: HD.BIP44.AddressType, index: number): Entity.WalletAddress {
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
            addresses: [...this.getWalletData().addresses, newAddress],
        });

        return newAddress;
    }

    /**
     * @param {AddressType} addressType
     * @returns {number}
     */
    count(addressType: HD.BIP44.AddressType = null): number {
        return this.list(addressType).length;
    }

    /**
     * Get list of Current Wallet data addresses
     *
     * @returns {WalletAddress[]}
     */
    list(addressType: HD.BIP44.AddressType = null): Entity.WalletAddress[] {
        if (null !== addressType) {
            return filter(this.getWalletData().addresses, wlt => wlt.type === addressType);
        }

        return this.getWalletData().addresses;
    }

    /**
     * @param {string} address
     *
     * @returns {WalletAddress | null}
     */
    get(address: string): Entity.WalletAddress | null {
        return find(this.getWalletData().addresses, { address: address });
    }

    /**
     * @returns {Dictionary<Balance>}
     */
    getAddrBalances(): Dictionary<Entity.Balance> {
        const balance = this.wdProvider.balance;

        return balance.addrBalances;
    }

    /**
     * @param {AddressType} type
     * @returns {number}
     */
    pureAddrCount(type: HD.BIP44.AddressType): number {
        let addresses = this.list(type);
        const addrBalances = this.getAddrBalances();

        return sumBy(addresses, (addr: Entity.WalletAddress): number => {
            const addrBalance = addrBalances[addr.address];

            if (!addrBalance) return 0;

            return addrBalance.receive.isZero() && addrBalance.spend.isZero() ? 1 : 0;
        });
    }

    /**
     * @param {AddressType} type
     * @param {WDBalance} balance
     *
     * @returns {WalletAddress | null}
     */
    last(type: HD.BIP44.AddressType, balance: Entity.WDBalance = null): Entity.WalletAddress | null {
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
