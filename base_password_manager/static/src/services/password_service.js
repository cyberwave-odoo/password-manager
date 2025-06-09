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
    }


    getMasterPassword() {
        return sessionStorage.getItem(this.MASTER_PASSWORD_KEY);
    }

    setMasterPassword(password) {
        sessionStorage.setItem(this.MASTER_PASSWORD_KEY, password);
    }
    
    async getUserSalt() {
        try {
            const userId = user.userId;
            const userData = await this.orm.read("res.users", [userId], ["password_salt"]);
            return Uint8Array.fromHex(userData[0].password_salt) ;
        } catch (error) {
            throw error;
        }
    }
    /**
     * Password Entry Operations
     */
    async createPasswordEntry(data) {
        try {
            const entryId = await this.orm.create("password.entry", data);
            return entryId;
        } catch (error) {
            throw error;
        }
    }

    async updatePasswordEntry(entryId, data) {
        try {
            await this.orm.write("password.entry", [entryId], data);
        } catch (error) {
            throw error;
        }
    }

    async deletePasswordEntry(entryId) {
        try {
            await this.orm.unlink("password.entry", [entryId]);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Password Key Operations
     */
    async createPasswordKey(data) {
        try {
            const keyId = await this.orm.create("password.key", data);
            return keyId;
        } catch (error) {
            throw error;
        }
    }

    async updatePasswordKey(keyId, data) {
        try {
            await this.orm.write("password.key", [keyId], data);
        } catch (error) {
            throw error;
        }
    }

    async deletePasswordKey(keyId) {
        try {
            await this.orm.unlink("password.key", [keyId]);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Search Operations
     */
    async searchPasswordEntries(domain = [], fields = []) {
        try {
            return await this.orm.searchRead("password.entry", domain, fields);
        } catch (error) {
            throw error;
        }
    }

    async searchPasswordKeys(domain = [], fields = []) {
        try {
            return await this.orm.searchRead("password.key", domain, fields);
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
    dependencies: ["orm", "notification"],
    start(env, services) {
        return new PasswordService(env, services);
    },
};

// Register the service with proper dependencies
registry.category("services").add("password_service", passwordService); 