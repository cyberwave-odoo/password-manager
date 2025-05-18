# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
import json

class PasswordManagerController(http.Controller):
    @http.route('/password_manager/get_user_salt', type='json', auth='user')
    def get_user_salt(self, **kwargs):
        """Get the user's salt for password encryption"""
        user = request.env.user
        return user.password_salt

    @http.route('/password_manager/store_encrypted_password', type='json', auth='user')
    def store_encrypted_password(self, encrypted_password, **kwargs):
        """Store the encrypted password"""
        try:
            # Create or update password entry
            password_entry = request.env['password.entry'].create({
                'name': 'Encrypted Password',
                'username': request.env.user.login,
                'encrypted_password': encrypted_password,
                'user_id': request.env.user.id,
            })
            return {'success': True, 'entry_id': password_entry.id}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/password_manager/generate_password', type='json', auth='user')
    def generate_password(self, length=16, include_uppercase=True, include_lowercase=True,
                         include_numbers=True, include_special=True, **kwargs):
        """Generate a strong password"""
        import string
        import random

        chars = ''
        if include_uppercase:
            chars += string.ascii_uppercase
        if include_lowercase:
            chars += string.ascii_lowercase
        if include_numbers:
            chars += string.digits
        if include_special:
            chars += string.punctuation

        if not chars:
            chars = string.ascii_letters + string.digits

        return ''.join(random.choice(chars) for _ in range(length))


