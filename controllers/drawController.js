const sequelize = require('../database');
const User = require('../models/user');
const Draw = require('../models/draw');

exports.simulateDraw = async (req, res, next) => {
    try {
        // Pick a random user
        const randomUser = await User.findOne({
            where: { admin: false },
            order: sequelize.random()
        });

        if (!randomUser) {
            req.flash('error_msg', 'Nenhum usuário cadastrado para realizar o sorteio');
            return res.redirect('/admin/sorteios');
        }

        const bonusOptions = [50.00, 100.00];
        const bonus = bonusOptions[Math.floor(Math.random() * bonusOptions.length)];

        randomUser.credits = parseFloat(randomUser.credits) + bonus;
        await randomUser.save();

        // Record draw in history
        await Draw.create({
            winnerId: randomUser.id,
            adminId: req.user.id,
            amount: bonus
        });

        req.flash('success_msg', `Sorteio realizado! O usuário "${randomUser.name}" (${randomUser.email}) recebeu R$ ${bonus.toFixed(2)} em créditos.`);
        return res.redirect('/admin/sorteios');
    } catch (err) {
        next(err);
    }
};

exports.adminDrawsPage = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id);
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await Draw.findAndCountAll({
            limit,
            offset,
            include: [
                { model: User, as: 'winner', attributes: ['id', 'name', 'email'] },
                { model: User, as: 'admin', attributes: ['id', 'name', 'email'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        const totalPages = Math.ceil(count / limit);

        res.render('adminSorteios', {
            user,
            draws: rows,
            currentPage: page,
            totalPages,
            totalCount: count
        });
    } catch (err) {
        next(err);
    }
};
