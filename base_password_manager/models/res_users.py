from odoo import models, fields, api

class ResUsers(models.Model):
    _inherit = 'res.users'

    password_share_ids = fields.One2many('password.share', 'shared_with_id', string='Shared Passwords')
    password_entry_ids = fields.One2many('password.entry', 'user_id', string='Password Entries')
    password_category_ids = fields.One2many('password.category', 'user_id', string='Password Categories') 