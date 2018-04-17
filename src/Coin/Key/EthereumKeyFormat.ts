import * as Key from "./";
import * as EthereumJsUtil from "ethereumjs-util";
import * as Utils from "../../Utils";


export class EthereumKeyFormat implements Key.FormatInterface {

    isValidAddress(address: string): boolean {
        return EthereumJsUtil.isValidAddress(address);
    }

    isValidPublicKey(publicKey: string): boolean {
        if(Utils.isHexValid(publicKey, 33, 1)) {
            return EthereumJsUtil.isValidPublic(Utils.hexToBuffer(publicKey), true);
        }

        return false;
    }

    isValidPrivateKey(privateKey: string): boolean {
        if (Utils.isHexValid(privateKey, 33, 1)) {
            return EthereumJsUtil.isValidPrivate(Utils.hexToBuffer(privateKey));
        }

        return false;
    }

    parseAddress(address: string): Key.Address {
        if(!this.isValidAddress(address)) {
            throw new TypeError(`Invalid address ${address}`);
        }

        return new Key.Address(0, Utils.hexToBuffer(address), this);
    }

    parsePublicKey(publicKey: string): Key.Public {
        if(!this.isValidAddress(publicKey)) {
            throw new TypeError(`Invalid public key ${publicKey}`);
        }

        return new Key.Public(Utils.hexToBuffer(publicKey), this);
    }

    parsePrivateKey(privateKey: string): Key.Private {
        if(!this.isValidPrivateKey(privateKey)) {
            throw new TypeError(`Invalid private key ${privateKey}`);
        }

        return new Key.Private(Utils.hexToBuffer(privateKey), this);
    }

    publicToAddress(publicKey: Key.Public): Key.Address {
        let addressBuffer = EthereumJsUtil.publicToAddress(publicKey.toBuffer(), true);
        return new Key.Address(0, addressBuffer, this);
    }

    formatAddress(version: number, buffer: Buffer, options?: any): string {

        if(version != 0) {
            throw new Error(`Unknown version ${version}`);
        }

        let checksummed = (options && 'checksummed' in options) ? options.checksummed : false;
        let address = EthereumJsUtil.addHexPrefix(buffer.toString('hex'));
        if(checksummed) {
            address = EthereumJsUtil.toChecksumAddress(address);
        }
        return address;
    }

    formatPublicKey(buffer: Buffer, options?: any): string {
        return EthereumJsUtil.addHexPrefix(buffer.toString('hex'));
    }

    formatPrivateKey(buffer: Buffer, options?: any): string {
        return EthereumJsUtil.addHexPrefix(buffer.toString('hex'));
    }
}