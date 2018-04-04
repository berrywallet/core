import {AdapterPropsInterface} from "./Api";
import * as Coin from "../Coin";

enum AdapterType {
    INSIGHT = 'insight',
    ETHERSCAN = 'etherscan',
    // a symbios of two explorer - infura and etherscan
    INFURA = 'infura',
    BLOCKCYPHER_BIP = 'blockcypher-bip',
    BLOCKCYPHER_ETHER = 'blockcypher-ether'
}

const AdapterMap = [];

// Bitcoin
AdapterMap[Coin.Unit.BTC] = [{
    type: AdapterType.INSIGHT,
    options: {
        url: 'https://btc-bitcore1.trezor.io/api',
        wsUrl: 'wss://btc-bitcore1.trezor.io',
        version: '0.4.3'
    }
}, {
    type: AdapterType.INSIGHT,
    options: {
        url: 'https://insight.bitpay.com/api',
        wsUrl: 'wss://insight.bitpay.com',
        version: '0.4.3'
    }
}, {
    type: AdapterType.INSIGHT,
    options: {
        url: 'https://localbitcoinschain.com/api'
    }
}];

// Bitcoin Testnet
AdapterMap[Coin.Unit.BTCt] = [{
    type: AdapterType.INSIGHT,
    options: {
        url: 'https://test-insight.bitpay.com/api',
        wsUrl: 'wss://test-insight.bitpay.com',
        version: '0.4.3'
    }
}];


// Litecoin
AdapterMap[Coin.Unit.LTC] = [{
    type: AdapterType.INSIGHT,
    options: {
        url: 'https://ltc-bitcore1.trezor.io/api',
        wsUrl: 'wss://ltc-bitcore1.trezor.io/',
        version: '0.4.4'
    }
}, {
    type: AdapterType.INSIGHT,
    options: {
        url: 'https://insight.litecore.io/api',
        wsUrl: 'wss://insight.litecore.io/',
        version: '0.4.4'
    }
}];

AdapterMap[Coin.Unit.LTCt] = [{
    type: AdapterType.INSIGHT,
    options: {
        url: 'https://test.ltc.explorer.berrywallet.io/api',
        wsUrl: 'wss://test.ltc.explorer.berrywallet.io/',
        version: '0.4.4'
    }
}];


// DashCoin
AdapterMap[Coin.Unit.DASH] = [{
    type: AdapterType.INSIGHT,
    options: {
        url: 'https://dash-bitcore1.trezor.io/api',
        wsUrl: 'https://dash-bitcore1.trezor.io/'
    }
}, {
    type: AdapterType.INSIGHT,
    options: {
        url: 'https://insight.dash.org/insight-api-dash',
        wsUrl: 'wss://insight.dash.org/'
    }
}];

// DashCoin
AdapterMap[Coin.Unit.DASHt] = [{
    type: AdapterType.INSIGHT,
    options: {
        url: 'https://testnet-insight.dashevo.org/insight-api-dash',
        wsUrl: 'https://testnet-insight.dashevo.org/'
    }
}];

// Ethereum
AdapterMap[Coin.Unit.ETH] = [{
    type: AdapterType.INFURA,
    options: {
        url: '<no specific url>',
        network: null
    }
}];

// Ethereum Testnet - Ropsten
AdapterMap[Coin.Unit.ETHt] = [{
    type: AdapterType.INFURA,
    options: {
        url: '<no specific url>',
        network: 'ropsten'
    }
}];

function getNetworkAdapter(coin: Coin.CoinInterface, index: number = 0): AdapterPropsInterface {
    return AdapterMap[coin.getUnit()][index];
}

function getNetworkAdapters(coin: Coin.CoinInterface): AdapterPropsInterface[] {
    return AdapterMap[coin.getUnit()];
}


export {
    AdapterType,
    AdapterMap,
    getNetworkAdapter,
    getNetworkAdapters
}