import { Coin } from '../';

import * as Adapter from './Adapter';
import * as Api from './Api';
import * as Events from './Events';
import * as Clients from "./Clients";
import { NetworkProvider } from "./NetworkProvider";

/**
 * @param {CoinInterface} coin
 * @param {TAdapterProps} props
 *
 * @returns {NetworkClient}
 */
function createClient(coin: Coin.CoinInterface, props: Api.TAdapterProps): Clients.NetworkClient {
    switch (props.type) {
        case Adapter.AdapterType.INSIGHT:
            return new Clients.InsightNetworkClient(coin, props.options);

        case Adapter.AdapterType.INFURA:
            return new Clients.InfuraNetworkClient(coin, props.options);

        case Adapter.AdapterType.BLOCKCYPHER_BIP:
            return new Clients.BlockcypherBIPNetworkClient(coin, props.options);

        case Adapter.AdapterType.ETHERSCAN: {
            throw new Error('Etherscan is temporary disabled.');
            // return new Clients.EtherscanNetworkClient(coin, props.options);
        }

        case Adapter.AdapterType.BLOCKCYPHER_ETHER:
            throw new Error('You have to implement BLOCKCYPHER_ETHER');
    }

    throw new Error(`Adapter Type ${props.type} has not implemented`);
}

/**
 * @param {CoinInterface} coin
 * @param {number} index
 * @returns {NetworkClient}
 */
function firstNetworkClient(coin: Coin.CoinInterface, index?: number): Clients.NetworkClient {
    return createClient(coin, Adapter.getNetworkAdapter(coin, index));
}


export {
    Clients,
    Api,
    Events,
    Adapter,
    NetworkProvider,

    createClient,
    firstNetworkClient,
};