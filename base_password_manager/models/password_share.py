from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
import base64
from cryptography.fernet import Fernet
import json

class PasswordShare(models.Model):
    _name = 'password.share'
    _description = 'Password Share'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    password_entry_id = fields.Many2one('password.entry', string='Password Entry', required=True)
    shared_with_id = fields.Many2one('res.users', string='Shared With', required=True)
    company_id = fields.Many2one('res.company', string='Company', default=lambda self: self.env.company)
    access_type = fields.Selection([
        ('read', 'Read Only'),
        ('write', 'Read & Write')
    ], string='Access Type', default='read', required=True)
    expiry_date = fields.Datetime(string='Expiry Date')
    state = fields.Selection([
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('revoked', 'Revoked')
    ], string='Status', default='active', tracking=True)
    
    _sql_constraints = [
        ('unique_share', 'unique(password_entry_id, shared_with_id)',
         'This password is already shared with this user!')
    ]

    @api.constrains('shared_with_id')
    def _check_share_with_self(self):
        for record in self:
            if record.shared_with_id == record.password_entry_id.user_id:
                raise ValidationError(_('You cannot share a password with yourself!'))

    @api.constrains('expiry_date')
    def _check_expiry_date(self):
        for record in self:
            if record.expiry_date and record.expiry_date < fields.Datetime.now():
                record.state = 'expired'

    def action_revoke_access(self):
        """Revoke access to shared password"""
        self.write({'state': 'revoked'})
        return True

    def action_extend_access(self, new_expiry_date):
        """Extend access to shared password"""
        if new_expiry_date < fields.Datetime.now():
            raise ValidationError(_('New expiry date must be in the future!'))
        self.write({
            'expiry_date': new_expiry_date,
            'state': 'active'
        })
        return True

    @api.model
    def _cron_check_expired_shares(self):
        """Cron job to check and update expired shares"""
        expired_shares = self.search([
            ('state', '=', 'active'),
            ('expiry_date', '<', fields.Datetime.now())
        ])
        expired_shares.write({'state': 'expired'}) 