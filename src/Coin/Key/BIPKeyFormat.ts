import * as Key from "./index";
import * as BitcoinJS from "bitcoinjs-lib";
import * as Utils from "../../Utils";
import {BIPCoinOptions} from "../Options";

const WIF = require('wif');

export class BIPKeyFormat implements Key.FormatInterface {

    constructor(private readonly network: BitcoinJS.Network,
                private readonly options: BIPCoinOptions) {

    }

    isValidAddress(address: string): boolean {
        try {
            this.parseAddress(address);
            return true;
        } catch (e) {
            return false;
        }
    }

    isValidPublicKey(publicKey: string): boolean {
        return Utils.isHexValid(publicKey, 33, 0);
    }

    isValidPrivateKey(privateKey: string): boolean {
        try {
            this.parsePrivateKey(privateKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    parseAddress(address: string): Key.Address {
        let addr: any;
        try {
            addr = BitcoinJS.address.fromBase58Check(address);
        } catch (e) {
            throw new TypeError(`Invalid ${this.network.pubKeyHash} / ${this.network.scriptHash} address ${address}. ${e.message}`);
        }

        if (addr.version != this.network.pubKeyHash && addr.version != this.network.scriptHash) {
            throw new TypeError(`Invalid ${this.network.pubKeyHash} / ${this.network.scriptHash} address ${address}, ${addr.version}`);
        }

        return new Key.Address(addr.version, addr.hash, this);
    }

    parsePublicKey(publicKey: string): Key.Public {
        if (!this.isValidPublicKey(publicKey)) {
            throw new TypeError(`Public key ${publicKey} is not valid`);
        }
        let buf = Buffer.from(publicKey, 'hex');

        return new Key.Public(buf, this);
    }

    parsePrivateKey(privateKey: string): Key.Private {
        let wif: any;
        try {
            wif = WIF.decode(privateKey);
        } catch (e) {
            throw new TypeError(`Invalid ${this.network.wif} privkey ${privateKey}. ${e.message}`);
        }

        if (wif.version != this.network.wif) {
            throw new TypeError(`Invalid ${this.network.wif} privkey ${privateKey}.`);
        }

        return new Key.Private(wif.privateKey, this);
    }

    publicToAddress(publicKey: Key.Public): Key.Address {
        let version, address;
        if (this.options.useSegWit) {
            version = this.network.scriptHash;
            let witnessScript = BitcoinJS.script.witnessPubKeyHash.output.encode(Utils.Crypto.hash160(publicKey.toBuffer()));
            let scriptPubKey = BitcoinJS.script.scriptHash.output.encode(Utils.Crypto.hash160(witnessScript));
            let addressStr = BitcoinJS.address.fromOutputScript(scriptPubKey) as any;
            address = BitcoinJS.address.fromBase58Check(addressStr).hash
        } else {
            version = this.network.pubKeyHash;
            address = Utils.Crypto.hash160(publicKey.toBuffer());
        }

        return new Key.Address(version, address, this);
    }

    formatAddress(version: number, buffer: Buffer, options?: any): string {
        return BitcoinJS.address.toBase58Check(buffer, version);
    }

    formatPublicKey(buffer: Buffer, options?: any): string {
        return buffer.toString('hex');
    }

    formatPrivateKey(buffer: Buffer, options?: any): string {
        let compressed = options && options.compressed ? options.compressed : true;

        return WIF.encode(this.network.wif, buffer, compressed);
    }
}