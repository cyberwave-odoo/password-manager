from odoo import models, fields, api, _
from odoo.exceptions import AccessError, ValidationError
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization
import os
import json
from datetime import datetime, timedelta


class PasswordEntry(models.Model):
    _name = 'password.entry'
    _description = 'Password Entry'
    _order = 'name'

    name = fields.Char(string='Title', required=True)
    username = fields.Char(string='Username', required=True)
    encrypted_password = fields.Char(string='Password', required=True)
    url = fields.Char(string='URL')
    notes = fields.Text(string='Notes')
    user_id = fields.Many2one('res.users', string='Owner', default=lambda self: self.env.user)
    company_id = fields.Many2one('res.company', string='Company', required=True, default=lambda self: self.env.company)
    last_modified = fields.Datetime(string='Last Modified', default=fields.Datetime.now)
    last_encryption = fields.Datetime(string='Last Key Encryption', default=fields.Datetime.now)
    version = fields.Integer(string='Version', default=1)
    
    key_ids = fields.One2many('password.key', 'password_entry_id', string='Encrypted Keys')
    share_ids = fields.One2many('password.share', 'password_entry_id', string='Shares')

    def _notify_password_change(self):
        """Notify all users with access about password change"""
        self.ensure_one()
        channel = f'password_manager_{self.id}'
        message = {
            'type': 'password_change',
            'entry_id': self.id,
            'version': self.version,
            'timestamp': fields.Datetime.now().isoformat(),
        }
        self.env['bus.bus']._sendone(channel, 'password_manager', message)

    def _increment_version(self):
        """Increment the version number and update last encryption time"""
        self.write({
            'version': self.version + 1,
            'last_encryption': fields.Datetime.now()
        })

    def encrypt_password(self, password, master_password):
        """Encrypt password using symmetric key and store encrypted key"""
        # Generate a new symmetric key
        symmetric_key = self.env['password.key']._generate_symmetric_key()
        
        # Encrypt the password with the symmetric key
        f = Fernet(symmetric_key)
        encrypted_password = f.encrypt(password.encode())
        
        # Store the encrypted password
        self.encrypted_password = base64.b64encode(encrypted_password).decode()
        
        # Create or update the key record for the owner
        key_vals = {
            'password_entry_id': self.id,
            'user_id': self.user_id.id,
            'encrypted_key': self.env['password.key'].encrypt_symmetric_key(symmetric_key, master_password).decode()
        }
        
        existing_key = self.env['password.key'].search([
            ('password_entry_id', '=', self.id),
            ('user_id', '=', self.user_id.id)
        ])
        
        if existing_key:
            existing_key.write(key_vals)
        else:
            self.env['password.key'].create(key_vals)

        # Increment version and notify
        self._increment_version()
        self._notify_password_change()

    def decrypt_password(self, master_password):
        """Decrypt password using the user's master password"""
        try:
            # Get the key record for the current user
            key_record = self.env['password.key'].search([
                ('password_entry_id', '=', self.id),
                ('user_id', '=', self.env.user.id)
            ], limit=1)
            
            if not key_record:
                raise ValidationError(_('No key found for this password entry'))
            
            # Check if key needs re-encryption
            if key_record.version < self.version:
                raise ValidationError(_('Password has been modified. Please re-encrypt your key.'))
            
            # Decrypt the symmetric key using the master password
            symmetric_key = key_record.decrypt_symmetric_key(master_password)
            
            # Decrypt the password using the symmetric key
            f = Fernet(symmetric_key)
            encrypted_password = base64.b64decode(self.encrypted_password.encode())
            return f.decrypt(encrypted_password).decode()
        except Exception:
            raise ValidationError(_('Invalid master password or insufficient permissions'))

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

    @api.model
    def _cron_check_key_versions(self):
        """Cron job to check for outdated keys and notify users"""
        outdated_keys = self.env['password.key'].search([
            ('version', '<', self.version)
        ])
        for key in outdated_keys:
            channel = f'password_manager_{key.password_entry_id.id}'
            message = {
                'type': 'key_update_required',
                'entry_id': key.password_entry_id.id,
                'version': key.password_entry_id.version,
                'timestamp': fields.Datetime.now().isoformat(),
            }
            self.env['bus.bus']._sendone(channel, 'password_manager', message)

