from odoo import models, fields, api, _
from odoo.exceptions import AccessError, ValidationError
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import os
from datetime import datetime, timedelta

class PasswordKey(models.Model):
    _name = 'password.key'
    _description = 'Encrypted Symmetric Key'
    _rec_name = 'password_entry_id'

    password_entry_id = fields.Many2one('password.entry', string='Password Entry', required=True, ondelete='cascade')
    user_id = fields.Many2one('res.users', string='User', required=True, default=lambda self: self.env.user)
    encrypted_key = fields.Text(string='Encrypted Symmetric Key', required=True)
    version = fields.Integer(string='Version', default=1)
    last_used = fields.Datetime(string='Last Used')
    company_id = fields.Many2one('res.company', string='Company', default=lambda self: self.env.company)
    
    _sql_constraints = [
        ('unique_user_entry', 'unique(password_entry_id, user_id)',
         'A key record already exists for this user and password entry!')
    ]

    @api.model
    def _generate_symmetric_key(self):
        """Generate a new symmetric key"""
        return Fernet.generate_key()

    def encrypt_symmetric_key(self, symmetric_key, master_password):
        """Encrypt the symmetric key with the user's master password"""
        salt = self.user_id.password_salt.encode()
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(master_password.encode()))
        f = Fernet(key)
        encrypted_key = f.encrypt(symmetric_key)
        
        # Update version
        self.write({
            'version': self.password_entry_id.version
        })
        
        return encrypted_key

    def decrypt_symmetric_key(self, master_password):
        """Decrypt the symmetric key using the user's master password"""
        try:
            salt = self.user_id.password_salt.encode()
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(kdf.derive(master_password.encode()))
            f = Fernet(key)
            decrypted_key = f.decrypt(self.encrypted_key.encode())
            
            # Update last used
            self.write({
                'last_used': fields.Datetime.now()
            })
            
            return decrypted_key
        except Exception:
            raise ValidationError(_('Invalid master password'))

    @api.model
    def _cron_cleanup_old_keys(self):
        """Cron job to clean up old unused keys"""
        # Remove keys that haven't been used in 90 days
        old_date = fields.Datetime.now() - timedelta(days=90)
        old_keys = self.search([
            ('last_used', '<', old_date),
            ('user_id', '!=', self.password_entry_id.user_id)  # Don't remove owner's keys
        ])
        old_keys.unlink() 