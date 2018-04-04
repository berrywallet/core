import {each} from 'lodash';
import {Events} from "./Networking";
import InfuraNetworkClient from "./Networking/Clients/InfuraNetworkClient";
import {Coin, Networking, Wallet} from './';
import debuger from 'debug';
const BIP39 = require('bip39');

const debug = debuger('berrywallet:test-pubkey');

const coin = Coin.makeCoin(Coin.Unit.LTCt);
const networkProvider = new Networking.NetworkProvider(coin);

const mnemonicSeed = 'forward farm embrace mask skull speed cute noise pizza vendor moral harbor';
const bufferSeed = BIP39.mnemonicToSeed(mnemonicSeed);

const privateCoin = coin.makePrivateFromSeed(bufferSeed);
let i = 0;
for (i; i < 20; i++) {
    const addr = privateCoin.derive(i);
    debug("Address %s", addr.getAddress().toString());
}

// coin.getKeyFormat().parseAddress("QXbvdsYvEQvngyKxf4enF8EAJepfyuESVd");