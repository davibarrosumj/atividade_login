const Estacionamento = require('../models/estacionamentoModel');


const getDadosEstacionamento = async () => {
    const [estacionamento] = await Estacionamento.findOrCreate({
        where: { id: 1 },
        defaults: { 
            vagasOcupadasCarros: 0,
            vagasOcupadasMotos: 0
        }
    });

    const capCarros = estacionamento.capacidadeCarros;
    const ocupCarros = estacionamento.vagasOcupadasCarros;
    const dispCarros = Math.max(0, capCarros - ocupCarros);
    const pctCarros = capCarros > 0 ? Math.round((ocupCarros / capCarros) * 100) : 0;

    const capMotos = estacionamento.capacidadeMotos;
    const ocupMotos = estacionamento.vagasOcupadasMotos;
    const dispMotos = Math.max(0, capMotos - ocupMotos);
    const pctMotos = capMotos > 0 ? Math.round((ocupMotos / capMotos) * 100) : 0;

    return {
        carros: {
            capacidadeTotal: capCarros,
            vagasOcupadas: ocupCarros,
            vagasDisponiveis: dispCarros,
            porcentagemOcupacao: pctCarros
        },
        motos: {
            capacidadeTotal: capMotos,
            vagasOcupadas: ocupMotos,
            vagasDisponiveis: dispMotos,
            porcentagemOcupacao: pctMotos
        }
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
