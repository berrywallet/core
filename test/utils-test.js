const Berrywallet = require('../dist');

const testUtilsMethods = () => {

    const Utils = Berrywallet.Utils;
    const bufferControlString = 'What a Fuck???';
    const controlHex = '576861742061204675636b3f3f3f';

    describe('Method hexToBuffer', () => {
        it('Empty', (done, reject) => {
            if (!new Buffer('').equals(Utils.hexToBuffer('0x'))) {
                throw new Error('Can not use it!');
            }

            done();
        });

        it('Equals control string', (done, reject) => {
            if (!new Buffer(bufferControlString).equals(Utils.hexToBuffer('0x' + controlHex))) {
                throw new Error('Can not use it!');
            }

            done();
        });
    });

    describe('Method addHexPrefix', () => {
        it('Empty', (done, reject) => {
            if ('0x' !== Utils.addHexPrefix('')) {
                throw new Error('Can not use it!');
            }

            done();
        });

        it('Empty Buffer', (done, reject) => {
            if ('0x' !== Utils.addHexPrefix(new Buffer(''))) {
                throw new Error('Can not use it!');
            }

            done();
        });

        it('FF string value', (done, reject) => {
            if ('0x' + controlHex !== Utils.addHexPrefix(controlHex)) {
                throw new Error('Can not use it!');
            }

            done();
        });

        it('FF value from Buffer', (done, reject) => {
            const buffer = new Buffer(bufferControlString);
            if ('0x' + controlHex !== Utils.addHexPrefix(buffer)) {
                throw new Error('Can not use it!');
            }

            done();
        });
    });
};

describe('Utils tests', testUtilsMethods);