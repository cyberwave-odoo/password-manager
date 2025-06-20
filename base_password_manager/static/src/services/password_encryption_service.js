/** @odoo-module **/

import { registry } from "@web/core/registry";
import { _t } from "@web/core/l10n/translation";
import { user } from "@web/core/user";



// TODO is derive symetric key, the generate asym key, then generate password symetric key
// Then encrypt with symetric key password and store it
// Then encrypt symetric key with public key and store it
// Then encrypt private key with derivated symetric key and store it
export class EncryptionService {
    constructor(env, services) {
        this.setup(env, services);
        this.algo_symetric = "AES-GCM";
        this.algo_asymetric = "RSA-OAEP";
        this.key_length_sym = 256; // bits
        this.key_length_asym = 4096; // bits
        this.iv_length = 16;
    }

    setup(env, services) {
        this.env = env;
        this.orm = services.orm;
        this.passwordService = services.password_service;
        this.convert = services.convert;
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
        return window.crypto.getRandomValues(new Uint8Array(this.iv_length));
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
    async decryptSymetric(key, ciphertext, iv) {
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

    async wrapSymetric(key, message, iv) {
        return await window.crypto.subtle.wrapKey("jwk", message, key, {
            name: this.algo_symetric,
            iv: iv
        });
    }

    async unwrapSymetric(key, message, iv) {
        return await window.crypto.subtle.unwrapKey(
            "jwk", // import format
            message, // ArrayBuffer representing key to unwrap
            key, // CryptoKey representing key encryption key
            {
              // algorithm params for key encryption key
              name: this.algo_symetric,
              iv: iv,
            },
            {
              // algorithm params for key to unwrap
              name: this.algo_asymetric,
              hash: "SHA-256",
            },
            true, // extractability of key to unwrap
            [ "decrypt", "unwrapKey" ], // key usages for key to unwrap
          );
        }
    

    async wrapAsymetric(key, message) {
        return window.crypto.subtle.wrapKey("jwk", message, key, {
            name: this.algo_asymetric,

          });
    }

    async unwrapAsymetric(key, message) {
        return await window.crypto.subtle.unwrapKey(
            "jwk", // import format
            message, // ArrayBuffer representing key to unwrap
            key, // CryptoKey representing key encryption key
            {
              // algorithm params for key encryption key
              name: this.algo_asymetric,
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



    
    async storeUserKeys(publicKey, privateKey, wrapKey, iv) {
        let exported_public = await crypto.subtle.exportKey(
            "jwk",
            publicKey
        );
        let privateKey_wrapped = await this.wrapSymetric(
            wrapKey,
            privateKey,
            iv
        );
        let exported_private = await this.convert.arrayBufferToBase64(privateKey_wrapped);
        return await this.orm.call(
            'user.private.key',
            'create_key_pair',
            [exported_public, exported_private, await this.convert.Uint8ArrayToBase64(iv)]
        );
    }

    parsePyStr(str) {
        return JSON.parse(str.replace(/'/g, '"')           // Replace single quotes with double quotes
      .replace(/\bTrue\b/g, 'true') // Replace True with true
      .replace(/\bFalse\b/g, 'false') // Replace False with false
      .replace(/\bNone\b/g, 'null'))
    }

    async getActiveKeyPair() {
        let keys = await this.orm.call(
            'user.private.key',
            'get_active_key_pair',
            []
        );
        let derivedKey = await this.derivedKey();
        if (keys) {
            let iv = await this.convert.Base64ToUint8Array(keys.iv); 
            const params = {    
                name: this.algo_asymetric,
                hash: "SHA-256",
            }
            
            let public_key = await crypto.subtle.importKey(
                "jwk",
                this.parsePyStr(keys.public_key),
                params,
                true,
                ["wrapKey","encrypt",]
            );
            let encoded_private = await this.convert.base64ToArrayBuffer(keys.private_key);

            let private_key = await this.unwrapSymetric(derivedKey, encoded_private, iv);
            
            return {
                publicKey: public_key,
                privateKey: private_key,
                id: keys.id
            };
        }
        else {
            keys = await this.generateKeyPair();
            let iv = await this.generateIV();
            let storedKeys = await this.storeUserKeys(keys.publicKey, keys.privateKey, derivedKey, iv);
            keys['id'] = storedKeys.id;
            return keys;
        }  
    }
    
    async deriveKeyFromPassword(password, salt) {
        const encodedPassword = await this.getMessageEncoding(password);
        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            encodedPassword,
            { name: "PBKDF2" },
            false,
            ["deriveBits", "deriveKey"]
        );
        let encoded_salt = await this.getMessageEncoding(salt);
        return await crypto.subtle.deriveKey(
            {
                "name": "PBKDF2",
                salt: encoded_salt, 
                "iterations": 600000,
                "hash": "SHA-256"
              },
              keyMaterial,
              { "name": this.algo_symetric, "length": 256},
              true,
              ["wrapKey", "unwrapKey","encrypt","decrypt"]
        );
    }

    async derivedKey() {
        // this must check that the password entered is appropriate
        // TODO what happend when the master password is changed?
        let masterPassword = this.passwordService.getMasterPassword();

        if (!masterPassword) {
            masterPassword = prompt(_t("Please enter your master password:"));
            if (masterPassword) {
                this.passwordService.setMasterPassword(masterPassword);
            }
        }
        if (!masterPassword) {
            return;
        }
        const salt = this.passwordService.getUserSalt();
        let key = await this.deriveKeyFromPassword(masterPassword, salt);
        return key;
    } 
}

export const encryptionService = {
    dependencies: ["orm", "password_service", "convert"],
    start(env, services) {
        return new EncryptionService(env, services);
    },
};

registry.category("services").add("password_encryption", encryptionService);