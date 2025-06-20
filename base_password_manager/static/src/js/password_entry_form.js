/** @odoo-module **/

import { registry } from "@web/core/registry";
import { CharField } from "@web/views/fields/char/char_field";
import { useService } from "@web/core/utils/hooks";
import { _t } from "@web/core/l10n/translation";
import { ConfirmationDialog } from "@web/core/confirmation_dialog/confirmation_dialog";


export class EncryptedPasswordField extends CharField {
    static template = "base_password_manager.EncryptedPasswordField";

    setup() {
        super.setup();
        this.orm = useService("orm");
        this.notification = useService("notification");
        this.dialog = useService("dialog");
        this.passwordService = useService("password_service");
        this.passwordEncryption = useService("password_encryption");

    }

    async onChange(ev) {
        if (this.props.record.data['name']=="") {
            console.log('Auto fill');

            return;
        }
        let recordId = this.props.record.resId;

        const newValue = ev.target.value;
        const oldValue = this.props.record.data[this.props.name];
        let confirmed = true;

        if (recordId) {
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
            await this.discard();
            return;
        }
        
        else {
            // here check if user has keys
            if (!recordId) {

                console.log("No record ID, going further");
                console.log(oldValue, newValue);
                let entry = await this.passwordEncryption.savePwd(newValue);
                await this.props.record.update(entry);
                console.log(this.props.record.data);
            }
            else {
                //this.props.record.data['name'] = "tototototo";
                //ev.target.value = "existing_write_value"; // Set a new value for the input field 
                console.log(oldValue, newValue);
                console.log(recordId);
                let entry = await this.passwordEncryption.savePwd(newValue, [recordId]);
                await this.props.record.update(entry);
                 
            }
            await this.save();
            // Only update the displayed value, do not touch _values or _textValues
        }
        
        return;
    }

    async discard() {
        await this.props.discard();
    }
    async save() {
        await this.props.record.save();
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

