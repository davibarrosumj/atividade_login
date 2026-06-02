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
        estacionamento,
        canCreateAdmin: req.canCreateAdmin
    });
};


exports.postCapacidade = async (req, res) => {
    if (!req.isAdmin) {
        req.flash('error', 'Apenas administradores podem alterar a capacidade.');
        return res.redirect('/dashboard');
    }

    const novaCapacidade = Number(req.body.capacidadeTotal);
    const [estacionamento] = await Estacionamento.findOrCreate({
        where: { id: 1 },
        defaults: { vagasOcupadas: 0 }
    });

    if (!Number.isInteger(novaCapacidade) || novaCapacidade < 1) {
        req.flash('error', 'Informe uma capacidade valida.');
        return res.redirect('/dashboard');
    }

    if (novaCapacidade < estacionamento.vagasOcupadas) {
        req.flash('error', 'A capacidade nao pode ser menor que as vagas ocupadas.');
        return res.redirect('/dashboard');
    }

    await estacionamento.update({ capacidadeTotal: novaCapacidade });
    req.flash('success', 'Capacidade atualizada com sucesso.');

    res.redirect('/dashboard');
};
