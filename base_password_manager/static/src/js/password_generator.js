odoo.define('password_manager.password_generator', function (require) {
    "use strict";

    var core = require('web.core');
    var Widget = require('web.Widget');
    var QWeb = core.qweb;

    var PasswordGenerator = Widget.extend({
        template: 'PasswordGenerator',
        events: {
            'click .generate-password': '_onGeneratePassword',
            'change .password-options input': '_onOptionChange',
        },

        init: function (parent, options) {
            this._super.apply(this, arguments);
            this.options = _.extend({
                length: 16,
                useUppercase: true,
                useLowercase: true,
                useNumbers: true,
                useSpecial: true,
            }, options || {});
        },

        _onGeneratePassword: function (ev) {
            ev.preventDefault();
            var password = this._generatePassword();
            this.$('.generated-password').val(password);
        },

        _onOptionChange: function (ev) {
            var $input = $(ev.currentTarget);
            this.options[$input.attr('name')] = $input.prop('checked');
        },

        _generatePassword: function () {
            var chars = '';
            if (this.options.useUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            if (this.options.useLowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
            if (this.options.useNumbers) chars += '0123456789';
            if (this.options.useSpecial) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

            if (!chars) {
                throw new Error('At least one character type must be selected');
            }

            var password = '';
            var array = new Uint32Array(this.options.length);
            window.crypto.getRandomValues(array);

            for (var i = 0; i < this.options.length; i++) {
                password += chars[array[i] % chars.length];
            }

            return password;
        },
    });

    return PasswordGenerator;
}); 