import { registry } from "@web/core/registry";

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



registry.category("actions").add("copy_to_clipboard", async (env, context) => {

    const password_service = env.services.password_service;
    const password_encryption = env.services.password_encryption;
    const recordId = JSON.parse(context._originalAction).context.active_ids;

    
    let masterPassword = password_service.getMasterPassword();
    if (!masterPassword) {
        masterPassword = prompt(_t("Please enter your master password:"));
        if (masterPassword) {
            password_service.setMasterPassword(masterPassword);
        }
    } 
    
    if (!masterPassword) {
        return;
    }

    try {

        const orm = env.services.orm;
        const salt = await orm.call("res.users", "read", [user.userId, ["password_salt"]]);
        let derivedkey = await password_encryption.deriveKeyFromPassword(masterPassword, salt[0].password_salt);
        console.log(await crypto.subtle.exportKey("jwk",derivedkey),'derived');
        const pwd = 'pwd';
        let symkey1 = await password_encryption.generateSymetricKey();
        let iv1 = await password_encryption.generateIV();
        let encrypted_pwd = await password_encryption.encryptSymetric(symkey1, iv1, pwd); //store encyrpted_pwd and iv1

        let asymkey = await password_encryption.generateKeyPair();

        await password_encryption.storeUserKeys(asymkey.publicKey, asymkey.privateKey, derivedkey, iv1);

        let activekye = await password_encryption.getActiveKeyPair(derivedkey, iv1);
        let encrypted_sym_key = await password_encryption.wrapAsymetric(activekye.publicKey, symkey1, iv1);
        let decrypted_sym_key = await password_encryption.unwrapAsymetric(activekye.privateKey, encrypted_sym_key, iv1);
        let decrypted_pwd = await password_encryption.decryptSymetric(decrypted_sym_key, encrypted_pwd, iv1);
        console.log(decrypted_pwd);
        // Read the record to get the encrypted password
        const recordData = await orm.call("password.entry", "read", [recordId, ["encrypted_password"]]);
        
        if (!recordData) {
            throw new Error(_t("Failed to retrieve password record"));
        }
        
        if (recordData.length === 0) {
            throw new Error(_t("Password record not found"));
        }
        
        if (!recordData[0].encrypted_password) {
            throw new Error(_t("No encrypted password found in record"));
        }

        const decryptedPassword = await env.services.password_encryption.decryptPassword(
            recordData[0].encrypted_password,
            masterPassword,
            salt
        );
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

