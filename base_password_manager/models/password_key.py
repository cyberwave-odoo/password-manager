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
    
    user_public_key_id = fields.Many2one(
        'user.public.key', string='User Public Key', required=True,
        help='Public key of the user used to encrypt encrypted_key.'
    )
    
    _sql_constraints = [
        ('unique_user_entry', 'unique(password_entry_id, user_id)',
         'A key record already exists for this user and password entry!')
    ]

