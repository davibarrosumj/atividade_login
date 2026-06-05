const { Op } = require('sequelize');
const Registro = require('../models/registroModel');
const Tiquete = require('../models/tiqueteModel');
const User = require('../models/userModel');

const getStartOfWeek = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
};

const getFaturamentoChartData = (tiquetesPagos, periodo) => {
    const dataMap = {};
    const labels = [];
    const now = new Date();

    if (periodo === 'hoje') {
        for (let i = 0; i < 24; i++) {
            const label = `${String(i).padStart(2, '0')}h`;
            labels.push(label);
            dataMap[label] = 0;
        }
        tiquetesPagos.forEach(t => {
            const date = new Date(t.updatedAt);
            const label = `${String(date.getHours()).padStart(2, '0')}h`;
            if (dataMap[label] !== undefined) {
                dataMap[label] += Number(t.valor);
            }
        });
    } else if (periodo === '7dias' || periodo === '30dias') {
        const daysCount = periodo === '7dias' ? 7 : 30;
        for (let i = daysCount - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
            labels.push(label);
            dataMap[label] = 0;
        }
        tiquetesPagos.forEach(t => {
            const date = new Date(t.updatedAt);
            const label = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (dataMap[label] !== undefined) {
                dataMap[label] += Number(t.valor);
            }
        });
    } else if (periodo === '3meses' || periodo === '6meses') {
        const weeksCount = periodo === '3meses' ? 13 : 26;
        const currentMonday = getStartOfWeek(now);
        for (let i = weeksCount - 1; i >= 0; i--) {
            const d = new Date(currentMonday);
            d.setDate(currentMonday.getDate() - (i * 7));
            const label = `Sem ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
            labels.push(label);
            dataMap[label] = 0;
        }

        tiquetesPagos.forEach(t => {
            const ticketMonday = getStartOfWeek(t.updatedAt);
            const label = `Sem ${String(ticketMonday.getDate()).padStart(2, '0')}/${String(ticketMonday.getMonth() + 1).padStart(2, '0')}`;
            if (dataMap[label] !== undefined) {
                dataMap[label] += Number(t.valor);
            } else {
                dataMap[label] = Number(t.valor);
                if (!labels.includes(label)) {
                    labels.push(label);
                }
            }
        });
    } else if (periodo === '12meses' || periodo === '3anos') {
        const monthsCount = periodo === '12meses' ? 12 : 36;
        for (let i = monthsCount - 1; i >= 0; i--) {
            const d = new Date();
            d.setMonth(now.getMonth() - i);
            const label = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
            labels.push(label);
            dataMap[label] = 0;
        }
        tiquetesPagos.forEach(t => {
            const date = new Date(t.updatedAt);
            const label = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
            if (dataMap[label] !== undefined) {
                dataMap[label] += Number(t.valor);
            }
        });
    } else { // 'todos'
        let minYear = now.getFullYear() - 4;
        tiquetesPagos.forEach(t => {
            const year = new Date(t.updatedAt).getFullYear();
            if (year < minYear) {
                minYear = year;
            }
        });
        for (let y = minYear; y <= now.getFullYear(); y++) {
            const label = `${y}`;
            labels.push(label);
            dataMap[label] = 0;
        }
        tiquetesPagos.forEach(t => {
            const label = `${new Date(t.updatedAt).getFullYear()}`;
            if (dataMap[label] !== undefined) {
                dataMap[label] += Number(t.valor);
            }
        });
    }

    const data = labels.map(label => dataMap[label] || 0);
    return { labels, data };
};

exports.getRelatorios = async (req, res) => {
    const periodo = req.query.periodo || '7dias';
    const search = (req.query.search || '').trim().toUpperCase();

    const now = new Date();
    let startDate = null;
    let endDate = now;

    if (periodo === 'hoje') {
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
    } else if (periodo === '7dias') {
        startDate = new Date();
        startDate.setDate(now.getDate() - 7);
    } else if (periodo === '30dias') {
        startDate = new Date();
        startDate.setDate(now.getDate() - 30);
    } else if (periodo === '3meses') {
        startDate = new Date();
        startDate.setMonth(now.getMonth() - 3);
    } else if (periodo === '6meses') {
        startDate = new Date();
        startDate.setMonth(now.getMonth() - 6);
    } else if (periodo === '12meses') {
        startDate = new Date();
        startDate.setMonth(now.getMonth() - 12);
    } else if (periodo === '3anos') {
        startDate = new Date();
        startDate.setFullYear(now.getFullYear() - 3);
    }

    const whereRegistro = {};
    if (startDate) {
        whereRegistro.horarioEntrada = {
            [Op.between]: [startDate, endDate]
        };
    } else {
        whereRegistro.horarioEntrada = {
            [Op.lte]: endDate
        };
    }

    try {
        const tiquetesPeriodo = await Tiquete.findAll({
            include: [
                {
                    model: Registro,
                    where: whereRegistro,
                    required: true
                },
                {
                    model: User,
                    as: 'CriadoPor',
                    attributes: ['name']
                },
                {
                    model: User,
                    as: 'ValidadoPor',
                    attributes: ['name']
                }
            ],
            order: [[ { model: Registro }, 'horarioEntrada', 'DESC' ]]
        });

        // Métricas e agregação em memória
        let faturamentoTotal = 0;
        let faturamentoCarros = 0;
        let faturamentoMotos = 0;
        let faturamentoPendente = 0;
        let totalConcluidos = 0;
        let totalDevedoresAtivos = 0;

        let totalCarrosCount = 0;
        let totalMotosCount = 0;

        const tiquetesPagos = [];

        tiquetesPeriodo.forEach(t => {
            const valor = Number(t.valor || 0);
            const isMoto = t.Registro && t.Registro.tipoVeiculo === 'moto';

            if (t.status === 'pago') {
                faturamentoTotal += valor;
                tiquetesPagos.push(t);
                if (isMoto) {
                    faturamentoMotos += valor;
                    totalMotosCount += 1;
                } else {
                    faturamentoCarros += valor;
                    totalCarrosCount += 1;
                }
            } else {
                faturamentoPendente += valor;
            }

            if (t.Registro && t.Registro.status === 'concluido') {
                if (t.status === 'pago') {
                    totalConcluidos += 1;
                } else if (t.status === 'pendente') {
                    totalDevedoresAtivos += 1;
                }
            }
        });

        const chartFaturamento = getFaturamentoChartData(tiquetesPagos, periodo);

        // Filtrar histórico pela placa (se especificado)
        const tiquetesFiltrados = search
            ? tiquetesPeriodo.filter(t => t.Registro && t.Registro.placa.includes(search))
            : tiquetesPeriodo;

        const historicoTiquetes = tiquetesFiltrados.filter(t => t.Registro && t.Registro.status === 'concluido');

        res.render('relatorios', {
            periodo,
            search,
            faturamentoTotal,
            faturamentoCarros,
            faturamentoMotos,
            faturamentoPendente,
            totalConcluidos,
            totalDevedoresAtivos,
            totalCarrosCount,
            totalMotosCount,
            chartFaturamento,
            historicoTiquetes,
            canCreateAdmin: req.canCreateAdmin
        });
    } catch (error) {
        req.flash('error', `Erro ao buscar relatórios: ${error.message}`);
        res.redirect('/dashboard');
    }
};
