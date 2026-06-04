const Registro = require('../models/registroModel');
const Estacionamento = require('../models/estacionamentoModel');
const Tiquete = require('../models/tiqueteModel');

const PLACA_REGEX = /^[A-Z]{3}-?[0-9][A-Z0-9][0-9]{2}$/i;

const gerarCodigoTiquete = () => {
    return 'TK-' + Math.random().toString(36).substring(2, 8).toUpperCase();
};

exports.getVeiculosRegistro = async (req, res) => {
    if (!req.isAdmin) {
        req.flash('error', 'Acesso restrito a administradores.');
        return res.redirect('/dashboard');
    }

    try {
        const registrosAtivos = await Registro.findAll({
            where: { status: 'ativo' },
            order: [['horarioEntrada', 'ASC']],
            include: [{ model: Tiquete }]
        });

        res.render('veiculosRegistro', {
            registrosAtivos,
            canCreateAdmin: req.canCreateAdmin
        });
    } catch (error) {
        req.flash('error', `Erro ao buscar veículos: ${error.message}`);
        res.redirect('/dashboard');
    }
};

exports.postEntrada = async (req, res) => {
    if (!req.isAdmin) {
        req.flash('error', 'Apenas administradores podem registrar entrada.');
        return res.redirect('/dashboard');
    }

    let { placa, tipoPagamento } = req.body;
    if (!placa) {
        req.flash('error', 'Placa do veículo é obrigatória.');
        return res.redirect('/veiculos/registro');
    }

    placa = placa.trim().toUpperCase();

    if (!PLACA_REGEX.test(placa)) {
        req.flash('error', 'Formato de placa inválido. Formatos aceitos: ABC-1234 ou ABC1D23.');
        return res.redirect('/veiculos/registro');
    }

    try {
        // Verificar pendências de devedores
        const debitoPendente = await Registro.findOne({
            where: { placa, status: 'concluido' },
            include: [{
                model: Tiquete,
                where: { status: 'pendente' }
            }]
        });

        if (debitoPendente) {
            req.flash('error', `O veículo com placa ${placa} possui débitos pendentes e não pode entrar. É necessário quitar o débito.`);
            return res.redirect('/veiculos/registro');
        }

        const [estacionamento] = await Estacionamento.findOrCreate({
            where: { id: 1 },
            defaults: { vagasOcupadas: 0 }
        });

        if (estacionamento.vagasOcupadas >= estacionamento.capacidadeTotal) {
            req.flash('error', 'Estacionamento lotado. Não é possível registrar entrada.');
            return res.redirect('/veiculos/registro');
        }

        const placaAtiva = await Registro.findOne({
            where: { placa, status: 'ativo' }
        });

        if (placaAtiva) {
            req.flash('error', `O veículo com placa ${placa} já está estacionado.`);
            return res.redirect('/veiculos/registro');
        }

        // Criar registro e tíquete
        const registro = await Registro.create({
            placa,
            status: 'ativo'
        });

        const isPrepago = tipoPagamento === 'prepago';
        let codigoUnico = gerarCodigoTiquete();

        // Garantir unicidade do código
        let codigoExiste = await Tiquete.findOne({ where: { codigo: codigoUnico } });
        while (codigoExiste) {
            codigoUnico = gerarCodigoTiquete();
            codigoExiste = await Tiquete.findOne({ where: { codigo: codigoUnico } });
        }

        await Tiquete.create({
            codigo: codigoUnico,
            status: isPrepago ? 'pago' : 'pendente',
            registroId: registro.id,
            criadoPorId: req.user.id,
            validadoPorId: isPrepago ? req.user.id : null
        });

        await estacionamento.update({
            vagasOcupadas: estacionamento.vagasOcupadas + 1
        });

        req.flash('success', `Entrada do veículo ${placa} registrada com sucesso. Tíquete ${codigoUnico} gerado.`);
    } catch (error) {
        req.flash('error', `Erro ao registrar entrada: ${error.message}`);
    }

    res.redirect('/veiculos/registro');
};

exports.postSaida = async (req, res) => {
    if (!req.isAdmin) {
        req.flash('error', 'Apenas administradores podem registrar saída.');
        return res.redirect('/dashboard');
    }

    const { id } = req.params;

    try {
        const registro = await Registro.findOne({
            where: { id, status: 'ativo' },
            include: [{ model: Tiquete }]
        });

        if (!registro) {
            req.flash('error', 'Registro ativo de veículo não encontrado.');
            return res.redirect('/veiculos/registro');
        }

        if (registro.Tiquete && registro.Tiquete.status !== 'pago') {
            req.flash('error', 'Saída não permitida. O tíquete deste veículo ainda não foi pago.');
            return res.redirect('/veiculos/registro');
        }

        const [estacionamento] = await Estacionamento.findOrCreate({
            where: { id: 1 },
            defaults: { vagasOcupadas: 0 }
        });

        await registro.update({
            horarioSaida: new Date(),
            status: 'concluido'
        });

        const novasVagasOcupadas = Math.max(0, estacionamento.vagasOcupadas - 1);
        await estacionamento.update({
            vagasOcupadas: novasVagasOcupadas
        });

        req.flash('success', `Saída do veículo ${registro.placa} registrada com sucesso.`);
    } catch (error) {
        req.flash('error', `Erro ao registrar saída: ${error.message}`);
    }

    res.redirect('/veiculos/registro');
};

exports.postSaidaIndevida = async (req, res) => {
    if (!req.isAdmin) {
        req.flash('error', 'Apenas administradores podem registrar saída indevida.');
        return res.redirect('/dashboard');
    }

    const { id } = req.params;

    try {
        const registro = await Registro.findOne({
            where: { id, status: 'ativo' },
            include: [{ model: Tiquete }]
        });

        if (!registro) {
            req.flash('error', 'Registro ativo de veículo não encontrado.');
            return res.redirect('/veiculos/registro');
        }

        const [estacionamento] = await Estacionamento.findOrCreate({
            where: { id: 1 },
            defaults: { vagasOcupadas: 0 }
        });

        await registro.update({
            horarioSaida: new Date(),
            status: 'concluido'
        });

        const novasVagasOcupadas = Math.max(0, estacionamento.vagasOcupadas - 1);
        await estacionamento.update({
            vagasOcupadas: novasVagasOcupadas
        });

        req.flash('success', `Saída indevida do veículo ${registro.placa} registrada. O veículo foi adicionado à lista de devedores.`);
    } catch (error) {
        req.flash('error', `Erro ao registrar saída indevida: ${error.message}`);
    }

    res.redirect('/veiculos/registro');
};
