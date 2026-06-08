module.exports = (err, req, res, next) => {
    console.error('Error log:', err);

    if (res.headersSent) {
        return next(err);
    }

    res.status(err.status || 500);

    res.render('error', {
        message: err.message || 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
};
