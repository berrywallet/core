const BitcoinJS = require("bitcoinjs-lib");
const Berrywallet = require('../dist');
const BIP39 = require('bip39');
const mnemonicSeed = 'flag output rich laptop hub lift list scout enjoy topic sister lab';

const addresses = [
    '1AiufCnzYbVnpChpHxWi38xJLZ2n6WsC9U'
];

const bufferSeed = BIP39.mnemonicToSeed(mnemonicSeed);


const Coin = Berrywallet.Coin;
const Utils = Berrywallet.Utils;

const testPrivateCoinMethods = () => {
    const coin = Coin.makeCoin(Coin.Unit.BTC);
    const privateCoin = coin.makePrivateFromSeed(bufferSeed);

    it('Match first address', (done, reject) => {
        if (addresses[0] !== privateCoin.getAddress().toString()) {
            throw new Error('Initial address does not matched');
        }

        done();
    });
};

describe('Private Coin test', testPrivateCoinMethods);