# -*- coding: utf-8 -*-
# from odoo import http


# class PasswordShares(http.Controller):
#     @http.route('/password_shares/password_shares', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/password_shares/password_shares/objects', auth='public')
#     def list(self, **kw):
#         return http.request.render('password_shares.listing', {
#             'root': '/password_shares/password_shares',
#             'objects': http.request.env['password_shares.password_shares'].search([]),
#         })

#     @http.route('/password_shares/password_shares/objects/<model("password_shares.password_shares"):obj>', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('password_shares.object', {
#             'object': obj
#         })

