import { registry } from "@web/core/registry";

import { _t } from "@web/core/l10n/translation";
import { user } from "@web/core/user";
// Master password management



registry.category("actions").add("copy_to_clipboard", async (env, context) => {

    //const password_service = env.services.password_service;
    const password_encryption = env.services.password_encryption;
    const recordId = JSON.parse(context._originalAction).context.active_ids;

    try {
        let decrypted_pwd = await password_encryption.readPwd(recordId);
        navigator.clipboard.writeText(decrypted_pwd);
        env.services.notification.add(_t("Success"), {
            type: 'success',
            message: _t("Password copied to clipboard"),
        });
    } catch (error) {
        console.error("Copy to clipboard error:", error);
        env.services.notification.add(_t("Error"), {
            type: 'danger',
            message: error.message || _t("Failed to copy password to clipboard"),
        });
    }
});

