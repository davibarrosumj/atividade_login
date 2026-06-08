const User = require('../models/user');
const Donation = require('../models/donation');

exports.historyPage = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId);

        const offeredItems = await Donation.findAll({
            where: { userId },
            include: [{ model: User, as: 'receiver', attributes: ['name', 'email'] }],
            order: [['createdAt', 'DESC']]
        });

        const receivedItems = await Donation.findAll({
            where: { receiverId: userId },
            include: [{ model: User, as: 'donor', attributes: ['name', 'email'] }],
            order: [['updatedAt', 'DESC']]
        });

        res.render('historico', {
            user,
            offeredItems,
            receivedItems
        });
    } catch (err) {
        next(err);
    }
};
