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

    key_ids = fields.One2many('password.key', 'password_entry_id', string='Encrypted Keys')
    share_ids = fields.One2many('password.share', 'password_entry_id', string='Shares')
    
    password_salt = fields.Char(string='Password Salt', compute='_compute_password_salt', store=True)
    
    def _compute_password_salt(self):
        """Compute a unique salt for each password"""
        for user in self:
            if not user.password_salt:
                user.password_salt = os.urandom(32).hex()



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


            

