/** @odoo-module **/

import { registry } from "@web/core/registry";
import { _t } from "@web/core/l10n/translation";

class PasswordEncryptionService {
    constructor() {
        this.algorithm = {
            name: 'PBKDF2',
            iterations: 100000,
            hash: 'SHA-256',
        };
    }

    async start() {
        return this;
    }

    async deriveKey(masterPassword, salt) {
        try {
            const encoder = new TextEncoder();
            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                encoder.encode(masterPassword),
                'PBKDF2',
                false,
                ['deriveBits', 'deriveKey']
            );

            const key = await crypto.subtle.deriveKey(
                {
                    ...this.algorithm,
                    salt: encoder.encode(salt),
                },
                keyMaterial,
                { name: 'AES-GCM', length: 256 },
                false,
                ['encrypt', 'decrypt']
            );

            return key;
        } catch (error) {
            console.error('Key derivation failed:', error);
            throw new Error(_t('Failed to derive encryption key'));
        }
    }

    async encryptPassword(password, masterPassword, salt) {
        try {
            const key = await this.deriveKey(masterPassword, salt);
            const encoder = new TextEncoder();
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            const encryptedData = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv,
                },
                key,
                encoder.encode(password)
            );

            const encryptedArray = new Uint8Array(encryptedData);
            const result = new Uint8Array(iv.length + encryptedArray.length);
            result.set(iv);
            result.set(encryptedArray, iv.length);

            return btoa(String.fromCharCode.apply(null, result));
        } catch (error) {
            console.error('Encryption failed:', error);
            throw new Error(_t('Failed to encrypt password'));
        }
    }

    async decryptPassword(encryptedPassword, masterPassword, salt) {
        try {
            const key = await this.deriveKey(masterPassword, salt);
            const decoder = new TextDecoder();
            const encryptedData = Uint8Array.from(atob(encryptedPassword), c => c.charCodeAt(0));
            
            const iv = encryptedData.slice(0, 12);
            const data = encryptedData.slice(12);

            const decryptedData = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv,
                },
                key,
                data
            );

            return decoder.decode(decryptedData);
        } catch (error) {
            console.error('Decryption failed:', error);
            throw new Error(_t('Failed to decrypt password'));
        }
    }
}

const passwordEncryptionService = new PasswordEncryptionService();
registry.category("services").add("password_encryption", passwordEncryptionService); 