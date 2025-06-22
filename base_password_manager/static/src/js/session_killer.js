/** @odoo-module **/

import { Component, onMounted, onWillUnmount, onWillStart, onRendered} from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";


class SessionKiller extends Component {
    setup() {
        this.passwordEncryption = useService("password_encryption");
        this.action = useService("action"); // Get the action service
        
        onWillStart(() => {
            console.log('check');
            this.passwordEncryption.checkMasterPwd();
        });


    }
    
}

SessionKiller.template = 'session_killer.KillerTemplate';

// Register the component in the web layout
registry.category("main_components").add("SessionKiller", {
    Component: SessionKiller,
    props: {},
});
