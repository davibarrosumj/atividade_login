const Estacionamento = require('../models/estacionamentoModel');


const getDadosEstacionamento = async () => {
    const [estacionamento] = await Estacionamento.findOrCreate({
        where: { id: 1 },
        defaults: { vagasOcupadas: 0 }
    });

    const capacidadeTotal = estacionamento.capacidadeTotal;
    const vagasOcupadas = estacionamento.vagasOcupadas;
    const vagasDisponiveis = capacidadeTotal - vagasOcupadas;
    const porcentagemOcupacao = capacidadeTotal > 0
        ? Math.round((vagasOcupadas / capacidadeTotal) * 100)
        : 0;

    return {
        capacidadeTotal,
        vagasOcupadas,
        vagasDisponiveis,
        porcentagemOcupacao
    };
};


exports.getDashboard = async (req, res) => {
    const estacionamento = await getDadosEstacionamento();
    const dashboardView = req.isAdmin ? 'dashboardManager' : 'dashboardUser';

    res.render(dashboardView, {
        user: req.session.user,
        estacionamento
    });
};
