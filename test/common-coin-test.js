const assert = require('assert');
const _ = require('lodash');
const Berrywallet = require('../dist/lib');

const Coin = Berrywallet.Coin;
// const Utils = Berrywallet.Utils;

const coinsToTest = {
    [Coin.Unit.BTC]: {
        isMultiaddress: true,
        parseAddress: {
            addr: '1Cud6K5gsnJ3Trc2Y2gbikbqBGmqPKTyb6',
            version: 0
        }
    },
    [Coin.Unit.ETH]: {
        isMultiaddress: false,
        parseAddress: {
            addr: '0xfe36eef5f8f1b2d097d51ffd1c78804f48886d93',
            version: 0
        }
    },
    [Coin.Unit.LTC]: {
        isMultiaddress: true
    },
    [Coin.Unit.DASH]: {
        isMultiaddress: true,
        parseAddress: {
            addr: 'XhkqBcJaeqezeHkbcx1PRktseaG4fKnGso',
            version: 76
        }
    },

    [Coin.Unit.BTCt]: {
        isMultiaddress: true
    },
    [Coin.Unit.ETHt]: {
        isMultiaddress: false
    },
    [Coin.Unit.LTCt]: {
        isMultiaddress: true
    },
    [Coin.Unit.DASHt]: {
        isMultiaddress: true
    }
};

_.each(coinsToTest, (testParams, coinUnit) => {
    const coin = Coin.makeCoin(coinUnit);

    const testCoin = () => {
        it('Success build', () => {
            assert.strictEqual(coinUnit, coin.getUnit(), `${coinUnit} not accepted ${coin.getUnit()}`);
        });

        it('Test MultiAddress', () => {
            assert.strictEqual(testParams.isMultiaddress, coin.isMultiAddressAccount());
        });

        if (testParams.parseAddress) {
            it(`Test Parse ${coinUnit} address`, () => {
                assert.strictEqual(
                    coin.getKeyFormat().parseAddress(testParams.parseAddress.addr).getVersion(),
                    testParams.parseAddress.version
                );
            });
        }
    };

    describe(`Test public coin - ${coinUnit}`, testCoin);
});
