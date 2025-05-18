from odoo import models, fields, api
import os

class ResUsers(models.Model):
    _inherit = 'res.users'

    password_share_ids = fields.One2many('password.share', 'shared_with_id', string='Shared Passwords')
    password_entry_ids = fields.One2many('password.entry', 'user_id', string='Password Entries')
    password_salt = fields.Char(string='Password Salt', compute='_compute_password_salt', store=True)
    
    def _compute_password_salt(self):
        """Compute a unique salt for each user"""
        for user in self:
            if not user.password_salt:
                user.password_salt = os.urandom(16).hex()

    def get_user_salt(self):
        """Get the user's salt for password encryption"""
        return self.password_salt

    def store_encrypted_password(self, encrypted_password):
        """Store the encrypted password"""
        try:
            # Create or update password entry
            password_entry = self.env['password.entry'].create({
                'name': 'Encrypted Password',
                'username': self.login,
                'encrypted_password': encrypted_password,
                'user_id': self.id,
            })
            return {'success': True, 'entry_id': password_entry.id}
        except Exception as e:
            return {'success': False, 'error': str(e)} 