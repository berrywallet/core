const Berrywallet = require('../dist/lib');

describe('Test existing modules', () => {
    it('HD', (done) => {
        if ('HD' in Berrywallet) {
            done();
        }
    });

    it('Coin', (done) => {
        if ('Coin' in Berrywallet) {
            done();
        }
    });

    it('Constants', (done) => {
        if ('Constants' in Berrywallet) {
            done();
        }
    });

    it('Networking', (done) => {
        if ('Networking' in Berrywallet) {
            done();
        }
    });

    it('Utils', (done) => {
        if ('Utils' in Berrywallet) {
            done();
        }
    });

    it('Wallet', (done) => {
        if ('Wallet' in Berrywallet) {
            done();
        }
    });
});