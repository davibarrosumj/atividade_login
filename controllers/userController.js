const bcrypt = require('bcryptjs');

const User = require('../models/userModel');


exports.getCadastro = async (req, res) => {
    res.render('cadastro');
};


exports.postCadastro = async ( req, res ) => {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });
    } catch (error) {
        return res.status(500).json({ message: `Erro ao criar usuário: ${error.message}` });
    }

    res.redirect('/');
};
