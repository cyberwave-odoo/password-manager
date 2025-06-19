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
        //console.log(await password_encryption.Uint8ArrayToBase64(iv1));
        let activekye = await password_encryption.getActiveKeyPair();

        console.log(activekye ,'active');
        let encrypted_sym_key = await password_encryption.wrapAsymetric(activekye.publicKey, symkey1);
        await password_service.updatePasswordEntry(recordId,{
            'encrypted_password': await password_encryption.arrayBufferToBase64(encrypted_pwd),
            'iv': await password_encryption.Uint8ArrayToBase64(iv1),
        });
        let entry = await password_service.readPasswordEntry(recordId, ['encrypted_password','iv']);
        let pword = await password_encryption.base64ToArrayBuffer(entry[0].encrypted_password);
        console.log(recordId);
        let symkey = await password_service.createPasswordKey([{
            'password_entry_id': recordId[0],
            'encrypted_key': await password_encryption.arrayBufferToBase64(encrypted_sym_key),
            'user_public_key_id': 1
        }]);
        console.log(symkey);


        let decrypted_sym_key = await password_encryption.unwrapAsymetric(activekye.privateKey, encrypted_sym_key);

        let decrypted_pwd = await password_encryption.decryptSymetric(decrypted_sym_key, pword, await password_encryption.Base64ToUint8Array(entry[0].iv));
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

