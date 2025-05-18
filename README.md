# Password Manager

A modular Odoo app for securely managing passwords, categories, and sharing credentials within your organization.

## Features

- **Password Storage:** Securely store and manage passwords for various services.
- **Categories:** Organize passwords into customizable categories.
- **Sharing:** Share password entries with other users, with access control.
- **User Management:** Integrates with Odoo users for seamless access control.
- **Audit & Security:** Built-in security rules and access rights.

## Module Structure

```
base_password_manager/
├── controllers/         # Web controllers for custom endpoints
├── demo/                # Demo data for testing
├── models/              # Core business logic and data models
├── security/            # Access control and security rules
├── static/              # Static assets (JS, CSS, images)
├── views/               # UI views and menus
├── __init__.py
├── __manifest__.py
```

## Installation

1. Copy the `base_password_manager` folder into your Odoo `addons` directory.
2. Update the app list in Odoo.
3. Install the "Password Manager" module from the Odoo Apps menu.

## Usage

- Access the Password Manager from the Odoo main menu.
- Create categories to organize your passwords.
- Add password entries and assign them to categories.
- Share passwords securely with other users as needed.

## Security

- All passwords are stored securely and access is restricted based on user roles.
- Only authorized users can view or share password entries.

## Development

- Models are defined in the `models/` directory, including:
  - `password_entry.py`: Password storage logic
  - `password_category.py`: Category management
  - `password_share.py`: Sharing logic
  - `res_users.py`: User extensions
- Views and menus are defined in the `views/` directory.
- Access rights are managed in `security/`.

## License

This module is licensed under the MIT License.

---

**Developed for Odoo 14+**

For questions or contributions, please open an issue or submit a pull request.