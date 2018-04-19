import BigNumber from "bignumber.js";

//configure BigNumber for higher precision
BigNumber.config({
    DECIMAL_PLACES: 100
});

import * as Constants from "./Constants";
import * as Debug from "./Debug";
import * as Coin from "./Coin";
import * as HD from "./HD";
import * as Utils from "./Utils";
import * as Networking from "./Networking";
import * as Wallet from "./Wallet";


export {
    Constants,
    Coin,
    HD,
    Wallet,
    Networking,
    Utils,
    Debug
}