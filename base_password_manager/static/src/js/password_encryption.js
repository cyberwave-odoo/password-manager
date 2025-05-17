odoo.define('password_manager.password_encryption', function (require) {
    "use strict";

    var core = require('web.core');
    var Widget = require('web.Widget');
    var QWeb = core.qweb;

    var PasswordEncryption = Widget.extend({
        template: 'PasswordEncryption',
        events: {
            'submit .encrypt-form': '_onEncrypt',
            'submit .decrypt-form': '_onDecrypt',
        },

        init: function (parent, options) {
            this._super.apply(this, arguments);
            this.masterPassword = null;
        },

        _onEncrypt: function (ev) {
            ev.preventDefault();
            var $form = $(ev.currentTarget);
            var password = $form.find('.password-to-encrypt').val();
            var masterPassword = $form.find('.master-password').val();

            if (!password || !masterPassword) {
                this.do_warn(_t('Error'), _t('Please provide both password and master password'));
                return;
            }

            var encrypted = this._encrypt(password, masterPassword);
            $form.find('.encrypted-result').val(encrypted);
        },

        _onDecrypt: function (ev) {
            ev.preventDefault();
            var $form = $(ev.currentTarget);
            var encrypted = $form.find('.encrypted-password').val();
            var masterPassword = $form.find('.master-password').val();

            if (!encrypted || !masterPassword) {
                this.do_warn(_t('Error'), _t('Please provide both encrypted password and master password'));
                return;
            }

            try {
                var decrypted = this._decrypt(encrypted, masterPassword);
                $form.find('.decrypted-result').val(decrypted);
            } catch (error) {
                this.do_warn(_t('Error'), _t('Invalid master password or corrupted data'));
            }
        },

        _encrypt: function (text, masterPassword) {
            // Generate a random salt
            var salt = window.crypto.getRandomValues(new Uint8Array(16));
            
            // Derive key from master password
            var key = this._deriveKey(masterPassword, salt);
            
            // Generate random IV
            var iv = window.crypto.getRandomValues(new Uint8Array(12));
            
            // Encrypt the data
            var encodedText = new TextEncoder().encode(text);
            var encryptedData = window.crypto.subtle.encrypt(
                {
                    name: "AES-GCM",
                    iv: iv
                },
                key,
                encodedText
            );

            // Combine salt, IV, and encrypted data
            var result = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
            result.set(salt, 0);
            result.set(iv, salt.length);
            result.set(new Uint8Array(encryptedData), salt.length + iv.length);

            // Convert to base64
            return btoa(String.fromCharCode.apply(null, result));
        },

        _decrypt: function (encryptedBase64, masterPassword) {
            // Convert from base64
            var encrypted = new Uint8Array(atob(encryptedBase64).split('').map(function(c) {
                return c.charCodeAt(0);
            }));

            // Extract salt, IV, and encrypted data
            var salt = encrypted.slice(0, 16);
            var iv = encrypted.slice(16, 28);
            var data = encrypted.slice(28);

            // Derive key from master password
            var key = this._deriveKey(masterPassword, salt);

            // Decrypt the data
            var decrypted = window.crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: iv
                },
                key,
                data
            );

            // Convert back to text
            return new TextDecoder().decode(decrypted);
        },

        _deriveKey: function (password, salt) {
            // Convert password to key material
            var keyMaterial = new TextEncoder().encode(password);
            
            // Import the key material
            return window.crypto.subtle.importKey(
                "raw",
                keyMaterial,
                "PBKDF2",
                false,
                ["deriveBits", "deriveKey"]
            ).then(function(keyMaterial) {
                // Derive the key
                return window.crypto.subtle.deriveKey(
                    {
                        name: "PBKDF2",
                        salt: salt,
                        iterations: 100000,
                        hash: "SHA-256"
                    },
                    keyMaterial,
                    {
                        name: "AES-GCM",
                        length: 256
                    },
                    false,
                    ["encrypt", "decrypt"]
                );
            });
        },
    });

    return PasswordEncryption;
}); 