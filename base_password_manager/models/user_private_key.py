from odoo import models, fields

class UserPrivateKey(models.Model):
    _name = 'user.private.key'
    _description = 'User Private Key for Password Encryption'

    user_id = fields.Many2one('res.users', string='User', required=True, ondelete='cascade', index=True)
    private_key = fields.Text(string='Private Key', required=True)
    public_key_id = fields.Many2one('user.public.key', string='Public Key', required=True, ondelete='cascade')
    company_id = fields.Many2one('res.company', string='Company', default=lambda self: self.env.company)
    active = fields.Boolean('active', default=True)