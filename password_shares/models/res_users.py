from odoo import models, fields, api
import os

class ResUsers(models.Model):
    _inherit = 'res.users'

    password_share_ids = fields.One2many('password.share', 'shared_with_id', string='Shared Passwords')

                

    