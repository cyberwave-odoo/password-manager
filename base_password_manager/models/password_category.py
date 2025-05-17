from odoo import models, fields, api, _

class PasswordCategory(models.Model):
    _name = 'password.category'
    _description = 'Password Category'
    _order = 'name'

    name = fields.Char(string='Name', required=True)
    description = fields.Text(string='Description')
    user_id = fields.Many2one('res.users', string='Owner', default=lambda self: self.env.user)
    company_id = fields.Many2one('res.company', string='Company', default=lambda self: self.env.company)
    password_entry_ids = fields.One2many('password.entry', 'category_id', string='Password Entries')
    password_count = fields.Integer(compute='_compute_password_count', string='Number of Passwords')

    @api.depends('password_entry_ids')
    def _compute_password_count(self):
        for record in self:
            record.password_count = len(record.password_entry_ids) 