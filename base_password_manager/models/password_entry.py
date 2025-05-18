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
    
    public_key = fields.Text(string='Public Key', help='Company public key for encryption')
    private_key = fields.Text(string='Private Key', help='Company private key for decryption')
    
    share_ids = fields.One2many('password.share', 'password_entry_id', string='Shares')
    
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
        """Encrypt password using master password and company public key"""
        # First encrypt with master password
        key = self._generate_key(master_password)
        f = Fernet(key)
        encrypted_data = f.encrypt(password.encode())
        
        # Then encrypt with company public key
        if self.public_key:
            public_key = serialization.load_pem_public_key(
                self.public_key.encode()
            )
            encrypted_data = public_key.encrypt(
                encrypted_data,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
        
        return base64.b64encode(encrypted_data).decode()

    def decrypt_password(self, master_password):
        """Decrypt password using master password and company private key"""
        try:
            # First decrypt with company private key
            encrypted_data = base64.b64decode(self.encrypted_password.encode())
            if self.private_key:
                private_key = serialization.load_pem_private_key(
                    self.private_key.encode(),
                    password=None
                )
                encrypted_data = private_key.decrypt(
                    encrypted_data,
                    padding.OAEP(
                        mgf=padding.MGF1(algorithm=hashes.SHA256()),
                        algorithm=hashes.SHA256(),
                        label=None
                    )
                )
            
            # Then decrypt with master password
            key = self._generate_key(master_password)
            f = Fernet(key)
            decrypted_data = f.decrypt(encrypted_data)
            return decrypted_data.decode()
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

