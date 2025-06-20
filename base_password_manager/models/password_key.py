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


    password_entry_ids = fields.One2many('password.entry','key_id', string='Password Entry', required=True)
    user_id = fields.Many2one('res.users', string='User', required=True, default=lambda self: self.env.user)
    encrypted_key = fields.Text(string='Encrypted Symmetric Key', required=True)

    
    company_id = fields.Many2one('res.company', string='Company', default=lambda self: self.env.company)
    
    user_public_key_id = fields.Many2one(
        'user.public.key', string='User Public Key', required=True,
        help='Public key of the user used to encrypt encrypted_key.'
    )
    

