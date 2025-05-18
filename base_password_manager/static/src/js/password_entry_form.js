/** @odoo-module **/

import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { FormController } from "@web/views/form/form_controller";
import { patch } from "@web/core/utils/patch";
import { _t } from "@web/core/l10n/translation";

import { user } from "@web/core/user";

// Master password management
const MASTER_PASSWORD_KEY = 'master_key';

function getMasterPassword() {
    return sessionStorage.getItem(MASTER_PASSWORD_KEY);
}

function setMasterPassword(password) {
    sessionStorage.setItem(MASTER_PASSWORD_KEY, password);
}



// Register components

// Register the copy to clipboard client action
registry.category("actions").add("copy_to_clipboard", async (env, context) => {
    console.log("Starting copy to clipboard action");
    console.log("Context:", context);

    const recordId = JSON.parse(context._originalAction).context.active_ids;
    console.log(recordId);

    let masterPassword = getMasterPassword();
    if (!masterPassword) {
        console.log("No cached master password, prompting user");
        masterPassword = await prompt(_t("Please enter your master password:"));
        if (masterPassword) {
            setMasterPassword(masterPassword);
        }
    } else {
        console.log("Using cached master password");
    }
    
    if (!masterPassword) {
        console.log("No master password provided");
        return;
    }

    try {
        console.log("Getting user salt");
        const orm = env.services.orm;
        console.log(recordId)
        const salt = await orm.call("res.users", "get_user_salt", [user.userId]);
        console.log("Salt received:", salt);

        // Read the record to get the encrypted password
        const recordData = await orm.call("password.entry", "read", [recordId, ["encrypted_password"]]);
        console.log("Record data:", recordData);
        
        if (!recordData) {
            throw new Error(_t("Failed to retrieve password record"));
        }
        
        if (recordData.length === 0) {
            throw new Error(_t("Password record not found"));
        }
        
        if (!recordData[0].encrypted_password) {
            throw new Error(_t("No encrypted password found in record"));
        }

        console.log("Decrypting password");
        const decryptedPassword = await env.services.password_encryption.decryptPassword(
            recordData[0].encrypted_password,
            masterPassword,
            salt
        );
        console.log("Password decrypted successfully");

        // Create a temporary input element
        console.log("Creating temporary input element");
        const tempInput = document.createElement('input');
        tempInput.value = decryptedPassword;
        document.body.appendChild(tempInput);
        tempInput.select();
        
        console.log("Executing copy command");
        const copySuccess = document.execCommand('copy');
        document.body.removeChild(tempInput);
        
        if (!copySuccess) {
            throw new Error("Failed to copy to clipboard");
        }

        console.log("Copy successful, showing notification");
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

