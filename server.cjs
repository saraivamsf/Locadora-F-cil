const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID, randomBytes } = require('node:crypto');

const igual = (a, b) => a != null && b != null && String(a) === String(b);
const instituicao = (u) => u && ['instituicao', 'empresa', 'banco'].includes(u.tipo);
const publico = ({ senha, ...u }) => ({ ...u, tipo: instituicao(u) ? 'instituicao' : u.tipo });
const hoje = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
function exigir(condicao, mensagem, status = 400) {
	if (!condicao) throw Object.assign(new Error(mensagem), { status });
}
function criarServidor(arquivo = path.join(__dirname, 'db.json')) {
	const sessoes = new Map();
	const ler = () => JSON.parse(fs.readFileSync(arquivo, 'utf8'));
	const salvar = (db) => {
		fs.writeFileSync(arquivo + '.tmp', JSON.stringify(db, null, 2) + '\n');
		fs.renameSync(arquivo + '.tmp', arquivo);
	};
	function carroDoPedido(db, p) { return db.carros.find(c => igual(c.id, p?.carroId)); }
	function dono(u, c) { return instituicao(u) && igual(c?.instituicaoId, u.id); }
	function acesso(db, u, p) { return p && (instituicao(u) ? dono(u, carroDoPedido(db, p)) : igual(p.clienteId, u.id)); }
	function disponivel(db, carroId, inicio, fim, ignorar) {
		return !db.pedidos.some(p => !igual(p.id, ignorar) && igual(p.carroId, carroId) && ['Aprovado', 'Contratado'].includes(p.status) && inicio <= p.fim && fim >= p.inicio);
	}
	function dadosPedido(db, u, body, p) {
		exigir(u.tipo === 'cliente', 'Somente clientes podem solicitar ou alterar aluguéis.', 403);
		exigir(!p || (igual(p.clienteId, u.id) && ['Pendente', 'Aprovado', 'Recusado'].includes(p.status)), 'Pedido não pode ser alterado.', 403);
		exigir(u.rg && u.cpf && u.endereco && u.profissao && u.empregos?.length, 'Complete seus dados pessoais e renda.');
		const carro = db.carros.find(c => igual(c.id, body.carroId));
		exigir(carro?.instituicaoId, 'Veículo sem instituição responsável ou inexistente.');
		const datas = [body.inicio, body.fim];
		exigir(datas.every(d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d)) && new Date(d).toISOString().slice(0, 10) === d) && body.inicio >= hoje() && body.fim >= body.inicio, 'Período inválido.');
		exigir(['simples', 'credito'].includes(body.tipoContrato), 'Tipo de contrato inválido.');
		exigir(disponivel(db, carro.id, body.inicio, body.fim, p?.id), 'Veículo já reservado neste período.', 409);
		return { carroId: carro.id, clienteId: u.id, inicio: body.inicio, fim: body.fim, tipoContrato: body.tipoContrato, total: (Math.round((Date.parse(body.fim) - Date.parse(body.inicio)) / 86400000) + 1) * carro.diaria, status: 'Pendente', parecer: '', avaliadorId: null };
	}
	return http.createServer(async (req, res) => {
		const origin = req.headers.origin;
		const permitido = origin && /^http:\/\/(localhost|127\.0\.0\.1):3000$/.test(origin);
		if (permitido) {
			res.setHeader('Access-Control-Allow-Origin', origin);
			res.setHeader('Access-Control-Allow-Credentials', 'true');
			res.setHeader('Vary', 'Origin');
		}
		res.setHeader('Content-Type', 'application/json; charset=utf-8');
		res.setHeader('Cache-Control', 'no-store');
		const enviar = (status, dados) => { res.writeHead(status); res.end(JSON.stringify(dados)); };
		try {
			exigir(!origin || permitido, 'Origem não permitida.', 403);
			if (req.method === 'OPTIONS') {
				res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
				res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
				return enviar(204, null);
			}
			let raw = '';
			for await (const chunk of req) {
				raw += chunk;
				exigir(Buffer.byteLength(raw) <= 100000, 'Dados muito grandes.', 413);
			}
			let body = {};
			if (raw) {
				try { body = JSON.parse(raw); } catch { exigir(false, 'JSON inválido.'); }
				exigir(body && typeof body === 'object' && !Array.isArray(body), 'Dados inválidos.');
			}
			const [tabela, id] = new URL(req.url, 'http://localhost').pathname.split('/').filter(Boolean).map(decodeURIComponent);
			const db = ler();
			const token = (req.headers.cookie || '').split(';').map(c => c.trim()).find(c => c.startsWith('locadora_sessao='))?.slice('locadora_sessao='.length);
			const sessao = sessoes.get(token);
			if (sessao && sessao.expira <= Date.now()) sessoes.delete(token);
			const u = sessao && sessao.expira > Date.now() ? db.usuarios.find(x => igual(x.id, sessao.usuarioId)) : null;
			if (tabela === 'auth') {
				if (id === 'login' && req.method === 'POST') {
					const conta = db.usuarios.find(x => x.email.toLowerCase() === String(body.email || '').trim().toLowerCase() && x.senha === body.senha);
					exigir(conta, 'E-mail ou senha incorretos.', 401);
					if (token) sessoes.delete(token);
					const novo = randomBytes(32).toString('hex');
					sessoes.set(novo, { usuarioId: conta.id, expira: Date.now() + 7 * 86400000 });
					res.setHeader('Set-Cookie', `locadora_sessao=${novo}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`);
					return enviar(200, publico(conta));
				}
				if (id === 'logout' && req.method === 'POST') {
					sessoes.delete(token);
					res.setHeader('Set-Cookie', 'locadora_sessao=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
					return enviar(200, {});
				}
				exigir(u, 'Entre novamente para continuar.', 401);
				if (id === 'me' && req.method === 'GET') return enviar(200, publico(u));
				exigir(false, 'Rota não encontrada.', 404);
			}
			if (tabela === 'usuarios' && req.method === 'POST' && !id) {
				exigir(['cliente', 'instituicao'].includes(body.tipo), 'Escolha Cliente ou Empresa / Banco.');
				exigir(String(body.senha || '').length >= 6, 'Informe uma senha de pelo menos 6 caracteres.');
				exigir(String(body.nome || '').trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email || ''), 'Informe nome e e-mail válidos.');
				exigir(!db.usuarios.some(x => x.email.toLowerCase() === body.email.trim().toLowerCase()), 'E-mail já cadastrado.', 409);
				const novo = { id: randomUUID(), tipo: body.tipo, nome: body.nome.trim(), email: body.email.trim().toLowerCase(), senha: body.senha, endereco: String(body.endereco || '').trim() };
				if (body.tipo === 'cliente') Object.assign(novo, { rg: String(body.rg || '').trim(), cpf: String(body.cpf || ''), profissao: String(body.profissao || '').trim(), empregos: Array.isArray(body.empregos) ? body.empregos : [] });
				db.usuarios.push(novo); salvar(db); return enviar(201, publico(novo));
			}
			exigir(u, 'Entre para continuar.', 401);
			if (req.method === 'GET') {
				let lista;
				if (tabela === 'usuarios') {
					// Instituições públicas; dados pessoais somente do titular ou de seus clientes.
					const clientes = new Set(db.pedidos.filter(p => dono(u, carroDoPedido(db, p))).map(p => String(p.clienteId)));
					lista = db.usuarios.map(x => igual(x.id, u.id) || clientes.has(String(x.id)) ? publico(x) : { id: x.id, nome: x.nome, tipo: instituicao(x) ? 'instituicao' : x.tipo });
				} else if (tabela === 'carros') lista = db.carros.map(c => ({
					...c,
					contratado: db.pedidos.some(p => igual(p.carroId, c.id) &&
						(p.status === 'Contratado' || db.contratos.some(contrato => igual(contrato.pedidoId, p.id))))
				}));
				else if (tabela === 'pedidos') lista = db.pedidos.filter(p => acesso(db, u, p));
				else if (tabela === 'contratos') lista = db.contratos.filter(c => acesso(db, u, db.pedidos.find(p => igual(p.id, c.pedidoId))));
				else exigir(false, 'Rota não encontrada.', 404);
				if (id) { const item = lista.find(x => igual(x.id, id)); exigir(item, 'Registro não encontrado.', 404); return enviar(200, item); }
				return enviar(200, lista);
			}
			if (tabela === 'usuarios' && req.method === 'PATCH') {
				exigir(igual(u.id, id), 'Você só pode alterar seu cadastro.', 403);
				exigir(String(body.nome || '').trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email || ''), 'Informe nome e e-mail válidos.');
				exigir(!db.usuarios.some(x => !igual(x.id, id) && x.email.toLowerCase() === body.email.trim().toLowerCase()), 'E-mail já cadastrado.', 409);
				const campos = ['nome', 'email', 'endereco', ...(!instituicao(u) ? ['rg', 'cpf', 'profissao', 'empregos'] : [])];
				for (const campo of campos) if (Object.hasOwn(body, campo)) u[campo] = body[campo];
				salvar(db); return enviar(200, publico(u));
			}
			if (tabela === 'carros' && req.method === 'POST' && !id) {
				exigir(instituicao(u), 'Somente empresas / bancos podem cadastrar carros.', 403);
				const novo = { id: randomUUID(), instituicaoId: u.id };
				for (const campo of ['marca', 'modelo', 'placa', 'matricula', 'categoria']) {
					exigir(typeof body[campo] === 'string' && body[campo].trim() && body[campo].length <= 100, `Informe ${campo}.`);
					novo[campo] = body[campo].trim();
				}
				exigir(novo.matricula.length <= 40, 'A matrícula deve ter até 40 caracteres.');
				novo.placa = novo.placa.toUpperCase().replace(/[-\s]/g, '');
				exigir(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(novo.placa), 'Placa inválida.');
				novo.ano = Number(body.ano); novo.diaria = Number(body.diaria);
				exigir(Number.isInteger(novo.ano) && novo.ano >= 1900 && novo.ano <= 2100 && Number.isFinite(novo.diaria) && novo.diaria > 0, 'Ano ou diária inválidos.');
				exigir(!db.carros.some(c => c.placa.replace(/[-\s]/g, '').toUpperCase() === novo.placa), 'Placa já cadastrada.', 409);
				exigir(!db.carros.some(c => c.matricula?.trim().toLowerCase() === novo.matricula.toLowerCase()), 'Matrícula já cadastrada.', 409);
				if (body.imagem) { exigir(/^https?:\/\/[^\s]+$/.test(body.imagem), 'URL de imagem inválida.'); novo.imagem = body.imagem; }
				db.carros.push(novo); salvar(db); return enviar(201, novo);
			}
			if (tabela === 'pedidos' && req.method === 'POST' && !id) {
				const novo = { ...dadosPedido(db, u, body), id: randomUUID() };
				db.pedidos.push(novo); salvar(db); return enviar(201, novo);
			}
			if (tabela === 'pedidos' && req.method === 'PATCH') {
				const p = db.pedidos.find(p => igual(p.id, id));
				exigir(acesso(db, u, p), 'Somente o cliente ou a instituição responsável pode acessar este pedido.', 403);
				if (instituicao(u)) {
					exigir(p.status === 'Pendente' && ['Aprovado', 'Recusado'].includes(body.status), 'Este pedido não pode ser avaliado.');
					exigir(typeof body.parecer === 'string' && body.parecer.trim() && body.parecer.length <= 500, 'Informe um parecer válido.');
					exigir(body.status !== 'Aprovado' || disponivel(db, p.carroId, p.inicio, p.fim, p.id), 'Veículo já reservado.', 409);
					Object.assign(p, { status: body.status, parecer: body.parecer.trim(), avaliadorId: u.id });
				} else if (body.status === 'Cancelado') {
					exigir(['Pendente', 'Aprovado', 'Recusado'].includes(p.status), 'Este pedido não pode ser cancelado.');
					p.status = 'Cancelado';
				} else Object.assign(p, dadosPedido(db, u, body, p));
				salvar(db); return enviar(200, p);
			}
			if (tabela === 'contratos' && req.method === 'POST' && !id) {
				const p = db.pedidos.find(p => igual(p.id, body.pedidoId));
				exigir(acesso(db, u, p), 'Somente o cliente ou a instituição responsável pode confirmar este contrato.', 403);
				exigir(p.status === 'Aprovado', 'O pedido precisa estar aprovado pela instituição responsável.');
				exigir(!db.contratos.some(c => igual(c.pedidoId, p.id)), 'Contrato já registrado.', 409);
				exigir(disponivel(db, p.carroId, p.inicio, p.fim, p.id), 'Veículo já reservado.', 409);
				const carro = carroDoPedido(db, p);
				const credito = p.tipoContrato === 'credito' ? Number(body.valorCredito) : 0;
				exigir(p.tipoContrato !== 'credito' || (credito > 0 && credito <= p.total && igual(body.bancoId, carro.instituicaoId)), 'Crédito inválido.');
				exigir(igual(body.proprietarioId, carro.instituicaoId), 'A instituição do veículo deve constar no contrato.');
				const novo = { id: randomUUID(), numero: 'CT-' + String(db.contratos.length + 1).padStart(4, '0'), pedidoId: p.id, proprietarioId: carro.instituicaoId, instituicaoId: carro.instituicaoId, bancoId: p.tipoContrato === 'credito' ? carro.instituicaoId : null, valorCredito: credito, data: hoje() };
				db.contratos.push(novo); p.status = 'Contratado'; salvar(db); return enviar(201, novo);
			}
			exigir(false, 'Operação não permitida.', 405);
		} catch (err) {
			if (!err.status) console.error(err);
			enviar(err.status || 500, { erro: err.status ? err.message : 'Não foi possível concluir a operação.' });
		}
	});
}
if (require.main === module) {
	const servidor = criarServidor();
	servidor.listen(3001, '127.0.0.1', () => console.log('API da Locadora Fácil: http://localhost:3001'));
}
module.exports = { criarServidor };
