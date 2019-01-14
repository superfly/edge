import * as sjcl from 'sjcl'

export function createHmac(_algo: string, key: string | sjcl.BitArray) {
    const mac = new sjcl.misc.hmac(typeof key === 'string' ? sjcl.codec.utf8String.toBits(key) : key);
    return {
        update: (data: string) => {
            mac.update(data);
            return {
                digest: (encoding: string) => {
                    let result = mac.digest();
                    return encoding === 'hex' ? sjcl.codec.hex.fromBits(result) : result;
                },
            };
        },
    };
}

export function createHash() {
    const hash = new sjcl.hash.sha256();
    return {
        update: (data: string) => {
            hash.update(data);
            return {
                digest: () => sjcl.codec.hex.fromBits(hash.finalize()),
            };
        },
    };
}
