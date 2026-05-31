const bcrypt = require('bcryptjs');

const User = require('../models/userModel');


class SimpleUser {
    static async create(userData) {
        return User.create({
            ...userData,
            userType: 'simple',
            isPowerUser: false
        });
    }
}


class SuperUser {
    static async create(userData) {
        return User.create({
            ...userData,
            userType: 'super',
            isPowerUser: false
        });
    }
}


exports.getCadastro = async (req, res) => {
    res.render('cadastro', {
        canCreateAdmin: req.canCreateAdmin
    });
};


exports.postCadastro = async ( req, res ) => {
    const { name, email, password, isAdmin } = req.body;
    const canCreateAdmin = req.canCreateAdmin;

    if (isAdmin && !canCreateAdmin) {
        return res.status(403).json({ message: 'Apenas o power user pode criar administradores' });
    }

    const UserType = isAdmin && canCreateAdmin ? SuperUser : SimpleUser;

    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
        const user = await UserType.create({
            name,
            email,
            password: hashedPassword
        });
    } catch (error) {
        return res.status(500).json({ message: `Erro ao criar usuário: ${error.message}` });
    }

    res.redirect('/');
};
