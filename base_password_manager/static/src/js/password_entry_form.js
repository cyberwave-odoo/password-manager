/** @odoo-module **/

import { registry } from "@web/core/registry";
import { CharField } from "@web/views/fields/char/char_field";
import { useService } from "@web/core/utils/hooks";
import { _t } from "@web/core/l10n/translation";
import { ConfirmationDialog } from "@web/core/confirmation_dialog/confirmation_dialog";
import {debounce} from "@web/core/utils/timing";

export class EncryptedPasswordField extends CharField {
    static template = "base_password_manager.EncryptedPasswordField";

    setup() {
        super.setup();
        this.orm = useService("orm");
        this.notification = useService("notification");
        this.dialog = useService("dialog");
        this.debouncedOnChange = debounce(this.onChange.bind(this), 500);
    }

    async onChange(ev) {
        const recordId = this.props.record.resId;
        const newValue = ev.target.value;
        const oldValue = this.props.record.data[this.props.name];
        let confirmed = false;
        console.log("New value:", newValue);
        console.log("Old value:", oldValue);
        if (!recordId) {
            console.log("No record ID, skipping confirmation");
            return;
        }
        else {
            confirmed = await new Promise((resolve) => {
                this.dialog.add(ConfirmationDialog, {
                    title: _t("Confirm Password Change"),
                    body: _t("Are you sure you want to save the password?"),
                    confirm: () => resolve(true),
                    cancel: () => resolve(false),
                });
            });
        }
        if (!confirmed) {
            if (this.props.discard) {
                this.props.discard();
            } else if (this.props.record.discard) {
                this.props.record.discard();
            }
            console.log("props:", this.props.record.data[this.props.name]);
            console.log(this.props.record._changes);
        }
        else {
            if (!recordId) {
                console.log("No record ID, going further");
                // Call the 'write' method on the 'password.entry' model
                //ev.target.value = 'create';
                
 
                
            }
            else {
                //await this.orm.call("password.entry", "write", [recordId, { [this.props.name]: newValue }]);
                if (this.props.save) {
                    this.props.save();
                }
                else if (this.props.record.save) {
                    this.props.record.save();
                }
            }
        }

    }
}

// Register the field
registry.category("fields").add("password_encryption", {
    component: EncryptedPasswordField,
    supportedTypes: ["char"],
    extractProps: ({ attrs }) => ({
        ...attrs,
    }),
});

