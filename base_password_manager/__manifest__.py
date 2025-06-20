# -*- coding: utf-8 -*-
{
    'name': 'Password Manager',
    'version': '18.0.1.0.0',
    'category': 'Tools',
    'summary': 'Secure password management with company-based access control',
    'description': """
        Password Manager with secure encryption and access control.
        Features:
        - Company-based password management
        - Secure encryption using public/private keys
        - Password sharing with access control
    """,
    'author': 'Your Company',
    'website': 'https://www.yourcompany.com',
    'depends': [
        'base',
        'mail',
        'web',
    ],
    'data': [
        'security/password_manager_security.xml',
        'security/password_key_security.xml',
        'security/ir.model.access.csv',
        'security/user_key_rules.xml',
        'views/password_entry_views.xml',
        'views/password_share_views.xml',
        'views/menu_views.xml',
        'data/ir_cron_data.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'base_password_manager/static/src/xml/password_field.xml',
            'base_password_manager/static/src/services/convert.js',
            'base_password_manager/static/src/services/password_service.js',
            'base_password_manager/static/src/services/password_encryption_service.js',
            'base_password_manager/static/src/js/password_entry_form.js',
            'base_password_manager/static/src/js/password_to_clipboard.js',
            'base_password_manager/static/src/css/password_manager.css',
        ],
    },
    'installable': True,
    'application': True,
    'auto_install': False,
    'license': 'LGPL-3',
}
