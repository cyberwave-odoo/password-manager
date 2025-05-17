# -*- coding: utf-8 -*-
{
    'name': "Base Password Manager",
    'summary': """
        Secure password management with end-to-end encryption and zero-knowledge architecture""",
    'description': """

    """,
    'author': "Cyberwave",
    'website': "https://www.cyberwave.be",
    'category': 'Security',
    'version': '16.0',
    'depends': [
        'base',
        'web',
        'mail',
    ],
    'data': [
        'security/ir.model.access.csv',
        'security/password_manager_security.xml',
        'views/password_entry_views.xml',
        'views/password_category_views.xml',
        'views/password_share_views.xml',
        'views/menu_views.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'password_manager/static/src/js/password_generator.js',
            'password_manager/static/src/js/password_encryption.js',
            'password_manager/static/src/css/password_manager.css',
        ],
    },
    'application': True,
    'installable': True,
    'auto_install': False,
    'license': 'AGPL-3',
}
