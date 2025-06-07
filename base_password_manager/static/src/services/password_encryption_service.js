/** @odoo-module **/

import { registry } from "@web/core/registry";
import { _t } from "@web/core/l10n/translation";




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

    async generateIV() {
        return window.crypto.getRandomValues(new Uint8Array(16));
    }

    /*
    Get the encoded message, encrypt it and display a representation
    of the ciphertext in the "Ciphertext" element.
    */
    async encryptSymetric(key, iv, message) {
        let encoded = await this.getMessageEncoding(message);
        // The iv must never be reused with a given key.
        let ciphertext = await window.crypto.subtle.encrypt(
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
    async decryptSymetric(key, iv, ciphertext) {
        let decrypted = await window.crypto.subtle.decrypt(
        {
            name: this.algo_symetric,
            iv
        },
        key,
        ciphertext
        );
        
        return await this.getMessageDecoding(decrypted);
    }

    async decryptAsymetric(key, ciphertext) {
        let decrypted = await window.crypto.subtle.decrypt(
            {
                name: this.algo_asymetric,
            },
            key, ciphertext);
        return decrypted;
    }

    async encryptAsymetric(key, message) {
        //let encoded = await this.getMessageEncoding(message);  
        return window.crypto.subtle.encrypt(
            {
                name: this.algo_asymetric,
            },
            key, message);
    }

    async generateSymetricKey() {
        return await window.crypto.subtle.generateKey(
            {
                name: this.algo_symetric,
                length: this.key_length_sym
            },
            true,
            ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
        );
    }

    async wrapSymetric(key, message) {
        return window.crypto.subtle.wrapKey("raw", message, key, this.algo_symetric);;
    }

    async unwrapSymetric(key, ciphertext) {
        return window.crypto.subtle.unwrapKey("raw", ciphertext, key, this.algo_symetric);
    }
    

    async wrapAsymetric(key, iv, message) {
        return window.crypto.subtle.wrapKey("raw", message, key, {
            name: this.algo_asymetric,
            iv,
          });
    }

    async unwrapAsymetric(key, iv, message) {
        return await window.crypto.subtle.unwrapKey(
            "raw", // import format
            message, // ArrayBuffer representing key to unwrap
            key, // CryptoKey representing key encryption key
            {
              // algorithm params for key encryption key
              name: this.algo_asymetric,
              iv: iv,
            },
            {
              // algorithm params for key to unwrap
              name: this.algo_symetric,
              hash: "SHA-256",
            },
            true, // extractability of key to unwrap
            ["wrapKey", "unwrapKey","encrypt","decrypt"], // key usages for key to unwrap
          );
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
            ["wrapKey", "unwrapKey","encrypt","decrypt"]
        ).then((keyPair) => {
            return {
                publicKey: keyPair.publicKey,
                privateKey: keyPair.privateKey
            };
        }
        );
    }
    async getUserPublicKeys() {
        return await this.orm.call("user.public.key", "search_read", [
            [['user_id', '=', user.userId]],
            ['id', 'public_key']
        ]);
    }
    async getUserPrivateKeys() {
        return await this.orm.call("user.private.key", "search_read", [
            [['user_id', '=', user.userId]],
            ['id', 'private_key']
        ]);
    }
    async storeUserKey(newKey, keyModel) {
        let Key = await this.orm.call(keyModel, "search_read", {
            user_id: user.userId,
        });
        data = {}
        if (keyModel == "user.public.key") {
            data.public_key = newKey;
        }
        else {
            data.private_key = newKey;
        }
        if (Key) {
            data.id = Key.id;
            await this.orm.call(keyModel, "write", data);
        }
        else {
            data.user_id = user.userId;
            await this.orm.call(keyModel, "create", data);
        }
    }
    
    async storeUserKeys(publicKey, privateKey) {
        await this.storeUserKey(publicKey, "user.public.key");
        await this.storeUserKey(privateKey, "user.private.key");
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