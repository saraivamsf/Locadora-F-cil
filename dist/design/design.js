const primary = [
	['primary.50', '#eaf1fc'], ['primary.100', '#cfe2ff'],
	['primary.200', '#9ec5fe'], ['primary.300', '#6ea8fe'],
	['primary.400', '#3d8bfd'], ['primary.500', '#0d6efd'],
	['primary.600', '#0b5ed7'], ['primary.700', '#0b57c4'],
	['primary.800', '#084298'], ['primary.900', '#052c65'],
];
const neutral = [
	['neutral.0', '#ffffff'], ['neutral.50', '#f5f6f8'],
	['neutral.100', '#f0f3f7'], ['neutral.200', '#e2e8f0'],
	['neutral.300', '#c9d6e8'], ['neutral.400', '#abb9cc'],
	['neutral.500', '#69778a'], ['neutral.600', '#526176'],
	['neutral.700', '#344257'], ['neutral.800', '#283342'],
	['neutral.900', '#182230'], ['neutral.950', '#101722'],
];
const statuses = [
	['Sucesso / Aprovado', '#198754'], ['Atenção / Pendente', '#ffc107'],
	['Erro / Recusado', '#dc3545'], ['Neutro / Cancelado', '#6c757d'],
];
function renderPalette(id, colors) {
	const container = document.getElementById(id);
	for (const [name, hex] of colors) {
		const card = document.createElement('div');
		card.className = 'color-card';
		const swatch = document.createElement('div');
		swatch.className = 'color-swatch';
		swatch.style.backgroundColor = hex;
		swatch.setAttribute('aria-hidden', 'true');
		const label = document.createElement('span');
		label.className = 'color-name';
		label.textContent = name;
		const code = document.createElement('code');
		code.className = 'color-code';
		code.textContent = hex.toUpperCase();
		card.append(swatch, label, code);
		container.append(card);
	}
}
renderPalette('primary-palette', primary);
renderPalette('neutral-palette', neutral);
renderPalette('status-palette', statuses);

const tokens = [
	['bg.page', 'Plano de fundo da página.', '#f5f6f8', '#101722'],
	['bg.surface', 'Cards, painéis e cabeçalho.', '#ffffff', '#182230'],
	['bg.surface-2', 'Áreas internas e camadas secundárias.', '#f0f3f7', '#223044'],
	['bg.primary', 'Botão principal e seção selecionada.', '#0d6efd', '#0d6efd'],
	['bg.primary-subtle', 'Destaques suaves e avatar da conta.', '#eaf1fc', '#1c3558'],
	['text.primary', 'Títulos e conteúdo principal.', '#283342', '#f5f6f8'],
	['text.secondary', 'Textos de apoio e navegação.', '#526176', '#abb9cc'],
	['text.brand', 'Links e destaques da identidade.', '#0b57c4', '#8bb9fe'],
	['border.default', 'Bordas de navegação e contêineres.', '#e2e8f0', '#344257'],
	['border.strong', 'Separações com maior destaque.', '#c9d6e8', '#526176'],
	['border.brand', 'Foco em elementos interativos.', '#0b57c4', '#8bb9fe'],
	['interactive.hover', 'Estado hover do botão principal.', '#0b5ed7', '#3d8bfd'],
	['interactive.press', 'Estado pressionado do botão principal.', '#0a58ca', '#6ea8fe'],
];
const rows = document.getElementById('token-rows');
for (const [name, description, light, dark] of tokens) {
	const row = document.createElement('tr');
	const nameCell = document.createElement('td');
	const code = document.createElement('code');
	code.textContent = name;
	nameCell.append(code);
	const descriptionCell = document.createElement('td');
	descriptionCell.textContent = description;
	row.append(nameCell, descriptionCell);
	for (const color of [light, dark]) {
		const cell = document.createElement('td');
		const group = document.createElement('span');
		group.className = 'token-color';
		const dot = document.createElement('span');
		dot.className = 'token-dot';
		dot.style.backgroundColor = color;
		dot.setAttribute('aria-hidden', 'true');
		const value = document.createElement('code');
		value.textContent = color.toUpperCase();
		group.append(dot, value);
		cell.append(group);
		row.append(cell);
	}
	rows.append(row);
}

for (const size of [4, 8, 12, 16, 24, 32, 48, 64]) {
	const item = document.createElement('div');
	item.className = 'space-item';
	const bar = document.createElement('span');
	bar.className = 'space-bar';
	bar.style.height = `${size}px`;
	bar.setAttribute('aria-hidden', 'true');
	const label = document.createElement('code');
	label.textContent = `${size}px`;
	item.append(bar, label);
	document.getElementById('spacing-scale').append(item);
}
for (const [size, use] of [[4, 'Campos'], [6, 'Hero'], [8, 'Sair'], [10, 'Navegação'], [999, 'Avatar']]) {
	const item = document.createElement('div');
	item.className = 'radius-item';
	const shape = document.createElement('div');
	shape.className = 'radius-shape';
	shape.style.borderRadius = `${size}px`;
	shape.setAttribute('aria-hidden', 'true');
	const code = document.createElement('code');
	code.textContent = `${size}px`;
	const label = document.createElement('span');
	label.textContent = use;
	item.append(shape, code, label);
	document.getElementById('radius-scale').append(item);
}

const toggle = document.querySelector('.theme-toggle');
function updateThemeControl() {
	const dark = document.documentElement.dataset.theme === 'dark';
	toggle.setAttribute('aria-pressed', String(dark));
	toggle.setAttribute('aria-label', dark ? 'Ativar tema claro' : 'Ativar tema escuro');
	toggle.querySelector('.theme-label').textContent = dark ? 'Tema claro' : 'Tema escuro';
}
updateThemeControl();
toggle.addEventListener('click', () => {
	const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
	document.documentElement.dataset.theme = next;
	try { localStorage.setItem('locadora-facil.design.theme', next); } catch {}
	updateThemeControl();
});
