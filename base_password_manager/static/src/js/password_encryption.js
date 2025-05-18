/** @odoo-module **/

import { Component } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class PasswordEncryption extends Component {
    setup() {
        this.rpc = useService("rpc");
        this.notification = useService("notification");
    }

    async encryptPassword(password, masterPassword) {
        try {
            const result = await this.rpc('/password_manager/encrypt', {
                password: password,
                master_password: masterPassword
            });
            return result;
        } catch (error) {
            this.notification.add(this.env._t("Encryption failed"), {
                type: 'danger',
            });
            throw error;
        }
    }

    async decryptPassword(encryptedPassword, masterPassword) {
        try {
            const result = await this.rpc('/password_manager/decrypt', {
                encrypted_password: encryptedPassword,
                master_password: masterPassword
            });
            return result;
        } catch (error) {
            this.notification.add(this.env._t("Decryption failed"), {
                type: 'danger',
            });
            throw error;
        }
    }

    async generateKeyPair() {
        try {
            const result = await this.rpc('/password_manager/generate_key_pair', {});
            return result;
        } catch (error) {
            this.notification.add(this.env._t("Key pair generation failed"), {
                type: 'danger',
            });
            throw error;
        }
    }
}

PasswordEncryption.template = 'password_manager.PasswordEncryption'; 