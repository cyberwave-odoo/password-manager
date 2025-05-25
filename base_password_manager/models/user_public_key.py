from odoo import models, fields

class UserPublicKey(models.Model):
    _name = 'user.public.key'
    _description = 'User Public Key for Password Encryption'

    user_id = fields.Many2one('res.users', string='User', required=True, ondelete='cascade', index=True)
    public_key = fields.Text(string='Public Key', required=True)
    company_id = fields.Many2one('res.company', string='Company', default=lambda self: self.env.company)
