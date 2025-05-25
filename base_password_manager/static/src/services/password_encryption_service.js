/** @odoo-module **/

import { registry } from "@web/core/registry";
import { _t } from "@web/core/l10n/translation";


const MASTER_PASSWORD_KEY = 'master_key';

function getMasterPassword() {
    return sessionStorage.getItem(MASTER_PASSWORD_KEY);
}

function setMasterPassword(password) {
    sessionStorage.setItem(MASTER_PASSWORD_KEY, password);
}

// TODO is derive symetric key, the generate asym key, then generate password symetric key
// Then encrypt with symetric key password and store it
// Then encrypt symetric key with public key and store it
// Then encrypt private key with derivated symetric key and store it
export class EncryptionService {
    constructor(env, services) {
        this.setup(env, services);
        this.algo_symetric = "AES-CBC";
        this.algo_asymetric = "RSA-OAEP";
        this.key_length_sym = 256; // bits
        this.key_length_asym = 4096; // bits
    }

    setup(env, services) {
        this.env = env;
        this.orm = services.orm;
        this.passwordService = services.password_service;
    }

    async getMessageEncoding(message) {
        let enc = new TextEncoder();
        return enc.encode(message);
    }

    async getMessageDecoding(message) {
        let dec = new TextDecoder();
        return dec.decode(message);
    }

    /*
    Get the encoded message, encrypt it and display a representation
    of the ciphertext in the "Ciphertext" element.
    */
    async encryptSymetric(key, iv, message) {
        let encoded = getMessageEncoding(message);
        // The iv must never be reused with a given key.
        ciphertext = await window.crypto.subtle.encrypt(
        {
            name: this.algo_symetric,
            iv
        },
        key,
        encoded
        );

        return ciphertext;
    }

    /*
    Fetch the ciphertext and decrypt it.
    Write the decrypted message into the "Decrypted" box.
    */
    async decryptSymectric(key, iv, ciphertext) {
        let decrypted = await window.crypto.subtle.decrypt(
        {
            name: this.algo_symetric,
            iv
        },
        key,
        ciphertext
        );
        
        return this.getMessageDecoding(decrypted);
    }

    async generateSymetricKey() {
        return crypto.subtle.generateKey(
            {
                name: this.algo_symetric,
                length: this.key_length
            },
            true,
            ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
        );
    }

    async wrapAsymetric(publicKey, message) {
        let encoded = this.getMessageEncoding(message);
        let ciphertext = await window.crypto.subtle.encrypt(
            {
                name: this.algo_asymetric,
            },
            publicKey,
            encoded
        );

        return ciphertext;
    }

    async unwrapAsymetric(privateKey, ciphertext) {
        let decrypted = await window.crypto.subtle.decrypt(
            {
                name: this.algo_asymetric,
            },
            privateKey,
            ciphertext
        );

        return this.getMessageDecoding(decrypted);
    }

    async generateKeyPair() {
        return window.crypto.subtle.generateKey(
            {
                name: this.algo_asymetric,
                modulusLength: this.key_length_asym,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256" ,
            },
            true,
            ["wrapKey", "unwrapKey"]
        ).then((keyPair) => {
            return {
                publicKey: keyPair.publicKey,
                privateKey: keyPair.privateKey
            };
        }
        );
    }

    async deriveKeyFromPassword(password, salt) {
        const encodedPassword = this.getMessageEncoding(password);
        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            encodedPassword,
            { name: "PBKDF2" },
            false,
            ["deriveBits", "deriveKey"]
        );

        return crypto.subtle.deriveKey(
            {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
            },
            keyMaterial,
            { name: this.algo_asymetric, length: this.key_length_sym },
            false,
            ["wrapKey", "unwrapKey", "encrypt", "decrypt"]
        );
    }

}

export const encryptionService = {
    dependencies: ["orm", "password_service"],
    start(env, services) {
        return new EncryptionService(env, services);
    },
};

registry.category("services").add("password_encryption", encryptionService);