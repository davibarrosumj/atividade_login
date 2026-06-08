const User = require('../models/user');
const Donation = require('../models/donation');

exports.adminWarehousePage = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id);

        const pendingEntries = await Donation.findAll({
            where: { status: 'registered' },
            include: [{ model: User, as: 'donor', attributes: ['name', 'email'] }],
            order: [['createdAt', 'DESC']]
        });

        const pendingExits = await Donation.findAll({
            where: { status: 'pending' },
            include: [{ model: User, as: 'receiver', attributes: ['name', 'email'] }],
            order: [['updatedAt', 'DESC']]
        });

        res.render('adminArmazenagem', {
            user,
            pendingEntries,
            pendingExits
        });
    } catch (err) {
        next(err);
    }
};

exports.confirmEntry = async (req, res, next) => {
    const { storageCode, condition } = req.body;
    const storageCodeRegex = /^[A-Z]\d+-[A-Z]\d+$/;
    if (!storageCode || !storageCodeRegex.test(storageCode.trim())) {
        req.flash('error_msg', 'Identificador de estocagem inválido. Deve seguir o formato Letra+Número-Letra+Número (ex: A1-S2, F12-B09)');
        return res.redirect('/admin/armazenagem');
    }

    const validConditions = ['Perfeito', 'Bom', 'Regular', 'Ruim', 'Quebrado'];
    if (!condition || !validConditions.includes(condition)) {
        req.flash('error_msg', 'A condição do item é obrigatória');
        return res.redirect('/admin/armazenagem');
    }

    try {
        const donation = await Donation.findByPk(req.params.id);
        if (!donation) {
            req.flash('error_msg', 'Doação não encontrada');
            return res.redirect('/admin/armazenagem');
        }

        if (donation.status !== 'registered') {
            req.flash('error_msg', 'Esta doação já foi processada');
            return res.redirect('/admin/armazenagem');
        }

        donation.status = 'triaged';
        donation.storageCode = storageCode.trim();
        donation.condition = condition;
        await donation.save();

        req.flash('success_msg', `Triagem concluída! Item "${donation.name}" avaliado como "${condition}" e estocado em: "${donation.storageCode}". Aguardando confirmação do doador.`);
        return res.redirect('/admin/armazenagem');
    } catch (err) {
        next(err);
    }
};

exports.confirmExit = async (req, res, next) => {
    try {
        const donation = await Donation.findByPk(req.params.id);
        if (!donation) {
            req.flash('error_msg', 'Doação não encontrada');
            return res.redirect('/admin/armazenagem');
        }

        if (donation.status !== 'pending') {
            req.flash('error_msg', 'Este item não possui retirada pendente');
            return res.redirect('/admin/armazenagem');
        }

        donation.status = 'collected';
        await donation.save();

        req.flash('success_msg', 'Entrega física confirmada com sucesso!');
        return res.redirect('/admin/armazenagem');
    } catch (err) {
        next(err);
    }
};
