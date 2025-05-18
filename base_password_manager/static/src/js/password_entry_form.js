/** @odoo-module **/

import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { FormController } from "@web/views/form/form_controller";
import { patch } from "@web/core/utils/patch";
import { Dialog } from "@web/core/dialog/dialog";
import { _t } from "@web/core/l10n/translation";
import { useState } from "@odoo/owl";

class KeyUpdateDialog extends Dialog {
    static template = "base_password_manager.KeyUpdateDialog";
    static components = { Dialog };

    setup() {
        this.state = useState({
            masterPassword: "",
        });
        this.rpc = useService("rpc");
        this.notification = useService("notification");
    }

    async onUpdate() {
        if (!this.state.masterPassword) {
            return;
        }
        try {
            const result = await this.rpc("/password/entry/reencrypt_key", {
                entry_id: this.props.entryId,
                master_password: this.state.masterPassword,
            });
            if (result.success) {
                this.notification.add(_t("Success"), {
                    type: "success",
                    message: _t("Key updated successfully"),
                });
                this.props.close();
            } else {
                this.notification.add(_t("Error"), {
                    type: "danger",
                    message: result.message,
                });
            }
        } catch (error) {
            this.notification.add(_t("Error"), {
                type: "danger",
                message: error.message,
            });
        }
    }
}

registry.category("public_components").add("KeyUpdateDialog", KeyUpdateDialog);

patch(FormController, {
    setup() {
        this._super();
        this.passwordEncryption = useService("password_encryption");
        this.rpc = useService("rpc");
        this.notification = useService("notification");
        this.dialog = useService("dialog");
        this.busService = useService("bus_service");
        this._setupBusListener();
    },

    _setupBusListener() {
        this.busService.subscribe("password_manager", (message) => {
            if (message.type === "password_change" || message.type === "key_update_required") {
                this._handlePasswordChange(message);
            }
        });
    },

    _handlePasswordChange(message) {
        this.dialog.add(KeyUpdateDialog, {
            title: _t("Password Update Required"),
            size: "medium",
            entryId: message.entry_id,
            message: _t("A password you have access to has been modified. Please update your key to continue accessing it."),
        });
    },

    async _onFieldChanged(event) {
        await this._super(event);
        
        if (event.data.changes.encrypted_password) {
            const record = this.model.root.data;
            const masterPassword = await this._getMasterPassword();
            
            if (!masterPassword) {
                return;
            }

            try {
                const salt = await this.rpc('/password_manager/get_user_salt', {});
                const encryptedPassword = await this.passwordEncryption.encryptPassword(
                    event.data.changes.encrypted_password,
                    masterPassword,
                    salt
                );

                await this.model.root.update({
                    encrypted_password: encryptedPassword
                });

                this.notification.add(this.env._t("Password encrypted successfully"), {
                    type: 'success',
                });
            } catch (error) {
                this.notification.add(this.env._t("Encryption failed"), {
                    type: 'danger',
                });
            }
        }
    },

    async _getMasterPassword() {
        return prompt(this.env._t("Please enter your master password:"));
    }
}); 