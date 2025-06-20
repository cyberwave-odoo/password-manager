/** @odoo-module **/

import { registry } from "@web/core/registry";
import { _t } from "@web/core/l10n/translation";
import { user } from "@web/core/user";



// TODO is derive symetric key, the generate asym key, then generate password symetric key
// Then encrypt with symetric key password and store it
// Then encrypt symetric key with public key and store it
// Then encrypt private key with derivated symetric key and store it
export class ConvertService {
    constructor(env, services) {
        this.setup(env, services);
    }

    setup(env, services) {
        this.env = env;
    }

    async Uint8ArrayToBase64(bytes) {
        let binary = '';
        for (let b of bytes) binary += String.fromCharCode(b);
        return btoa(binary);
    }

    async arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        return await this.Uint8ArrayToBase64(bytes);
        }


    async base64ToArrayBuffer(base64) {
        return (await this.Base64ToUint8Array(base64)).buffer;
        }

    async Base64ToUint8Array(base64) {
        const binary = atob(base64); // decode Base64 to binary string
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i); // get char code (0–255)
        }
        return bytes;
    }

}

export const convert = {

    start(env, services) {
        return new ConvertService(env, services);
    },
};

registry.category("services").add("convert", convert);