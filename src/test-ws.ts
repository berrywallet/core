import {each} from 'lodash';
import {Events} from './Networking';
import InfuraNetworkClient from './Networking/Clients/InfuraNetworkClient';
import {Coin, Networking, Wallet} from './';

const coin = Coin.makeCoin(Coin.Unit.LTCt);
const networkProvider = new Networking.NetworkProvider(coin);

const handleNewBlock = (block: Wallet.Entity.Block) => {
    console.log(`${coin.getUnit()} :: ${block.height} :: TX count: ${block.txids.length}`);
};

networkProvider.onNewBlock(handleNewBlock);

networkProvider.onTransactionConfirm(
    'cf0d196938cb6118b4060ef6ea98c5f6148f2b4266edff435565ed208f95b9b9',
    (tx) => console.log
);

networkProvider.getTracker().onConnectionError((error) => {
    console.log("It's disconnection error!!!!");
});

networkProvider.getTracker().onConnect(() => {
    console.log(`${coin.getUnit()} :: Connected!`);
});