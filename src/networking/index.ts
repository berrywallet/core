import { Coin } from '../';

import * as Adapter from './adapter';
import * as Api from './api';
import * as Events from './events';
import * as Clients from './clients';

export { Clients, Api, Events, Adapter };
export { NetworkProvider } from './network-provider';
export { getNetworkAdapters, getNetworkAdapter } from './utils';

export function createClient(coin: Coin.CoinInterface, params: Api.TAdapterOption): Clients.NetworkClient {
    switch (params.type) {
        case Adapter.AdapterType.INSIGHT:
        case Adapter.AdapterType.BLOCKBOOK:
            return new Clients.InsightNetworkClient(coin, params);

        case Adapter.AdapterType.INFURA:
            return new Clients.InfuraNetworkClient(coin, params);

        case Adapter.AdapterType.BLOCKCYPHER_BIP:
            return new Clients.BlockcypherBIPNetworkClient(coin, params);

        case Adapter.AdapterType.ETHERSCAN: {
            throw new Error('Etherscan is temporary disabled.');
            // return new Clients.EtherscanNetworkClient(coin, props.options);
        }

        case Adapter.AdapterType.BLOCKCYPHER_ETHER:
            throw new Error('You have to implement BLOCKCYPHER_ETHER');
    }

    throw new Error(`Adapter Type ${params.type} has not implemented`);
}


export function firstNetworkClient(coin: Coin.CoinInterface, index?: number): Clients.NetworkClient {
    return createClient(coin, Adapter.getNetworkAdapter(coin, index));
}
