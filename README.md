# Locadora Fácil

Protótipo acadêmico simples com HTML5, CSS3, JavaScript, Bootstrap 5 e Fetch API. Não usa React nem ferramentas de compilação.

## Como executar

Instale o Node.js e as ferramentas globais uma vez no computador:

```sh
npm install -g http-server@14.1.1 concurrently@8.2.2
```

Depois, dentro da pasta do projeto, execute:

```sh
npm start
```

Não é necessário executar `npm install` dentro deste projeto. As ferramentas são encontradas pelo terminal na instalação global, sem uma pasta `node_modules` local. Use as versões indicadas para manter a compatibilidade.

Abra http://localhost:3000. A API Node.js roda em http://localhost:3001 e persiste os dados em `db.json`. Os dois serviços devem continuar abertos. A interface carrega Bootstrap pela internet. O login e a aba aberta são restaurados ao recarregar a página no mesmo navegador; use **Sair** para encerrar a sessão. Apenas o ID da conta e o nome da aba são salvos no armazenamento local, e a conta é consultada novamente na API. A autenticação usa um cookie HttpOnly, com duração de sete dias. Reiniciar a API encerra as sessões existentes.

## Contas fictícias

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Cliente | cliente@teste.com | 123456 |
| Empresa / Banco | empresa@teste.com | 123456 |
| Empresa / Banco | banco@teste.com | 123456 |

Também é possível cadastrar novas contas, inclusive empresas e bancos, para testar os perfis no laboratório. Não insira dados pessoais reais.

## Fluxo para apresentar

1. Entre como cliente e confira **Meu cadastro**. É possível informar até três empregadores e respectivas rendas.
2. Abra **Carros**, escolha um veículo e solicite um período a partir da data atual. As datas de retirada e devolução são cobradas: um aluguel com retirada e devolução no mesmo dia custa uma diária.
3. Em **Meus pedidos**, consulte os detalhes, altere ou cancele uma solicitação. Uma alteração exige nova avaliação.
4. Entre como **Empresa / Banco**. Em **Carros**, use **Adicionar carro**. A instituição da conta é vinculada automaticamente ao veículo e seu nome aparece para o cliente. Em **Pedidos**, a instituição vê somente solicitações dos seus próprios veículos e pode aprovar ou recusar com um parecer. Os quatro carros iniciais pertencem à Locadora Exemplo; as contas antigas de empresa e banco agora usam o mesmo perfil.
5. O cliente confirma um pedido aprovado, ou a instituição responsável gera o contrato. A instituição proprietária do veículo é fixa. No contrato com crédito, a própria instituição responsável concede o valor informado. Outra instituição não consegue avaliar, visualizar detalhes ou gerar contratos desse veículo, inclusive pela API.
6. Confira o registro em **Contratos**. Após a contratação, o pedido não pode ser alterado ou cancelado por este protótipo.

Pedidos aprovados e contratados bloqueiam o veículo no período. Pedidos pendentes não reservam o carro. A verificação é repetida na aprovação e na contratação.

## Organização

- `dist/index.html`: estrutura da página e navegação.
- `dist/style.css`: pequenos ajustes visuais sobre Bootstrap.
- `dist/app.js`: construção dinâmica das telas, validações, perfis e chamadas Fetch.
- `server.cjs`: API com sessão, cadastro de veículos e verificação de propriedade em pedidos e contratos.
- `db.json`: dados locais da aplicação.
- `dist/images/carros/`: fotos locais dos veículos, associadas aos modelos em `dist/app.js`.

A API Node.js consulta e salva os dados em `db.json`, sem dependências adicionais. Pare o processo antigo do JSON Server antes de iniciar a nova API com `npm start`. Se a API estiver fora do ar, a interface exibe uma mensagem de erro.

## Limitações do laboratório

As permissões são verificadas na API usando a sessão e a instituição vinculada ao carro. As senhas permanecem em texto no banco de demonstração; use apenas contas fictícias. As sessões ficam na memória do servidor e expiram em sete dias ou ao reiniciar a API. Não há pagamento, assinatura digital, consulta financeira externa nem concessão bancária real. O projeto é voltado à apresentação acadêmica e usa arquivo JSON local, sem suporte a múltiplos processos de API.
