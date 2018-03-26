const CreateHash = require('create-hash');


export function ripemd160(buffer: Buffer): Buffer {
    return CreateHash('rmd160').update(buffer).digest()
}

export function sha1(buffer: Buffer): Buffer {
    return CreateHash('sha1').update(buffer).digest()
}

export function sha256(buffer: Buffer): Buffer {
    return CreateHash('sha256').update(buffer).digest()
}

export function hash160(buffer: Buffer): Buffer {
    return ripemd160(sha256(buffer))
}

export function doubleHash256(buffer: Buffer): Buffer {
    return sha256(sha256(buffer))
}
