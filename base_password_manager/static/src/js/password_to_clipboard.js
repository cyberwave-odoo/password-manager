import { registry } from "@web/core/registry";

import { _t } from "@web/core/l10n/translation";
import { user } from "@web/core/user";
// Master password management



registry.category("actions").add("copy_to_clipboard", async (env, context) => {

    const password_service = env.services.password_service;
    const password_encryption = env.services.password_encryption;
    const recordId = JSON.parse(context._originalAction).context.active_ids;



    try {

        //let derivedkey = await password_encryption.derivedKey();

        const pwd = 'pwd';
        let symkey1 = await password_encryption.generateSymetricKey();
        
        let iv1 = await password_encryption.generateIV();
        let encrypted_pwd = await password_encryption.encryptSymetric(symkey1, iv1, pwd); //store encyrpted_pwd and iv1
        
        //await password_service.updatePasswordEntry(recordId,{
        //    'encrypted_password': pwd,
        //    'iv': await password_encryption.Uint8ArrayToBase64(iv1),
        //});

        //let asymkey = await password_encryption.generateKeyPair();

        //await password_encryption.storeUserKeys(asymkey.publicKey, asymkey.privateKey, derivedkey, iv1);

        let activekye = await password_encryption.getActiveKeyPair();

        let encrypted_sym_key = await password_encryption.wrapAsymetric(activekye.publicKey, symkey1);
        await password_service.updatePasswordEntry(recordId,{
            'encrypted_password': encrypted_pwd,
            'iv': await iv1,
        });
        let entry = await password_service.readPasswordEntry(recordId);
        let pword = entry.encrypted_password;
        let symkey = await password_service.createPasswordKey([{
            'password_entry_id': recordId[0],
            'encrypted_key': encrypted_sym_key,
            'user_public_key_id': activekye.id
        }]);

        let pwd_key = await password_service.readPasswordKey(symkey);


        let decrypted_sym_key = await password_encryption.unwrapAsymetric(activekye.privateKey, pwd_key.encrypted_key);

        let decrypted_pwd = await password_encryption.decryptSymetric(decrypted_sym_key, pword, entry.iv);
        console.log(decrypted_pwd);
        // Read the record to get the encrypted password
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

