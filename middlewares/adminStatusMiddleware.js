module.exports = (req, res, next) => {
    req.isAdmin = req.session.user && req.session.user.userType === 'super';
    req.isPowerUser = req.session.user && req.session.user.isPowerUser;
    req.canCreateAdmin = req.isPowerUser;

    next();
};
