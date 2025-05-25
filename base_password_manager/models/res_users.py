from odoo import models, fields, api
import os

class ResUsers(models.Model):
    _inherit = 'res.users'

    password_share_ids = fields.One2many('password.share', 'shared_with_id', string='Shared Passwords')
    password_salt = fields.Char(string='Password Salt', compute='_compute_password_salt', store=True)

    def _compute_password_salt(self):
        """Compute a unique salt for each user"""
        for user in self:
            if not user.password_salt:
                user.password_salt = os.urandom(32).hex()
                
    def recompute_password_salt(self):
        """Recompute the password salt for the user"""
        for record in self:
            record.password_salt = os.urandom(32).hex()
        return True

    