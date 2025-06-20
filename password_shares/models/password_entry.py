from odoo import models, fields, api, _
from odoo.exceptions import AccessError, ValidationError

import os



class PasswordEntry(models.Model):
    _inherit = 'password.entry'
    _description = 'Password Entry'

    share_ids = fields.One2many('password.share', 'password_entry_id', string='Shares')
    

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
    


            

