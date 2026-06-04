const { Op } = require('sequelize');
const Tiquete = require('../models/tiqueteModel');
const Registro = require('../models/registroModel');
const User = require('../models/userModel');

exports.getTiquetes = async (req, res) => {
    if (!req.isAdmin) {
        req.flash('error', 'Acesso restrito a administradores.');
        return res.redirect('/dashboard');
    }

    const { search } = req.query;
    let whereClause = {};

    if (search) {
        const term = `%${search.trim()}%`;
        whereClause = {
            [Op.or]: [
                { codigo: { [Op.iLike]: term } },
                { '$Registro.placa$': { [Op.iLike]: term } }
            ]
        };
    }

    try {
        const tiquetes = await Tiquete.findAll({
            where: whereClause,
            include: [
                { model: Registro, required: true },
                { model: User, as: 'CriadoPor' },
                { model: User, as: 'ValidadoPor' }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.render('tiquetesList', {
            tiquetes,
            search: search || '',
            canCreateAdmin: req.canCreateAdmin
        });
    } catch (error) {
        req.flash('error', `Erro ao buscar tíquetes: ${error.message}`);
        res.redirect('/dashboard');
    }
};

exports.getDevedores = async (req, res) => {
    if (!req.isAdmin) {
        req.flash('error', 'Acesso restrito a administradores.');
        return res.redirect('/dashboard');
    }

    try {
        const devedores = await Tiquete.findAll({
            where: { status: 'pendente' },
            include: [
                {
                    model: Registro,
                    required: true,
                    where: { horarioSaida: { [Op.ne]: null } }
                },
                { model: User, as: 'CriadoPor' }
            ],
            order: [[Registro, 'horarioSaida', 'DESC']]
        });

        res.render('devedoresList', {
            devedores,
            canCreateAdmin: req.canCreateAdmin
        });
    } catch (error) {
        req.flash('error', `Erro ao buscar devedores: ${error.message}`);
        res.redirect('/dashboard');
    }
};

exports.postPagarTiquete = async (req, res) => {
    if (!req.isAdmin) {
        req.flash('error', 'Apenas administradores podem receber pagamentos.');
        return res.redirect('/dashboard');
    }

    const { id } = req.params;

    try {
        const tiquete = await Tiquete.findByPk(id);

        if (!tiquete) {
            req.flash('error', 'Tíquete não encontrado.');
            return res.redirect('/dashboard');
        }

        await tiquete.update({
            status: 'pago',
            validadoPorId: req.user.id
        });

        req.flash('success', `Tíquete ${tiquete.codigo} pago com sucesso.`);
    } catch (error) {
        req.flash('error', `Erro ao registrar pagamento: ${error.message}`);
    }

    const referer = req.headers.referer || '/dashboard';
    res.redirect(referer);
};
