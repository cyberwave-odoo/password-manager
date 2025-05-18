from odoo.tests.common import TransactionCase, tagged
from odoo.exceptions import AccessError

@tagged('pwd_manager')
class TestPasswordManagerSecurity(TransactionCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Create test users
        cls.user_owner = cls.env['res.users'].create({
            'name': 'Owner User',
            'login': 'owner@test.com',
            'email': 'owner@test.com',
            'password': 'test',
        })
        cls.user_read = cls.env['res.users'].create({
            'name': 'Read User',
            'login': 'read@test.com',
            'email': 'read@test.com',
            'password': 'test',
        })
        cls.user_write = cls.env['res.users'].create({
            'name': 'Write User',
            'login': 'write@test.com',
            'email': 'write@test.com',
            'password': 'test',
        })
        cls.user_write2 = cls.env['res.users'].create({
            'name': 'Write User 2',
            'login': 'write2@test.com',
            'email': 'write2@test.com',
            'password': 'test',
        })
        cls.user_no_access = cls.env['res.users'].create({
            'name': 'No Access User',
            'login': 'noaccess@test.com',
            'email': 'noaccess@test.com',
            'password': 'test',
        })

        # Create test password entry
        cls.password_entry = cls.env['password.entry'].with_user(cls.user_owner).create({
            'name': 'Test Password',
            'username': 'test_user',
            'encrypted_password': 'test_pass',
        })

        # Create shares
        cls.share_read = cls.env['password.share'].with_user(cls.user_owner).create({
            'password_entry_id': cls.password_entry.id,
            'shared_with_id': cls.user_read.id,
            'access_type': 'read',
        })
        cls.share_write = cls.env['password.share'].with_user(cls.user_owner).create({
            'password_entry_id': cls.password_entry.id,
            'shared_with_id': cls.user_write.id,
            'access_type': 'write',
        })
        cls.share_write2 = cls.env['password.share'].with_user(cls.user_owner).create({
            'password_entry_id': cls.password_entry.id,
            'shared_with_id': cls.user_write2.id,
            'access_type': 'write',
        })
        
        cls.company = cls.env['res.company'].create({'name': 'Test Company'})
        
        cls.user_owner.write({
            'company_ids': [(4, cls.company.id)],
        })

    def test_01_password_entry_read_access(self):
        """Test read access to password entry"""
        # Owner should have read access
        self.assertTrue(self.password_entry.with_user(self.user_owner).read(['name']))
        
        # Read user should have read access
        self.assertTrue(self.password_entry.with_user(self.user_read).read(['name']))
        
        # Write user should have read access
        self.assertTrue(self.password_entry.with_user(self.user_write).read(['name']))
        
        # No access user should not have read access
        with self.assertRaises(AccessError):
            self.password_entry.with_user(self.user_no_access).read(['name'])

    def test_02_password_entry_write_access(self):
        """Test write access to password entry"""
        # Owner should have write access
        self.password_entry.with_user(self.user_owner).write({'name': 'New Name'})
        
        # Write user should have write access
        self.password_entry.with_user(self.user_write).write({'name': 'New Name 2'})
        
        # Read user should not have write access
        with self.assertRaises(AccessError):
            self.password_entry.with_user(self.user_read).write({'name': 'New Name 3'})
        
        # No access user should not have write access
        with self.assertRaises(AccessError):
            self.password_entry.with_user(self.user_no_access).write({'name': 'New Name 4'})

    def test_03_password_share_read_access(self):
        """Test read access to password share"""
        # Owner should have read access to all shares
        self.assertTrue(self.share_read.with_user(self.user_owner).read(['access_type']))
        self.assertTrue(self.share_write.with_user(self.user_owner).read(['access_type']))
        
        # Read user should have read access to their share
        self.assertTrue(self.share_read.with_user(self.user_read).read(['access_type']))
        
        # Write user should have read access to their share and other shares
        self.assertTrue(self.share_write.with_user(self.user_write).read(['access_type']))
        self.assertTrue(self.share_read.with_user(self.user_write).read(['access_type']))
        
        # No access user should not have read access
        with self.assertRaises(AccessError):
            self.share_read.with_user(self.user_no_access).read(['access_type'])

    def test_04_password_share_write_access(self):
        """Test write access to password share"""
        # Owner should have write access to all shares
        self.share_read.with_user(self.user_owner).write({'access_type': 'write'})
        self.share_write.with_user(self.user_owner).write({'access_type': 'read'})
        self.share_write.with_user(self.user_owner).write({'access_type': 'write'})
        
        # Write user should have write access to their share and other shares
        self.share_write.with_user(self.user_write).write({'access_type': 'write'})
        self.share_read.with_user(self.user_write).write({'access_type': 'write'})
        self.share_read.with_user(self.user_write).write({'access_type': 'read'})
        
        # Read user should not have write access to their share
        with self.assertRaises(AccessError):
            self.share_read.with_user(self.user_read).write({'access_type': 'write'})
        
        # No access user should not have write access
        with self.assertRaises(AccessError):
            self.share_read.with_user(self.user_no_access).write({'access_type': 'write'})

    def test_05_write_users_can_modify_each_other_shares(self):
        """Test that users with write access can modify each other's shares"""
        # First write user can modify second write user's share
        self.share_write2.with_user(self.user_write).write({'access_type': 'read'})
        with self.assertRaises(AccessError):
            self.share_write.with_user(self.user_write2).write({'access_type': 'read'})
        self.share_write2.with_user(self.user_write).write({'access_type': 'write'})
        
        # Second write user can modify first write user's share
        self.share_write.with_user(self.user_write2).write({'access_type': 'read'})
        self.share_write.with_user(self.user_write2).write({'access_type': 'write'})
        
        # Both write users can modify read user's share
        self.share_read.with_user(self.user_write).write({'access_type': 'write'})
        self.share_read.with_user(self.user_write2).write({'access_type': 'read'})
        self.share_read.with_user(self.user_write).write({'access_type': 'read'})
        self.share_read.with_user(self.user_write2).write({'access_type': 'write'})

    def test_06_company_restriction(self):
        """Test company restriction"""
        # Create a new company
        
        # Create a password entry in the new company
        password_entry_company = self.env['password.entry'].with_user(self.user_owner).create({
            'name': 'Company Password',
            'username': 'company_user',
            'encrypted_password': 'company_pass',
            'company_id': self.company.id,
        })
        
        # User without company access should not be able to read
        with self.assertRaises(AccessError):
            password_entry_company.with_user(self.user_no_access).read(['name'])
        
        # Add company to user
        self.user_no_access.write({'company_ids': [(4, self.company.id)]})
        
        # Now user should be able to read (but still no access due to share rules)
        with self.assertRaises(AccessError):
            password_entry_company.with_user(self.user_no_access).read(['name']) 