import { AdapterType } from '../Adapter';

import * as Blockcypher from './Blockcypher';
import * as EthereumBlockcypher from './EthereumBlockcypher';
import * as Etherscan from './Etherscan';
import * as Infura from './Infura';
import * as Insight from './Insight';


export type TAdapterOption = {
    url: string;
    wsUrl?: string;

    [key: string]: any;
};


export type TAdapterProps = {
    type: AdapterType;
    options: TAdapterOption;
};

export { Blockcypher, EthereumBlockcypher, Etherscan, Infura, Insight };
