from odoo import models, fields, api
import os

class ResUsers(models.Model):
    _inherit = 'res.users'

    password_salt = fields.Char(string='Password Salt', compute='_compute_password_salt', store=True)
    private_key_ids = fields.One2many('user.private.key', 'user_id', string='private_key')
    public_key_ids = fields.One2many('user.public.key', 'user_id', string='private_key')
    
    def _compute_password_salt(self):
        """Compute a unique salt for each user"""
        for user in self:
            if not user.password_salt:
                user.password_salt = os.urandom(32).hex()
                

    