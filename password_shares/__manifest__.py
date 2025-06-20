# -*- coding: utf-8 -*-
{
    'name': "password_shares",
    
    'summary': "Short (1 phrase/line) summary of the module's purpose",

    'description': """
Long description of module's purpose
    """,

    'author': "My Company",
    'website': "https://www.yourcompany.com",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/15.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Uncategorized',
    'version': '18.0.1.0.0',

    # any module necessary for this one to work correctly
    'depends': ['base_password_manager'],

    # always loaded
    'data': [
        'security/ir.model.access.csv',
        'security/password_shares_security.xml',
        'views/password_entry_views.xml',
        'views/password_share_views.xml',
        'views/menu_views.xml',
        'data/ir_cron_data.xml',

    ],
    # only loaded in demonstration mode
    'demo': [

    ],
    'license': 'LGPL-3',
}

