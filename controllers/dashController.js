const User = require('../models/userModel');


exports.getDashboard = (req, res) => res.render('dashboard', { user: req.session.user });
