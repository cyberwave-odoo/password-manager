from odoo import models, fields, api, _
from odoo.exceptions import AccessError, ValidationError

import os



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
    iv = fields.Char(string='IV', help='IV used for encryption')
    
    key_id = fields.Many2one('password.key', string='Encrypted Keys')

    password_salt = fields.Char(string='Password Salt', compute='_compute_password_salt', store=True)
    
    def _compute_password_salt(self):
        """Compute a unique salt for each password"""
        for user in self:
            if not user.password_salt:
                user.password_salt = os.urandom(32).hex()
    
    def unlink(self):
        keys_to_delete = self.mapped('key_id')
        res = super(PasswordEntry, self).unlink()
        keys_to_delete.unlink()
        return res



    


            

