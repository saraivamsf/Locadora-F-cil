const API = `http://${location.hostname || "localhost"}:3001`;
const CHAVE_SESSAO = "locadora-facil.sessao";
const ASSETS = new URL("images/carros/", document.currentScript.src);
const IMAGENS_CARROS = {
	"Fiat Argo": "design.webp",
	"Chevrolet Onix": "onix-rs-turbo-branco-smmit.png",
	"Hyundai HB20": "HYUNDAI_HB20_1.0_TGDI_FLEX_PLATINUM_PLUS_AUTOMATICO_34882012122107340.webp",
	"Renault Kwid": "renault-kwid.jpg",
};
let usuario = null,
	pagina = "inicio";
const app = document.querySelector("#app");
const esc = (valor) =>
	String(valor ?? "").replace(
		/[&<>"']/g,
		(c) =>
			({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
				c
			],
	);
const dinheiro = (n) =>
	Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBR = (s) => (s ? s.split("-").reverse().join("/") : "—");
const instituicao = (u) => u && ["instituicao", "empresa", "banco"].includes(u.tipo);
const agente = () => instituicao(usuario);
const tipoNome = (tipo) => tipo === "cliente" ? "Cliente" : "Empresa / Banco";
const responsavel = (carro) => agente() && carro && String(carro.instituicaoId) === String(usuario.id);
const hoje = () => {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
function mensagem(texto, erro = false) {
	document.querySelector("#notice").innerHTML =
		`<div class="alert alert-${erro ? "danger" : "success"}">${esc(texto)}</div>`;
}
async function api(tabela, metodo = "GET", dados = null, id = "") {
	let resposta;
	try {
		resposta = await fetch(
			`${API}/${tabela}${id ? "/" + encodeURIComponent(id) : ""}`,
			{
				method: metodo,
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				...(dados ? { body: JSON.stringify(dados) } : {}),
			},
		);
	} catch {
		throw Error(
			"Não foi possível acessar a API. Inicie o projeto com npm start.",
		);
	}
	if (!resposta.ok) {
		const erro = await resposta.json().catch(() => ({}));
		throw Object.assign(Error(erro.erro || "Não foi possível salvar ou consultar os dados."), { status: resposta.status });
	}
	return resposta.json();
}
function campo(nome, label, tipo = "text", valor = "", extra = "") {
	return `<div class="col-md-6"><label for="${nome}" class="form-label">${label}</label><input class="form-control" id="${nome}" name="${nome}" type="${tipo}" value="${esc(valor)}" ${extra}></div>`;
}
function seletor(nome, label, opcoes, valor = "", extra = "") {
	return `<div class="col-md-6"><label for="${nome}" class="form-label">${label}</label><select class="form-select" name="${nome}" id="${nome}" ${extra}>${opcoes.map(([v, t]) => `<option value="${esc(v)}" ${String(v) === String(valor) ? "selected" : ""}>${esc(t)}</option>`).join("")}</select></div>`;
}
const statusBadge = (s) =>
	`<span class="badge text-bg-${{ Pendente: "warning", Aprovado: "success", Recusado: "danger", Cancelado: "secondary", Contratado: "primary" }[s] || "secondary"}">${esc(s)}</span>`;
function nav() {
	const icones = {
		inicio: '<path d="m3 10 9-7 9 7"/><path d="M5 9v12h14V9M9 21v-8h6v8"/>',
		carros: '<path d="m5 7 2-4h10l2 4 2 3v8H3v-8l2-3Zm0 0h14M3 11h18M6 18v3m12-3v3"/><path d="M6 14h2m8 0h2"/>',
		pedidos: '<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4V2h6v2M9 10h6m-6 4h6m-6 4h4"/>',
		contratos: '<path d="M14 2H5v20h14V7l-5-5Zm0 0v6h5M8 12h8m-8 4h5"/>',
		perfil: '<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',
		sair: '<path d="M9 3H4v18h5m6-14 5 5-5 5m-7-5h12"/>',
	};
	const icone = (nome) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icones[nome]}</svg>`;
	const itens = [["inicio", "Início"], ...(usuario ? [
		["carros", "Carros"], ["pedidos", agente() ? "Pedidos" : "Meus pedidos"],
		["contratos", "Contratos"], ["perfil", "Meu cadastro"],
	] : [])];
	const atual = pagina === "novo-carro" ? "carros" : pagina;
	document.querySelector("#nav").innerHTML = `
		<div class="nav-pages">${itens.map(([id, nome]) => `
			<button type="button" class="nav-link${atual === id ? " active" : ""}" data-page="${id}"${atual === id ? ' aria-current="page"' : ""}>${icone(id)}<span>${nome}</span></button>
		`).join("")}</div>
		${usuario ? `<div class="nav-account">
			<span class="nav-avatar" aria-hidden="true">${esc((usuario.nome || "U").trim().split(/\s+/).map(n => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase())}</span>
			<div class="nav-user"><span class="nav-user-name">${esc(usuario.nome)}</span><span class="nav-user-role">${esc(tipoNome(usuario.tipo))}</span></div>
			<button type="button" class="nav-signout" data-action="sair" aria-label="Sair da conta">${icone("sair")}<span>Sair</span></button>
		</div>` : `<div class="nav-auth"><button type="button" class="btn ${pagina === "login" ? "btn-primary" : "btn-outline-primary"}" data-page="login"${pagina === "login" ? ' aria-current="page"' : ""}>Entrar</button><button type="button" class="btn btn-primary" data-page="cadastro"${pagina === "cadastro" ? ' aria-current="page"' : ""}>Cadastrar</button></div>`}`;
}

function lerSessao() {
	try {
		return JSON.parse(localStorage.getItem(CHAVE_SESSAO)) || {};
	} catch {
		return {};
	}
}
function salvarSessao() {
	try {
		if (usuario) {
			// Guarda apenas a referência da conta e a aba, sem senha ou dados pessoais.
			localStorage.setItem(CHAVE_SESSAO, JSON.stringify({ usuarioId: usuario.id, pagina }));
		} else {
			localStorage.removeItem(CHAVE_SESSAO);
		}
	} catch {
		// A navegação continua se o navegador bloquear o armazenamento.
	}
}
async function iniciar() {
	const sessao = lerSessao();
	if (sessao.usuarioId != null) {
		try {
			usuario = await api("auth/me");
		} catch (err) {
			if (err.status === 401) {
				usuario = null;
				await mostrar("login");
				mensagem("Entre novamente para continuar.", true);
				return;
			}
			// Mantém a referência salva para tentar novamente após a API voltar.
			nav();
			mensagem(err.message, true);
			return;
		}
	}
	const paginas = ["inicio", "carros", "pedidos", "contratos", "perfil"];
	await mostrar(usuario && paginas.includes(sessao.pagina) ? sessao.pagina : "inicio");
}
async function mostrar(p = "inicio") {
	if (!usuario && !["inicio", "login", "cadastro"].includes(p))
		return mostrar("login");
	pagina = p;
	salvarSessao();
	nav();
	document.querySelector("#notice").innerHTML = "";
	if (p === "inicio") {
		if (usuario) return await inicioLogado();
		app.innerHTML = `<section class="hero p-4 mb-4"><span class="text-primary small fw-semibold">BEM-VINDO À LOCADORA FÁCIL</span><h1 class="mt-2">Seu próximo aluguel começa aqui.</h1><p class="text-secondary mb-3">Consulte os carros, faça seu pedido e acompanhe a análise do aluguel em um só lugar.</p><button class="btn btn-primary" data-page="${usuario ? "carros" : "cadastro"}">${usuario ? "Ver carros" : "Criar meu cadastro"}</button> <button class="btn btn-outline-secondary" data-page="${usuario ? "pedidos" : "login"}">${usuario ? "Acompanhar pedidos" : "Já tenho cadastro"}</button></section><h2 class="mb-3">Como funciona</h2><div class="row g-3 mb-4">${[
			["1", "Faça seu cadastro", "Informe seus dados para acessar o sistema."],
			["2", "Escolha um carro", "Selecione o veículo e o período do aluguel."],
			["3", "Acompanhe seu pedido", "Após a análise, confirme seu contrato."],
		]
			.map(
				(x) =>
					`<div class="col-md-4"><div class="card h-100"><div class="card-body"><h2><span class="step">${x[0]}</span>${x[1]}</h2><p class="text-secondary small mb-0">${x[2]}</p></div></div></div>`,
			)
			.join(
				"",
			)}</div><div class="card"><div class="card-body"><h2>Sobre o sistema</h2><p class="mb-0 text-secondary">Clientes podem solicitar, alterar e cancelar pedidos. Empresas / bancos cadastram veículos e avaliam os pedidos dos carros de sua instituição.</p></div></div>`;
	} else if (p === "login") {
		app.innerHTML = `<section class="card login-box"><div class="card-body p-4"><h1>Entrar</h1><p class="text-secondary">Acesse sua conta para continuar.</p><form id="login"><div class="row g-3">${campo("email", "E-mail", "email", "", "required")}${campo("senha", "Senha", "password", "", "required")}</div><button class="btn btn-primary w-100 mt-3">Entrar</button></form><p class="small mt-3 mb-0">Ainda não tem conta? <a href="#" data-page="cadastro">Cadastre-se</a></p></div></section><div class="login-box small text-secondary"><strong>Contas fictícias para testar</strong><p class="mb-1">Cliente: cliente@teste.com<br>Empresa: empresa@teste.com<br>Banco: banco@teste.com</p>Senha de todas: 123456</div>`;
	} else if (p === "cadastro" || p === "perfil") perfil();
	else if (p === "carros") await carros();
	else if (p === "novo-carro") carroForm();
	else if (p === "pedidos") await pedidos();
	else if (p === "contratos") await contratos();
}
async function inicioLogado() {
	const [pedidos, carros, contratos, usuarios] = await Promise.all([
		api("pedidos"), api("carros"), api("contratos"), api("usuarios"),
	]);
	const meus = pedidos.filter((p) => agente()
		? responsavel(carros.find((c) => String(c.id) === String(p.carroId)))
		: String(p.clienteId) === String(usuario.id));
	const pendentes = meus.filter((p) => ["Pendente", "Aprovado"].includes(p.status));
	const ativos = meus.filter((p) => p.status === "Contratado" && p.fim >= hoje());
	const card = (p, ativo) => {
		const carro = carros.find((c) => String(c.id) === String(p.carroId));
		const contrato = contratos.find((c) => String(c.pedidoId) === String(p.id));
		const pessoa = usuarios.find((u) => String(u.id) === String(agente() ? p.clienteId : carro?.instituicaoId));
		const situacao = ativo
			? `<span class="badge text-bg-primary">${p.inicio > hoje() ? "Agendado" : "Em andamento"}</span>`
			: p.status === "Aprovado"
				? '<span class="badge text-bg-success">Aguardando confirmação</span>'
				: '<span class="badge text-bg-warning">Em análise</span>';
		return `<div class="col-md-6"><article class="card h-100"><div class="card-body"><div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2"><h3 class="h5 mb-0">${esc(carro ? `${carro.marca} ${carro.modelo}` : "Veículo não encontrado")}</h3>${situacao}</div>${contrato ? `<p class="small text-secondary mb-2">Contrato ${esc(contrato.numero)}</p>` : ""}<p class="small text-secondary">${agente() ? "Cliente" : "Instituição"}: ${esc(pessoa?.nome || "Não informada")}</p><p>Retirada: ${dataBR(p.inicio)}<br>Devolução: ${dataBR(p.fim)}<br>Total: <strong>${dinheiro(p.total)}</strong></p><div class="d-flex flex-wrap gap-2"><button class="btn btn-sm btn-outline-secondary" data-action="detalhes" data-id="${esc(p.id)}">Detalhes</button>${!ativo && agente() && p.status === "Pendente" ? `<button class="btn btn-sm btn-primary" data-action="avaliar" data-id="${esc(p.id)}">Avaliar pedido</button>` : ""}${!ativo && p.status === "Aprovado" ? `<button class="btn btn-sm btn-success" data-action="contratar" data-id="${esc(p.id)}">${agente() ? "Gerar contrato" : "Confirmar contrato"}</button>` : ""}${ativo ? '<button class="btn btn-sm btn-outline-primary" data-page="contratos">Ver contratos</button>' : ""}</div></div></article></div>`;
	};
	const secao = (titulo, lista, ativo, vazio) => `<section class="mb-4"><h2 class="mb-3">${titulo} <span class="badge text-bg-secondary">${lista.length}</span></h2>${lista.length ? `<div class="row g-3">${lista.map((p) => card(p, ativo)).join("")}</div>` : `<div class="card p-4"><p class="text-secondary mb-0">${vazio}</p></div>`}</section>`;
	app.innerHTML = `<div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4"><div><h1>Olá, ${esc(usuario.nome)}</h1><p class="text-secondary mb-0">${agente() ? "Acompanhe os contratos dos veículos da sua instituição." : "Acompanhe seus contratos e solicitações de aluguel."}</p></div><button class="btn btn-primary" data-page="${agente() ? "pedidos" : "carros"}">${agente() ? "Ver pedidos" : "Ver carros"}</button></div>${secao("Contratos pendentes", pendentes, false, "Nenhum contrato pendente de análise ou confirmação.")}<p class="small text-secondary">Os contratos ativos incluem aluguéis em andamento e já confirmados para datas futuras.</p>${secao("Contratos ativos", ativos, true, "Nenhum contrato ativo no momento.")}`;
}
function perfil() {
	const u = pagina === "perfil" ? usuario : {};
	app.innerHTML = `<h1>${u.id ? "Meu cadastro" : "Criar cadastro"}</h1><p class="text-secondary">Preencha os dados abaixo. Campos com * são obrigatórios.</p><form id="cadastro" class="card"><div class="card-body"><div class="row g-3">${campo("nome", "Nome / razão social *", "text", u.nome, 'required maxlength="100"')}${campo("email", "E-mail *", "email", u.email, "required")}${
		!u.id
			? campo("senha", "Senha *", "password", "", 'required minlength="6"') +
				seletor("tipo", "Tipo de usuário *", [
					["", "Selecione seu perfil"],
					["instituicao", "Empresa / Banco"],
					["cliente", "Cliente"],
				], "", "required")
			: ""
	}${campo("rg", "RG", "text", u.rg)}${campo("cpf", "CPF (somente números)", "text", u.cpf, 'pattern="[0-9]{11}" maxlength="11"')}${campo("endereco", "Endereço", "text", u.endereco)}${campo("profissao", "Profissão", "text", u.profissao)}</div><p id="legenda-cadastro" class="small text-secondary mt-3">Para fazer um pedido, o cliente deve preencher RG, CPF, endereço, profissão e pelo menos uma fonte de renda.</p><fieldset id="empregadores"><h2 class="mt-4">Empregadores e rendimentos</h2><p class="small text-secondary">Informe até 3 fontes de renda. Valor mensal em reais.</p><div class="row g-3">${[0, 1, 2].map((i) => campo("empresa" + i, `Empregador ${i + 1}`, "text", u.empregos?.[i]?.empresa) + campo("renda" + i, `Rendimento ${i + 1} (R$)`, "number", u.empregos?.[i]?.renda, 'min="0.01" step="0.01"')).join("")}</div></fieldset><button class="btn btn-primary mt-4">${u.id ? "Salvar alterações" : "Cadastrar"}</button> <button type="button" class="btn btn-outline-secondary mt-4" data-page="inicio">Voltar</button></div></form>`;
	atualizarCamposPerfil(u.tipo);
}
function atualizarCamposPerfil(tipo = document.querySelector("#tipo")?.value) {
	const form = document.querySelector("#cadastro");
	if (!form) return;
	const pessoaJuridica = ["instituicao", "empresa", "banco"].includes(tipo);
	const empregadores = form.querySelector("#empregadores");
	empregadores.hidden = pessoaJuridica;
	empregadores.disabled = pessoaJuridica;
	form.querySelector("#legenda-cadastro").textContent = ["instituicao", "empresa", "banco"].includes(tipo)
		? "Adicione as informações de sua instituição."
		: "Para fazer um pedido, o cliente deve preencher RG, CPF, endereço, profissão e pelo menos uma fonte de renda.";
	for (const nome of ["rg", "cpf", "profissao"]) {
		const input = form.querySelector(`[name="${nome}"]`);
		input.closest(".col-md-6").hidden = ["instituicao", "empresa", "banco"].includes(tipo);
		input.disabled = ["instituicao", "empresa", "banco"].includes(tipo);
	}
}
document.addEventListener("change", (e) => {
	if (e.target.id === "tipo") atualizarCamposPerfil(e.target.value);
});
const carroSVG =
	'<svg viewBox="0 0 200 90" fill="none" aria-hidden="true"><path d="M22 55h155l-8-20h-28l-23-23H66L44 36H27z" fill="currentColor" opacity=".22"/><path d="M23 55V39l23-4 21-23h50l24 23h24l13 20v15H23V55Z" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M56 35h70l-16-16H72z" fill="currentColor" opacity=".5"/><circle cx="54" cy="68" r="13" fill="#f0f3f7" stroke="currentColor" stroke-width="5"/><circle cx="147" cy="68" r="13" fill="#f0f3f7" stroke="currentColor" stroke-width="5"/></svg>';
function imagemCarro(carro) {
	// Os arquivos incluídos no site também funcionam com uma API ainda sem o campo imagem.
	const arquivo = IMAGENS_CARROS[`${carro.marca} ${carro.modelo}`];
	const imagem = carro.imagem || (arquivo ? new URL(arquivo, ASSETS).href : "");
	return imagem
		? `<img class="car-image" src="${esc(imagem)}" alt="${esc(carro.marca)} ${esc(carro.modelo)}" width="500" height="300" loading="lazy" decoding="async">`
		: carroSVG;
}
// Usa o ícone do veículo se uma foto não puder ser carregada.
app.addEventListener("error", (e) => {
	if (e.target.matches?.(".car-image")) {
		e.target.parentElement.innerHTML = carroSVG;
	}
}, true);
async function carros() {
	const [todos, instituicoes] = await Promise.all([api("carros"), api("usuarios")]);
	const lista = agente() ? todos.filter(responsavel) : todos.filter((c) => !c.contratado);
	app.innerHTML = `<div class="d-flex justify-content-between align-items-center gap-3 mb-3"><h1>${agente() ? "Meus carros" : "Carros para alugar"}</h1>${agente() ? '<button class="btn btn-primary" data-page="novo-carro">Adicionar carro</button>' : ""}</div><p class="text-secondary mb-4">${agente() ? "Cadastre veículos e acompanhe os pedidos dos carros da sua instituição." : "Escolha um veículo para fazer seu pedido. A disponibilidade será verificada pelo período."}</p>${!lista.length ? `<div class="card p-4"><h2>${agente() ? "Sua instituição ainda não cadastrou carros" : "Nenhum carro disponível"}</h2><p class="text-secondary mb-0">${agente() ? "Use Adicionar carro para oferecer seu primeiro veículo." : "Os veículos cadastrados aparecerão aqui."}</p></div>` : ""}<div class="row g-3">${lista.map((c) => `<div class="col-sm-6 col-lg-3"><article class="card h-100"><div class="car-art">${imagemCarro(c)}</div><div class="card-body"><span class="small text-secondary">${esc(c.categoria)} · ${c.ano}</span><h2 class="card-title mt-1">${esc(c.marca)} ${esc(c.modelo)}</h2><p class="small text-secondary">Oferecido por: <strong>${esc(instituicoes.find((u) => String(u.id) === String(c.instituicaoId))?.nome || "Instituição não informada")}</strong></p><p class="small text-secondary">Placa: ${esc(c.placa)}${c.matricula ? `<br>Matrícula: ${esc(c.matricula)}` : ""}</p><p><span class="price">${dinheiro(c.diaria)}</span> <span class="small text-secondary">/ dia</span></p>${!agente() ? `<button class="btn btn-primary w-100" data-action="novo" data-id="${esc(c.id)}">Solicitar aluguel</button>` : ""}</div></article></div>`).join("")}</div>`;
}
function carroForm() {
	if (!agente()) throw Error("Somente empresas / bancos podem cadastrar carros.");
	app.innerHTML = `<h1>Adicionar carro</h1><p class="text-secondary">O veículo será oferecido por ${esc(usuario.nome)}.</p><form id="carro" class="card"><div class="card-body"><div class="row g-3">${campo("marca", "Marca *", "text", "", 'required maxlength="60"')}${campo("modelo", "Modelo *", "text", "", 'required maxlength="80"')}${campo("ano", "Ano *", "number", "", 'required min="1900" max="2100"')}${campo("placa", "Placa *", "text", "", 'required maxlength="8"')}${campo("matricula", "Matrícula *", "text", "", 'required maxlength="40"')}${campo("diaria", "Diária (R$) *", "number", "", 'required min="0.01" step="0.01"')}${campo("categoria", "Categoria *", "text", "", 'required maxlength="60"')}${campo("imagem", "URL da imagem (opcional)", "url", "", 'placeholder="https://..."')}</div><button class="btn btn-primary mt-4">Cadastrar carro</button> <button type="button" class="btn btn-outline-secondary mt-4" data-page="carros">Voltar</button></div></form>`;
}
async function pedidoForm(carroId, id) {
	let pedido = id
		? (await api("pedidos")).find((x) => String(x.id) === id)
		: null;
	if (pedido && !podeEditar(pedido))
		throw Error("Este pedido não pode ser alterado.");
	const carros = (await api("carros")).filter((c) => !c.contratado || String(c.id) === String(pedido?.carroId));
	app.innerHTML = `<h1>${id ? "Alterar pedido" : "Novo pedido"}</h1><p class="text-secondary">O pedido será enviado para análise financeira.</p><form id="pedido" data-id="${esc(id || "")}" class="card"><div class="card-body"><div class="row g-3">${seletor(
		"carroId",
		"Carro",
		carros.map((c) => [
			c.id,
			`${c.marca} ${c.modelo} — ${dinheiro(c.diaria)}/dia`,
		]),
		pedido?.carroId || carroId,
	)}${seletor(
		"tipoContrato",
		"Tipo de contrato",
		[
			["simples", "Aluguel simples"],
			["credito", "Aluguel com crédito bancário"],
		],
		pedido?.tipoContrato,
	)}${campo("inicio", "Data de retirada", "date", pedido?.inicio, `required min="${hoje()}"`)}${campo("fim", "Data de devolução", "date", pedido?.fim, `required min="${hoje()}"`)}</div><p class="small text-secondary mt-3">Cobrança por dias de calendário, incluindo retirada e devolução. Alterações exigem nova análise.</p><button class="btn btn-primary">Salvar pedido</button> <button type="button" class="btn btn-outline-secondary" data-page="pedidos">Voltar</button></div></form>`;
}
function podeEditar(p) {
	return (
		(!agente() && String(p.clienteId) === String(usuario.id)) &&
		["Pendente", "Aprovado", "Recusado"].includes(p.status)
	);
}
async function pedidos() {
	let [lista, carros, users] = await Promise.all([
		api("pedidos"),
		api("carros"),
		api("usuarios"),
	]);
	lista = lista.filter((p) => agente()
		? responsavel(carros.find((c) => String(c.id) === String(p.carroId)))
		: String(p.clienteId) === String(usuario.id));
	app.innerHTML = `<div class="d-flex justify-content-between align-items-center mb-3"><div><h1>${agente() ? "Gestão de pedidos" : "Meus pedidos"}</h1><p class="text-secondary mb-0">Consulte o andamento das solicitações.</p></div>${!agente() ? '<button class="btn btn-primary" data-page="carros">Novo pedido</button>' : ""}</div><div class="row g-3 mb-4">${[
		["Total de pedidos", lista.length],
		["Em análise", lista.filter((x) => x.status === "Pendente").length],
		["Aprovados", lista.filter((x) => x.status === "Aprovado").length],
	]
		.map(
			([l, n]) =>
				`<div class="col-md-4"><div class="card"><div class="card-body"><div class="text-secondary small">${l}</div><div class="summary">${n}</div></div></div></div>`,
		)
		.join("")}</div>${
		!lista.length
			? '<div class="card p-4 text-center"><h2>Nenhum pedido por aqui</h2><p class="text-secondary mb-0">As solicitações de aluguel aparecerão nesta área.</p></div>'
			: `<div class="card"><div class="table-responsive"><table class="table mb-0"><thead><tr><th>Carro / cliente</th><th>Período</th><th>Total</th><th>Situação</th><th>Ações</th></tr></thead><tbody>${lista
					.map((p) => {
						const c = carros.find((c) => String(c.id) === String(p.carroId));
						return `<tr><td>${esc(c?.marca)} ${esc(c?.modelo)}<br><small class="text-secondary">${esc(users.find((u) => String(u.id) === String(p.clienteId))?.nome)}</small></td><td>${dataBR(p.inicio)}<br>${dataBR(p.fim)}</td><td>${dinheiro(p.total)}</td><td>${statusBadge(p.status)}</td><td><div class="d-flex flex-wrap gap-1"><button class="btn btn-sm btn-outline-secondary" data-action="detalhes" data-id="${esc(p.id)}">Detalhes</button>${podeEditar(p) ? `<button class="btn btn-sm btn-outline-primary" data-action="editar" data-id="${esc(p.id)}">Alterar</button>` : ""}${!agente() && podeEditar(p) ? `<button class="btn btn-sm btn-outline-danger" data-action="cancelar" data-id="${esc(p.id)}">Cancelar</button>` : ""}${agente() && p.status === "Pendente" ? `<button class="btn btn-sm btn-primary" data-action="avaliar" data-id="${esc(p.id)}">Avaliar</button>` : ""}${p.status === "Aprovado" ? `<button class="btn btn-sm btn-success" data-action="contratar" data-id="${esc(p.id)}">${agente() ? "Gerar contrato" : "Confirmar contrato"}</button>` : ""}</div></td></tr>`;
					})
					.join("")}</tbody></table></div></div>`
	}`;
}
async function obterPedido(id) {
	const p = (await api("pedidos")).find((p) => String(p.id) === id);
	if (!p || !usuario) throw Error("Pedido não encontrado.");
	if (agente()) {
		const carro = (await api("carros")).find((c) => String(c.id) === String(p.carroId));
		if (!responsavel(carro)) throw Error("Somente a instituição responsável pelo veículo pode acessar este pedido.");
	} else if (String(p.clienteId) !== String(usuario.id)) {
		throw Error("Pedido não encontrado.");
	}
	return p;
}
async function detalhes(id, avaliar = false) {
	const p = await obterPedido(id),
		u = (await api("usuarios")).find(
			(u) => String(u.id) === String(p.clienteId),
		);
	app.innerHTML = `<h1>${avaliar ? "Avaliação financeira" : "Detalhes do pedido"}</h1><div class="card"><div class="card-body"><h2>${esc(u.nome)}</h2><p>RG: ${esc(u.rg)} · CPF: ${esc(u.cpf)}<br>Endereço: ${esc(u.endereco)}<br>Profissão: ${esc(u.profissao)}</p><h2>Rendimentos mensais</h2><ul>${(u.empregos || []).map((e) => `<li>${esc(e.empresa)}: ${dinheiro(e.renda)}</li>`).join("")}</ul><p>Período: ${dataBR(p.inicio)} a ${dataBR(p.fim)}<br>Total do aluguel: <strong>${dinheiro(p.total)}</strong><br>Tipo: ${p.tipoContrato === "credito" ? "Com crédito bancário" : "Aluguel simples"}</p><p>Situação: ${statusBadge(p.status)}</p>${p.parecer ? `<p>Parecer: ${esc(p.parecer)}</p>` : ""}${avaliar && agente() && p.status === "Pendente" ? `<form id="avaliacao" data-id="${esc(id)}"><label class="form-label" for="parecer">Parecer financeiro</label><textarea class="form-control mb-3" id="parecer" name="parecer" required maxlength="500"></textarea><button class="btn btn-success" name="decisao" value="Aprovado">Aprovar</button> <button class="btn btn-danger" name="decisao" value="Recusado">Recusar</button></form>` : ""}<button class="btn btn-outline-secondary mt-3" data-page="pedidos">Voltar aos pedidos</button></div></div>`;
}
async function contratoForm(id) {
	const p = await obterPedido(id);
	if (p.status !== "Aprovado") throw Error("O pedido deve estar aprovado.");
	const users = await api("usuarios");
	const carro = (await api("carros")).find((c) => String(c.id) === String(p.carroId));
	const proprietarios = users.filter((u) => String(u.id) === String(carro?.instituicaoId) && instituicao(u));
	app.innerHTML = `<h1>Confirmar contrato</h1><p class="text-secondary">Confira os dados antes de confirmar a execução do aluguel.</p><form id="contrato" data-id="${esc(id)}" class="card"><div class="card-body"><p>Período: ${dataBR(p.inicio)} a ${dataBR(p.fim)}<br>Valor total: <strong>${dinheiro(p.total)}</strong></p><div class="row g-3">${seletor(
		"proprietarioId",
		"Proprietário registrado",
		proprietarios.map((u) => [u.id, `${u.nome} (${tipoNome(u.tipo)})`]),
		carro?.instituicaoId,
	)}${
		p.tipoContrato === "credito"
			? seletor(
					"bancoId",
					"Instituição que concede o crédito",
					proprietarios.map((u) => [u.id, u.nome]),
				) +
				campo(
					"valorCredito",
					"Valor do crédito (R$)",
					"number",
					p.total,
					`required min="0.01" max="${p.total}" step="0.01"`,
				)
			: ""
	}</div><div class="form-check my-3"><input class="form-check-input" type="checkbox" required id="aceite"><label class="form-check-label" for="aceite">Confirmo os dados para registrar o contrato.</label></div><button class="btn btn-primary">Confirmar contrato</button> <button type="button" class="btn btn-outline-secondary" data-page="pedidos">Voltar</button></div></form>`;
}
async function contratos() {
	let [cs, ps, carros, users] = await Promise.all([
		api("contratos"),
		api("pedidos"),
		api("carros"),
		api("usuarios"),
	]);
	cs = cs.filter((c) =>
			ps.some(
				(p) =>
					String(p.id) === String(c.pedidoId) &&
					(agente() ? responsavel(carros.find((v) => String(v.id) === String(p.carroId))) : String(p.clienteId) === String(usuario.id)),
			),
		);
	app.innerHTML = `<h1>Contratos</h1><p class="text-secondary">Aluguéis confirmados após a aprovação financeira.</p>${
		!cs.length
			? '<div class="card p-4">Nenhum contrato registrado.</div>'
			: `<div class="row g-3">${cs
					.map((c) => {
						let p = ps.find((p) => String(p.id) === String(c.pedidoId)),
							v = carros.find((v) => String(v.id) === String(p?.carroId));
						return `<div class="col-md-6"><div class="card h-100"><div class="card-header">Contrato ${esc(c.numero)}</div><div class="card-body"><h2>${esc(v?.marca)} ${esc(v?.modelo)}</h2><p>Cliente: ${esc(users.find((u) => String(u.id) === String(p?.clienteId))?.nome)}<br>Período: ${dataBR(p?.inicio)} a ${dataBR(p?.fim)}<br>Proprietário: ${esc(users.find((u) => String(u.id) === String(c.proprietarioId))?.nome)}<br>Total: ${dinheiro(p?.total)}</p>${c.bancoId ? `<p class="small">Crédito: ${dinheiro(c.valorCredito)}<br>Instituição: ${esc(users.find((u) => String(u.id) === String(c.bancoId))?.nome)}</p>` : ""}<span class="badge text-bg-primary">Contrato registrado</span></div></div></div>`;
					})
					.join("")}</div>`
	}`;
}
// Verifica conflito apenas com pedidos aprovados ou contratados.
async function disponivel(carroId, inicio, fim, ignorar) {
	let ps = await api("pedidos");
	return !ps.some(
		(p) =>
			String(p.id) !== String(ignorar) &&
			String(p.carroId) === String(carroId) &&
			["Aprovado", "Contratado"].includes(p.status) &&
			inicio <= p.fim &&
			fim >= p.inicio,
	);
}
document.addEventListener("click", async (e) => {
	const el = e.target.closest("[data-page],[data-action]");
	if (!el) return;
	e.preventDefault();
	try {
		if (el.dataset.page) return await mostrar(el.dataset.page);
		const { action, id } = el.dataset;
		if (action === "sair") {
			await api("auth/logout", "POST", {});
			usuario = null;
			return mostrar("inicio");
		}
		if (!usuario) return mostrar("login");
		if (action === "novo") {
			if (agente()) return;
			return await pedidoForm(id);
		}
		if (action === "editar") return await pedidoForm(null, id);
		if (action === "detalhes") return await detalhes(id);
		if (action === "avaliar") {
			if (!agente()) throw Error("Somente agentes podem avaliar.");
			return await detalhes(id, true);
		}
		if (action === "contratar") return await contratoForm(id);
		if (action === "cancelar") {
			const p = await obterPedido(id);
			if (agente() || !podeEditar(p))
				throw Error("Não é possível cancelar esse pedido.");
			if (!confirm("Deseja cancelar este pedido?")) return;
			await api("pedidos", "PATCH", { status: "Cancelado" }, id);
			await mostrar("pedidos");
			mensagem("Pedido cancelado.");
		}
	} catch (err) {
		mensagem(err.message, true);
	}
});
document.addEventListener("submit", async (e) => {
	e.preventDefault();
	const form = e.target,
		btn = e.submitter;
	const f = Object.fromEntries(new FormData(form));
	if (btn) btn.disabled = true;
	try {
		if (form.id === "login") {
			usuario = await api("auth/login", "POST", { email: f.email.trim(), senha: f.senha });
			await mostrar("inicio");
		}
		if (form.id === "cadastro") {
			if (!usuario && !["instituicao", "cliente"].includes(f.tipo))
				throw Error("Selecione o tipo de usuário: Empresa / Banco ou Cliente.");
			const pessoaJuridica = ["instituicao", "empresa", "banco"].includes(usuario?.tipo || f.tipo);
			let empregos = [];
			for (let i = 0; !pessoaJuridica && i < 3; i++) {
				if (f["empresa" + i] || f["renda" + i]) {
					if (!f["empresa" + i]?.trim() || !(Number(f["renda" + i]) > 0))
						throw Error(
							"Preencha o empregador e um rendimento maior que zero.",
						);
					empregos.push({
						empresa: f["empresa" + i].trim(),
						renda: Number(f["renda" + i]),
					});
				}
			}
			const dados = {
				nome: f.nome.trim(),
				email: f.email.trim().toLowerCase(),
				...(!pessoaJuridica ? { rg: (f.rg || "").trim(), cpf: f.cpf || "", profissao: (f.profissao || "").trim() } : {}),
				endereco: f.endereco.trim(),
				empregos,
			};
			if (!dados.nome) throw Error("Informe o nome.");
			if (usuario) {
				usuario = await api("usuarios", "PATCH", dados, usuario.id);
				await mostrar("perfil");
				mensagem("Cadastro atualizado.");
			} else {
				await api("usuarios", "POST", {
					...dados,
					senha: f.senha,
					tipo: f.tipo,
				});
				await mostrar("login");
				mensagem("Cadastro realizado! Entre com seu e-mail e senha.");
			}
		}
		if (form.id === "carro") {
			if (!agente()) throw Error("Somente empresas / bancos podem cadastrar carros.");
			await api("carros", "POST", { ...f, ano: Number(f.ano), diaria: Number(f.diaria) });
			await mostrar("carros");
			mensagem("Carro cadastrado para sua instituição.");
		}
		if (form.id === "pedido") {
			const id = form.dataset.id,
				p = id ? await obterPedido(id) : null;
			if (p && !podeEditar(p)) throw Error("Pedido não pode ser alterado.");
			if (!p && agente()) throw Error("Somente clientes podem criar pedidos.");
			const dono = p
				? (await api("usuarios")).find(
						(u) => String(u.id) === String(p.clienteId),
					)
				: usuario;
			if (
				!dono.rg ||
				!dono.cpf ||
				!dono.endereco ||
				!dono.profissao ||
				!dono.empregos?.length
			)
				throw Error(
					"Complete os dados pessoais e a renda em Meu cadastro antes de solicitar.",
				);
			if (f.inicio < hoje() || f.fim < f.inicio)
				throw Error("Informe um período válido a partir de hoje.");
			if (!(await disponivel(f.carroId, f.inicio, f.fim, id)))
				throw Error(
					"Este carro já está reservado nesse período. Escolha outras datas.",
				);
			const c = (await api("carros")).find((c) => String(c.id) === f.carroId);
			const dias =
				Math.round((Date.parse(f.fim) - Date.parse(f.inicio)) / 86400000) + 1;
			await api(
				"pedidos",
				id ? "PATCH" : "POST",
				{
					...f,
					clienteId: dono.id,
					total: dias * c.diaria,
					status: "Pendente",
					parecer: "",
					avaliadorId: null,
				},
				id,
			);
			await mostrar("pedidos");
			mensagem("Pedido enviado para análise.");
		}
		if (form.id === "avaliacao") {
			if (!agente()) throw Error("Acesso restrito aos agentes.");
			const p = await obterPedido(form.dataset.id);
			if (p.status !== "Pendente") throw Error("Este pedido já foi avaliado.");
			if (!f.parecer.trim()) throw Error("Escreva o parecer.");
			const status = btn?.value;
			if (!["Aprovado", "Recusado"].includes(status)) throw Error("Decisão inválida.");
			if (
				status === "Aprovado" &&
				!(await disponivel(p.carroId, p.inicio, p.fim, p.id))
			)
				throw Error("O carro já está reservado nesse período.");
			await api(
				"pedidos",
				"PATCH",
				{ status, parecer: f.parecer.trim(), avaliadorId: usuario.id },
				p.id,
			);
			await mostrar("pedidos");
			mensagem("Avaliação registrada.");
		}
		if (form.id === "contrato") {
			const p = await obterPedido(form.dataset.id);
			if (p.status !== "Aprovado")
				throw Error("O pedido precisa estar aprovado.");
			if (!(await disponivel(p.carroId, p.inicio, p.fim, p.id)))
				throw Error("Veículo indisponível nesse período.");
			const existentes = await api("contratos");
			if (existentes.some((c) => String(c.pedidoId) === String(p.id)))
				throw Error("Este pedido já tem contrato.");
			const carro = (await api("carros")).find((c) => String(c.id) === String(p.carroId));
			if (!carro?.instituicaoId || String(f.proprietarioId) !== String(carro.instituicaoId))
				throw Error("A instituição responsável pelo veículo deve constar no contrato.");
			if (p.tipoContrato === "credito" &&
				(String(f.bancoId) !== String(carro.instituicaoId) || !(Number(f.valorCredito) > 0) || Number(f.valorCredito) > p.total))
				throw Error("Informe a instituição responsável e um crédito válido.");
			await api("contratos", "POST", {
				pedidoId: p.id,
				numero: "CT-" + String(existentes.length + 1).padStart(4, "0"),
				proprietarioId: f.proprietarioId,
				bancoId: f.bancoId || null,
				valorCredito: Number(f.valorCredito) || 0,
				data: hoje(),
			});
			await mostrar("contratos");
			mensagem("Contrato registrado com sucesso.");
		}
	} catch (err) {
		mensagem(err.message, true);
	} finally {
		if (btn) btn.disabled = false;
	}
});
document.querySelector("#brand").onclick = (e) => {
	e.preventDefault();
	mostrar().catch((err) => mensagem(err.message, true));
};
iniciar().catch((err) => mensagem(err.message, true));
