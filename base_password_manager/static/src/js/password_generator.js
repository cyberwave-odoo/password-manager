/** @odoo-module **/

import { Component } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class PasswordGenerator extends Component {
    setup() {
        this.rpc = useService("rpc");
        this.notification = useService("notification");
        this.state = useState({
            length: 16,
            includeUppercase: true,
            includeLowercase: true,
            includeNumbers: true,
            includeSpecial: true,
            generatedPassword: '',
        });
    }

    async generatePassword() {
        try {
            const result = await this.rpc('/password_manager/generate_password', {
                length: this.state.length,
                include_uppercase: this.state.includeUppercase,
                include_lowercase: this.state.includeLowercase,
                include_numbers: this.state.includeNumbers,
                include_special: this.state.includeSpecial,
            });
            this.state.generatedPassword = result;
        } catch (error) {
            this.notification.add(this.env._t("Password generation failed"), {
                type: 'danger',
            });
        }
    }

    copyToClipboard() {
        if (this.state.generatedPassword) {
            navigator.clipboard.writeText(this.state.generatedPassword);
            this.notification.add(this.env._t("Password copied to clipboard"), {
                type: 'success',
            });
        }
    }
}

PasswordGenerator.template = 'password_manager.PasswordGenerator'; 