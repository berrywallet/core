import {EtherTransaction} from "./Wallet/Entity";

const BIP39 = require('bip39');
import BigNumber from "bignumber.js";
import {each} from 'lodash';

import {Coin, Wallet, Networking, HD, Utils} from './';

const coins = [
    // {
    //     coin: Coin.makeCoin(Coin.Unit.ETHt),
    //     address: '0x6a42b86469B9c3Df1e1De589bd1741B81a5A5fAF'
    // },
    // {
    //     coin: Coin.makeCoin(Coin.Unit.BTC),
    //     address: '15Wmq5V7ojGWCTWtjdWKsJCQB29gTB6VMa'
    // },
    {
        coin: Coin.makeCoin(Coin.Unit.BTCt),
        address: 'mm5GgtNrzXKE7y8LZhtdvX6uhuTmWL12eZ'
    },
    // {
    //     coin: Coin.makeCoin(Coin.Unit.DASH),
    //     address: 'XdYysbHbuV9tMg31NvE7DnzoySvoeZGmor'
    // },
    // {
    //     coin: Coin.makeCoin(Coin.Unit.DASHt),
    //     address: 'yjYxawxUJCDVmKKkKTCVbkT6ca2zWL28vz'
    // }
];

const oldSeed = 'honey relief scale kite dose lyrics they middle globe exhaust smooth galaxy ' +
    'horror ensure grape way gift embody spring cupboard horror hurt image swift';

const mnemonicSeed = 'flag output rich laptop hub lift list scout enjoy topic sister lab';
// const mnemonicSeed = 'flag output rich laptop hub lift list horror enjoy topic sister lab';
const bufferSeed = BIP39.mnemonicToSeed(mnemonicSeed);


function onWdCreated(wdProvider: Wallet.Provider.WDProvider) {

    wdProvider.onChange((newWalletData) => {
        console.log("Address count: ", newWalletData.addresses.length);
    });

    const privateProvider = wdProvider.getPrivate(bufferSeed);
    const networkProvider = wdProvider.getNetworkProvider();
    const balance: Wallet.Entity.WDBalance = wdProvider.balance;

    const extractTx = (txid: string) => {
        console.log('Extracting ' + txid + ' ... ');
        networkProvider.getTx(txid).then((tx: Wallet.Entity.WalletTransaction | null) => {
            if (!tx) {
                setTimeout(() => {
                    extractTx(txid);
                }, 1000);
                return;
            }
            console.log('------------------------------------------------------------------');
            console.log('- TX at network! -------------------------------------------------');
            console.log(tx);
            console.log('------------------------------------------------------------------');
            console.log('');
        });
    };

    each(wdProvider.address.list(), (addr: Wallet.Entity.WalletAddress) => {
        console.log(
            "Address: %s / Index: %s / Type: %s",
            addr.address,
            addr.index,
            addr.type
        );
    });

    console.log('Addrs: ');
    each(balance.addrBalances, (balance: Wallet.Entity.Balance, addr: string) => {
        console.log(`${addr}: ${balance.receive.toNumber()} > ${balance.unconfirmed.toNumber()} > ${balance.receive.sub(balance.spend).sub(balance.unconfirmed).toNumber()}`);
    });
    console.log('');
    console.log('Txs: ');
    each(balance.txBalances, (balance: Wallet.Entity.Balance, txid: string) => {
        console.log(`${txid}: ${balance.receive.toNumber()} - ${balance.spend.toNumber()}`);
    });
    console.log('');

    const resolveNewTransaction = (transaction: Coin.Transaction.BIPTransaction) => {
        const renderStartStats = () => {
            console.log();
            console.log('------------------------------------------------------------------');
            console.log(transaction.toBuffer().toString('hex'));
            console.log('');
        };

        privateProvider
            .broadcastTransaction(transaction)
            .then((txid: string) => {
                renderStartStats();
                console.log('------------------------------------------------------------------');
                console.log(txid);
                console.log('------------------------------------------------------------------');
                console.log('');

                extractTx(txid);
            })
            .catch((error) => {
                renderStartStats();
                console.log('------------------------------------------------------------------');
                console.error(error.message);
                console.log('------------------------------------------------------------------');
                console.log('');
            });
    };


    const resolveFee = (fee: BigNumber) => {
        console.log("Fee: ", fee.toFixed());
    };

    try {
        privateProvider
            .calculateFee(
                new BigNumber(0.5),
                this.coinInfo.coin.getKeyFormat().parseAddress(this.coinInfo.address),
                Coin.FeeTypes.Low
            )
            .then(resolveFee)
            .catch(error => {
                console.log(error);
                throw error;
            });
    } catch (error) {
        console.error(`ERROR - ${error.message}`);
        console.log('');
        console.log('');
        console.log('');
    }
};


coins.forEach((coinInfo) => {
    const walletGenerator = Wallet.Generator.createGenerator(coinInfo.coin, bufferSeed);
    walletGenerator
        .fill()
        .then(onWdCreated.bind({coinInfo}));
});