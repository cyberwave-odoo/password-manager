/** @odoo-module **/

import { registry } from "@web/core/registry";
import { _t } from "@web/core/l10n/translation";

export class EncryptionService {
    constructor(env, services) {
        this.setup(env, services);
    }

    setup(env, services) {
        this.env = env;
        this.orm = services.orm;
        this.passwordService = services.password_service;
    };

}

export const encryptionService = {
    dependencies: ["orm", "password_service"],
    start(env, services) {
        return new EncryptionService(env, services);
    },
};

registry.category("services").add("password_encryption", encryptionService);