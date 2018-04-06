import BigNumber from "bignumber.js";

//configure BigNumber for higher precision
BigNumber.config({
    DECIMAL_PLACES: 100
});

import * as Coin from "./Coin";
import * as HD from "./HD";
import * as Utils from "./Utils";
import * as Networking from "./Networking";
import * as Wallet from "./Wallet";
import * as Constants from "./Constants";

export {
    Constants,
    Coin,
    HD,
    Wallet,
    Networking,
    Utils
}