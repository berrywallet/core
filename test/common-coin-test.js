const assert = require('assert');
const _ = require('lodash');
const Berrywallet = require('../dist/lib');

const Coin = Berrywallet.Coin;
// const Utils = Berrywallet.Utils;

const coinsToTest = {
    [Coin.Unit.BTC]: [true],
    [Coin.Unit.ETH]: [false],
    [Coin.Unit.LTC]: [true],
    [Coin.Unit.DASH]: [true],

    [Coin.Unit.BTCt]: [true],
    [Coin.Unit.ETHt]: [false],
    [Coin.Unit.LTCt]: [true],
    [Coin.Unit.DASHt]: [true]
};

_.each(coinsToTest, (testParams, coinUnit) => {
    const coin = Coin.makeCoin(coinUnit);

    const testCoin = () => {
        it('Success build', () => {
            assert.strictEqual(coinUnit, coin.getUnit(), `${coinUnit} not accepted ${coin.getUnit()}`);
        });

        it('Test MultiAddress', () => {
            assert.strictEqual(testParams[0], coin.isMultiAddressAccount());
        });
    };

    describe(`Test public coin - ${coinUnit}`, testCoin);
});
