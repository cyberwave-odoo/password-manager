from odoo import models, fields, api, _
from odoo.exceptions import AccessError, ValidationError
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import os
import json

class PasswordEntry(models.Model):
    _name = 'password.entry'
    _description = 'Password Entry'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'name'

    name = fields.Char(string='Title', required=True, tracking=True)
    username = fields.Char(string='Username', required=True, tracking=True)
    encrypted_password = fields.Char(string='Password', required=True)
    url = fields.Char(string='URL', tracking=True)
    notes = fields.Text(string='Notes')
    category_id = fields.Many2one('password.category', string='Category')
    user_id = fields.Many2one('res.users', string='Owner', default=lambda self: self.env.user)
    company_id = fields.Many2one('res.company', string='Company', default=lambda self: self.env.company)
    last_modified = fields.Datetime(string='Last Modified', default=fields.Datetime.now)
    password_strength = fields.Selection([
        ('weak', 'Weak'),
        ('medium', 'Medium'),
        ('strong', 'Strong')
    ], string='Password Strength', compute='_compute_password_strength', store=True)
    
    @api.model
    def _generate_key(self, master_password):
        """Generate encryption key from master password"""
        salt = b'password_manager_salt'  # In production, use a unique salt per user
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(master_password.encode()))
        return key

    def encrypt_password(self, password, master_password):
        """Encrypt password using master password"""
        key = self._generate_key(master_password)
        f = Fernet(key)
        encrypted_data = f.encrypt(password.encode())
        return encrypted_data.decode()

    def decrypt_password(self, master_password):
        """Decrypt password using master password"""
        key = self._generate_key(master_password)
        f = Fernet(key)
        try:
            decrypted_data = f.decrypt(self.encrypted_password.encode())
            return decrypted_data.decode()
        except Exception:
            raise ValidationError(_('Invalid master password'))

    @api.depends('encrypted_password')
    def _compute_password_strength(self):
        """Compute password strength based on various factors"""
        for record in self:
            # This is a placeholder - actual implementation would decrypt and analyze the password
            record.password_strength = 'medium'

    @api.model
    def generate_strong_password(self, length=16):
        """Generate a strong password"""
        chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'
        return ''.join(os.urandom(length).hex()[:length])

    def action_share_password(self):
        """Share password with another user"""
        self.ensure_one()
        return {
            'name': _('Share Password'),
            'type': 'ir.actions.act_window',
            'res_model': 'password.share',
            'view_mode': 'form',
            'context': {
                'default_password_entry_id': self.id,
            }
        }

    def action_view_password_health(self):
        """View password health report"""
        self.ensure_one()
        return {
            'name': _('Password Health'),
            'type': 'ir.actions.act_window',
            'res_model': 'password.health',
            'view_mode': 'form',
            'context': {
                'default_password_entry_id': self.id,
            }
        } 