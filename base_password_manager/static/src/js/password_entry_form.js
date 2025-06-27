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
        this.suppress_update = false;
        
        this.props.record._onUpdate = (async () => {
            console.log("suppress_update", this.suppress_update);
            if (this.props.record._changes.encrypted_password && !this.suppress_update) {
                console.log("onUpdate event listener");
                await this.changePwd(this.props.record._changes.encrypted_password);
            }
            this.suppress_update = false;
        });
    }
    async onChange(ev) {
        return;
        if (!this.props.record.resId) {
            console.log("onChange");
            await this.changePwd(ev.target.value);
            console.log("afterchange", this.suppress_update);
        }
        
    };

    async changePwd(newValue) {
        let confirmed = true;
        let recordId = this.props.record.resId;
        console.log("newvalue", newValue);

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
            return ;
        }
        
        else {
            let entry = {}
            if (!recordId) {
                console.log("no Id create");
                entry = await this.passwordEncryption.savePwd(newValue);
                this.props.record._changes.key_id = entry.key_id
                
            }
            else {
                console.log("Id update", recordId);
                entry = await this.passwordEncryption.savePwd(newValue, [recordId]);
                
            }
            
            console.log("entry", entry.encrypted_password);
            console.log(this.props.record._changes);
            this.props.record._changes.encrypted_password = entry.encrypted_password;
            this.props.record._changes.iv = entry.iv;
            this.suppress_update = true;
            console.log(this.props.record._changes);
        }
        
        return;
    }

    async discard() {
        this.props.record._changes = {};
        return;
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

