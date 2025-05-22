/** @odoo-module **/

import { registry } from "@web/core/registry";
import { CharField } from "@web/views/fields/char/char_field";
import { onMounted, onWillUpdateProps, useState, useRef } from "@odoo/owl";

function formatPassword(value) {
    return "*".repeat(value ? value.length : 0);
}

export class EncryptedPasswordField extends CharField {
    static template = "base_password_manager.EncryptedPasswordField";

    setup() {
        super.setup();
        this.state = useState({
            formattedValue: formatPassword(this.props.record.data[this.props.name])
        });
        this.inputRef = useRef("input");

        onMounted(() => {
            if (this.inputRef.el) {
                this.inputRef.el.type = 'password';
            }
        });

        onWillUpdateProps((nextProps) => {
            this.state.formattedValue = formatPassword(nextProps.record.data[nextProps.name]);
        });
    }

    get valueToDisplay() {
        return this.state.formattedValue;
    }

    onChange(ev) {
        const value = ev.target.value;
        this.props.record.update({ [this.props.name]: value });
        this.state.formattedValue = formatPassword(value);
    }
}

// Register the field
registry.category("fields").add("password_encryption", {
    component: EncryptedPasswordField,
    supportedTypes: ["char"],
    extractProps: ({ attrs, field }) => ({
        ...attrs,
        type: "encrypted_password",
    }),
});


