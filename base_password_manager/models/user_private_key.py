from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
import logging
_logger = logging.getLogger(__name__)
import json

class UserPrivateKey(models.Model):
    _name = 'user.private.key'
    _description = 'User Private Key for Password Encryption'

    user_id = fields.Many2one('res.users', string='User', required=True, ondelete='cascade', index=True)
    private_key = fields.Text(string='Private Key', required=True)
    public_key_id = fields.Many2one('user.public.key', string='Public Key', required=True, ondelete='cascade', index=True)

    company_id = fields.Many2one('res.company', string='Company', default=lambda self: self.env.company)
    active = fields.Boolean('active', default=True)
    


    _sql_constraints = [
        ('unique_public_key', 'unique(public_key_id)', 'Each public key can only have one private key!')
    ]

    @api.constrains('user_id', 'public_key_id')
    def _check_user_consistency(self):
        for record in self:
            if record.user_id != record.public_key_id.user_id:
                raise ValidationError(_('The private key must belong to the same user as its public key.'))

    @api.model
    def create_key_pair(self, public_key, private_key, iv):
        """
        Create a new key pair for a user, ensuring no active keys exist for that user.
        
        Args:
            user_id (int): The ID of the user
            public_key (str): The public key in base64 format
            private_key (str): The encrypted private key in base64 format
            
        Returns:
            dict: Dictionary containing the created public and private key records
        """
        user_id = self.env.user.id
        # Deactivate any existing active keys for the user
        
        existing_private_keys = self.env['user.private.key'].search([
            ('user_id', '=', user_id),
            ('active', '=', True)
        ])
        
        if existing_private_keys:
            existing_private_keys.write({'active': False})
            existing_private_keys.mapped("public_key_id").write({'active': False})
            
        public_key_record = self.env['user.public.key'].create({
            'user_id': user_id,
            'public_key': public_key,
            'iv': iv,
        })
        # Create the private key
        private_key_record = self.env['user.private.key'].create({
            'user_id': user_id,
            'private_key': private_key,
            'public_key_id': public_key_record.id,
        })

        return {
            'public_key': public_key_record,
            'private_key': private_key_record,
            'iv': public_key_record.iv
        }

    @api.model
    def get_active_key_pair(self):
        """
        Get the active key pair for a user.
        
        Args:
            user_id (int): The ID of the user
            
        Returns:
            dict: Dictionary containing the active public and private key records, or None if no active keys exist
        """
        user_id = self.env.user.id
        private_key = self.search([
            ('user_id', '=', user_id),
            ('active', '=', True)
        ], limit=1)
        
        if not private_key:
            return None
            
        public_key = private_key.public_key_id
        
        if not public_key:
            return None
            
        return {
            'public_key': public_key.public_key,
            'private_key': private_key.private_key,
            'iv': public_key.iv
        }