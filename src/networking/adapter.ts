export { getNetworkAdapter, getNetworkAdapters } from './utils';
import * as Coin from '../coin';
import { TAdapterOption } from './api';

export enum AdapterType {
    INSIGHT = 'insight',
    BLOCKBOOK = 'blockbook',
    ETHERSCAN = 'etherscan',
    // a symbios of two explorer - infura and etherscan
    INFURA = 'infura',
    BLOCKCYPHER_BIP = 'blockcypher-bip',
    BLOCKCYPHER_ETHER = 'blockcypher-ether'
}

export const AdapterMap: Record<string, TAdapterOption[]> = {};

// Bitcoin
AdapterMap[Coin.Unit.BTC] = [
    {
        type: AdapterType.INSIGHT,
        url: 'https://insight.bitpay.com/api',
        wsUrl: 'wss://insight.bitpay.com',
        version: '0.4.3',
    }, {
        type: AdapterType.BLOCKBOOK,
        url: 'https://btc-bitcore1.trezor.io/api',
        wsUrl: 'wss://btc-bitcore1.trezor.io',
    }, {
        type: AdapterType.INSIGHT,
        url: 'https://localbitcoinschain.com/api',
    },
];

// Bitcoin Testnet
AdapterMap[Coin.Unit.BTCt] = [
    {
        type: AdapterType.INSIGHT,
        url: 'https://test.btc.explorer.berrywallet.io/api',
        wsUrl: 'wss://test.btc.explorer.berrywallet.io',
        version: '0.4.3',
    }, {
        type: AdapterType.INSIGHT,
        url: 'https://test-insight.bitpay.com/api',
        wsUrl: 'wss://test-insight.bitpay.com',
        version: '0.4.3',
    }, {
        type: AdapterType.INSIGHT,
        url: 'https://testnet.blockexplorer.com/api',
        wsUrl: 'wss://testnet.blockexplorer.com',
        version: '0.4.2',
    },
];


// Litecoin
AdapterMap[Coin.Unit.LTC] = [
    {
        type: AdapterType.INSIGHT,
        url: 'https://ltc.explorer.berrywallet.io/api',
        wsUrl: 'wss://ltc.explorer.berrywallet.io/',
        version: '0.4.4',
    }, {
        type: AdapterType.BLOCKBOOK,
        url: 'https://ltc-bitcore1.trezor.io/api',
        wsUrl: 'wss://ltc-bitcore1.trezor.io/',
        version: '0.4.4',
    }, {
        type: AdapterType.INSIGHT,
        url: 'https://insight.litecore.io/api',
        wsUrl: 'wss://insight.litecore.io/',
        version: '0.4.4',
    },
];

AdapterMap[Coin.Unit.LTCt] = [
    {
        type: AdapterType.INSIGHT,
        url: 'https://test.ltc.explorer.berrywallet.io/api',
        wsUrl: 'wss://test.ltc.explorer.berrywallet.io/',
        version: '0.4.4',
    },
];


// DashCoin
AdapterMap[Coin.Unit.DASH] = [
    {
        type: AdapterType.INSIGHT,
        url: 'https://insight.dash.org/insight-api-dash',
        wsUrl: 'wss://insight.dash.org/',
    }, {
        type: AdapterType.BLOCKBOOK,
        url: 'https://dash-bitcore1.trezor.io/api',
        wsUrl: 'https://dash-bitcore1.trezor.io/',
    }
];

// DashCoin
AdapterMap[Coin.Unit.DASHt] = [
    {
        type: AdapterType.INSIGHT,
        url: 'https://testnet-insight.dashevo.org/insight-api-dash',
        wsUrl: 'https://testnet-insight.dashevo.org/',
    },
];

// Ethereum
AdapterMap[Coin.Unit.ETH] = [
    {
        type: AdapterType.INFURA,
        url: '<no specific url>',
        network: null,
    },
];

// Ethereum Testnet - Ropsten
AdapterMap[Coin.Unit.ETHt] = [
    {
        type: AdapterType.INFURA,
        url: '<no specific url>',
        network: 'ropsten',
    },
];
