export type Transaction = {
    tx_hash: string;
    block_height: number;
    tx_input_n: number;
    tx_output_n: number;
    value: number;
    ref_balance: number;
    confirmations: number;
    confirmed: string; // DateTime
    double_spend: boolean;
};

export type AddressInfo = {
    address: string;
    total_received: number;
    total_sent: number
    balance: number;
    unconfirmed_balance: number;
    final_balance: number;
    n_tx: number;
    unconfirmed_n_tx: number;
    final_n_tx: number;
    txrefs: Transaction[];
    hasMore: boolean;
    tx_url: string;
};
