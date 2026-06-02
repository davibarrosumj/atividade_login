const { execFileSync } = require('child_process');
const ejs = require('ejs');

const javascriptFiles = [
    'app.js',
    'database.js',
    'routes/authRoutes.js',
    'controllers/authController.js',
    'controllers/dashController.js',
    'controllers/userController.js',
    'middlewares/sessionAuth.js',
    'middlewares/authMiddleware.js',
    'middlewares/adminStatusMiddleware.js',
    'models/estacionamentoModel.js',
    'models/userModel.js',
    'public/dashboardManager.js'
];

const viewTests = [
    {
        file: 'views/login.ejs',
        data: {
            errorMessages: [],
            successMessages: []
        }
    },
    {
        file: 'views/cadastro.ejs',
        data: {
            canCreateAdmin: true,
            errorMessages: [],
            successMessages: []
        }
    },
    {
        file: 'views/dashboardUser.ejs',
        data: {
            user: {
                name: 'Usuario',
                email: 'usuario@mail.com'
            },
            estacionamento: {
                vagasDisponiveis: 140,
                porcentagemOcupacao: 7
            }
        }
    },
    {
        file: 'views/dashboardManager.ejs',
        data: {
            user: {
                name: 'Admin',
                email: 'admin@mail.com'
            },
            estacionamento: {
                capacidadeTotal: 150,
                vagasOcupadas: 10,
                vagasDisponiveis: 140,
                porcentagemOcupacao: 7
            },
            canCreateAdmin: true,
            errorMessages: [],
            successMessages: []
        }
    }
];

javascriptFiles.forEach((file) => {
    execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
});

viewTests.forEach(({ file, data }) => {
    ejs.renderFile(file, data, (error) => {
        if (error) {
            throw error;
        }
    });
});

console.log('Testes concluidos com sucesso.');
