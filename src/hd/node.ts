import WIF from 'wif';
import BigInteger from 'bigi';
import { HDNode, ECPair } from 'bitcoinjs-lib';

export interface NodeInterface {

    getPublicKey(): Buffer

    getPrivateKey(): Buffer

    derive(index: number, hardened?: boolean): NodeInterface

    derivePath(path: string): NodeInterface

}

export class BasicNode implements NodeInterface {

    /**
     * @deprecated
     * @use BIP32 library insteadof BitcoinJS.HDNode to move BitcoinJS 4.0.0
     *
     * import bip32 from 'bip32';
     **/
    private hdNode: HDNode;

    public constructor(pi: BigInteger, chainCode: Buffer) {
        this.hdNode = new HDNode(
            new ECPair(pi, null, { compressed: true }),
            chainCode,
        );
    }

    public static fromBitcoinJsHDNode(hdNode: HDNode): BasicNode {
        return new BasicNode((hdNode.keyPair as any).d, (hdNode as any).chainCode);
    }

    public static fromSeedBuffer(seed: Buffer): BasicNode {
        return BasicNode.fromBitcoinJsHDNode(HDNode.fromSeedBuffer(seed));
    }

    public getECKeyPair(): ECPair {
        return this.hdNode.keyPair;
    }

    public getPublicKey(): Buffer {
        return this.hdNode.getPublicKeyBuffer();
    }

    public getPrivateKey(): Buffer {
        let wif: WIF.WIF = WIF.decode(this.hdNode.keyPair.toWIF());

        return wif.privateKey;
    }

    public derive(index: number, hardened?: boolean): NodeInterface {
        let derivedNode = hardened ?
            this.hdNode.deriveHardened(index) :
            this.hdNode.derive(index);

        return BasicNode.fromBitcoinJsHDNode(derivedNode);
    }

    public derivePath(path: string): NodeInterface {
        let derivedNode = this.hdNode.derivePath(path);

        return BasicNode.fromBitcoinJsHDNode(derivedNode);
    }
}