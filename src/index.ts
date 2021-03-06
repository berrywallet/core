import BigNumber from 'bignumber.js';

//configure BigNumber for higher precision
BigNumber.config({
    DECIMAL_PLACES: 100,
});

import Constants from './constants';
import * as Debug from './debugger';
import * as Coin from './coin';
import * as HD from './hd';
import * as Utils from './utils';
import * as Networking from './networking';
import * as Wallet from './wallet';

export { Constants, Coin, HD, Wallet, Networking, Utils, Debug };
