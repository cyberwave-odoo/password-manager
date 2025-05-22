/** @odoo-module **/

import { registry } from "@web/core/registry";
import { CharField } from "@web/views/fields/char/char_field";
import { onMounted, onWillUpdateProps, useState, useRef } from "@odoo/owl";

export class EncryptedPasswordField extends CharField {
    static template = "base_password_manager.EncryptedPasswordField";

    setup() {
        super.setup();
    }
}

// Register the field
registry.category("fields").add("password_encryption", {
    component: EncryptedPasswordField,
    supportedTypes: ["char"],
    extractProps: ({ attrs }) => ({
        ...attrs,
        type: "encrypted_password",
    }),
});


