/** @odoo-module **/

import { registry } from "@web/core/registry";
import { _t } from "@web/core/l10n/translation";
import { user } from "@web/core/user";

export class PasswordService {
    constructor(env, services) {
        this.setup(env, services);
    }
    setup(env, services) {
        this.env = env;
        this.orm = services.orm;
        this.notification = services.notification;
        this.MASTER_PASSWORD_KEY = 'master_key';
        this.DERIVED_KEY = 'derived_key';
        this.convert = services.convert;
    }


    getMasterPassword() {
        return sessionStorage.getItem(this.MASTER_PASSWORD_KEY);
    }

    setMasterPassword(password) {
        sessionStorage.setItem(this.MASTER_PASSWORD_KEY, password);
    }

    getDerivedKey() {
        return sessionStorage.getItem(this.DERIVED_KEY);
    }

    setDerivedKey(key) {
        sessionStorage.setItem(this.DERIVED_KEY, key);
    }
    
    async getUserSalt() {
        try {
            const salt = await this.orm.read("res.users", [user.userId], ["password_salt"]);
            return salt[0].password_salt;
        } catch (error) {
            throw error;
        }
    }

    async updatePasswordEntry(entryId, data) {
        try {
            data['encrypted_password'] = await this.convert.arrayBufferToBase64(data['encrypted_password']),
            data['iv'] = await this.convert.Uint8ArrayToBase64(data['iv']),
            await this.orm.write("password.entry", entryId, data);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Password Key Operations
     */
    async createPasswordKey(dataArray) {
        try {
            if (!Array.isArray(dataArray)) {
                throw new Error("Input must be an array of records.");
            }

            // Convert encrypted_key to base64 for each record
            const transformedData = await Promise.all(
                dataArray.map(async (record) => ({
                    ...record,
                    encrypted_key: await this.convert.arrayBufferToBase64(record.encrypted_key),
                }))
            );
            console.log(transformedData);
            // Create all password.key records in one ORM call
            const keyIds = await this.orm.create("password.key", transformedData);
            return keyIds;
        } catch (error) {
            console.error("Failed to create password keys:", error);
            throw error;
        }
    }

    async updatePasswordKey(keyId, data) {
        try {
            await this.orm.write("password.key", keyId, data);
        } catch (error) {
            throw error;
        }
    }

    async deletePasswordKey(keyId) {
        try {
            await this.orm.unlink("password.key", keyId);
        } catch (error) {
            throw error;
        }
    }


    async readPasswordEntry(keyId) {
        try {
            let call = await this.orm.read("password.entry", keyId, ['encrypted_password','iv']);
            return {
                'encrypted_password': await this.convert.base64ToArrayBuffer(call[0].encrypted_password),
                'iv': await this.convert.Base64ToUint8Array(call[0].iv),
                'id': call[0].id
            };
            
        } catch (error) {
            throw error;
        }
    }

    async readPasswordKey(keyId) {
        try {
            let call = await this.orm.read("password.key", keyId, []);
            return {
                'id': call[0].id,
                'encrypted_key': await this.convert.base64ToArrayBuffer(call[0].encrypted_key)
            };
        } catch (error) {
            throw error;
        }
    }

    async searchUserPublicKeys(domain = [], fields = []) {
        try {
            return await this.orm.searchRead("user.public.key", domain, fields);
        } catch (error) {
            throw error;
        }
    }
}
export const passwordService = {
    dependencies: ["orm", "notification", "convert"],
    start(env, services) {
        return new PasswordService(env, services);
    },
};

// Register the service with proper dependencies
registry.category("services").add("password_service", passwordService); 