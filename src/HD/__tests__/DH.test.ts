import { BIP44 } from '../';

test('AddressType RECEIVE', () => {
    expect(BIP44.AddressType.RECEIVE).toBe(0);
});

test('AddressType CHANGE', () => {
    expect(BIP44.AddressType.CHANGE).toBe(1);
});
