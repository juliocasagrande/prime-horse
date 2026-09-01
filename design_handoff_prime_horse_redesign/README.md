# Handoff: Redesign do Prime Horse (Gestão de Estoque)

## Overview
Redesign visual e de UX do sistema Prime Horse (controle de estoque de haras) já existente no repositório `juliocasagrande/prime-horse` (React + Vite no front-end, Node/Supabase no back-end). Este é a segunda iteração do redesign, elevando o acabamento visual (inspirado em dashboards admin como Horizon UI e Sales Dashboard, mantendo a paleta de marca creme/marrom original): (1) sidebar com gradiente escuro marrom e item ativo em gradiente; (2) painel geral mais denso, com gráfico de barras de movimentações recentes e gráfico de distribuição de itens por categoria, além dos cards de KPI com ícone; (3) cards com header em faixa de cor sutil (tint marrom claro) separado do corpo; (4) tela de login em duas colunas, com painel de marca à esquerda (gradiente escuro + destaques do produto) e formulário à direita; (5) micro-interações de hover em botões, linhas de tabela e cards; (6) wizards multi-etapas e modais para os fluxos de cadastro; (7) navegação mobile com navbar flutuante inferior; (8) dropdowns customizados em vez do `<select>` nativo.

## About the Design Files
O arquivo incluído (`prime-horse-redesign.dc.html`) é uma **referência de design em HTML** — um protótipo interativo que mostra a aparência e o comportamento pretendidos, não é código de produção para copiar diretamente. A tarefa é **recriar este design dentro do código React existente** em `web/src/` (componentes, páginas, layouts e contexts já estabelecidos no projeto), usando os padrões já adotados no repositório (React Router, Supabase client, contexts de auth, etc.) — não substituir a stack por algo novo.

## Fidelity
**Alta fidelidade (hifi)**: cores, tipografia, espaçamentos e a maior parte dos textos/estados já estão definidos e devem ser recriados com precisão. Os dados mostrados no protótipo (itens, movimentações, usuários) são **dados de exemplo fictícios** — no app real eles continuam vindo do Supabase, como já implementado.

## Design Tokens

### Cores (todas definidas em OKLCH; converter para hex conforme a stack de estilo do projeto)
- Fundo geral: `oklch(97% 0.008 75)` — creme muito claro
- Sidebar (desktop) e painel de marca do login: gradiente escuro marrom `linear-gradient(160deg, oklch(24% 0.045 43) 0%, oklch(17% 0.035 42) 55%, oklch(11% 0.02 40) 100%)`, texto em tons claros quentes (`oklch(70–90% 0.02 55)`), item de navegação ativo com gradiente `linear-gradient(135deg, oklch(52% 0.11 45), oklch(38% 0.1 40))`
- Header de cards (faixa sutil dentro do card, separada do corpo por borda): `oklch(96% 0.025 45)` — mesmo tom de tabela/cabeçalhos de coluna
- Superfícies (corpo dos cards, tabelas, modais): `oklch(100% 0 0)` (branco puro), borda `oklch(90% 0.012 70)`
- Texto principal: `oklch(27% 0.02 50)` · Texto secundário: `oklch(52% 0.02 55)` · Texto muted: `oklch(62% 0.015 55)`
- Cor primária (botões, links, item ativo do menu, foco): `oklch(40% 0.09 43)` — marrom bem definido; hover `oklch(34% 0.09 43)`; tint claro para fundos: `oklch(94% 0.03 45)`
- Status **normal/ok**: verde `oklch(55% 0.13 148)`, fundo tint `oklch(94% 0.045 148)`, texto `oklch(38% 0.1 148)`
- Status **atenção/estoque baixo**: laranja `oklch(60% 0.16 55)`, fundo tint `oklch(94% 0.06 55)`, texto `oklch(48% 0.15 55)`
- Status **negativo/erro**: vermelho `oklch(55% 0.19 25)`, fundo tint `oklch(94% 0.06 25)`, texto `oklch(45% 0.19 25)`

### Tipografia
- Títulos: **Lora** (serifada), pesos 500/600/700
- Corpo/UI: **Poppins**, pesos 400/500/600/700
- Escala: título de página 28px/700 (Lora) · título de card 16–18px/600 (Lora) · corpo 13–14px · legendas/labels 11–12.5px

### Outros
- Border radius: 7–8px em inputs/botões/dropdowns, 10–14px em cards e modais, 100px (pill) em badges e botões da navbar mobile
- Sombra de modal: `0 20px 50px -12px oklch(20% 0.02 50 / 0.35)`
- Sombra da navbar mobile flutuante: `0 8px 24px -8px oklch(30% 0.03 60 / 0.28)`

## Layout geral
- **Desktop (>900px)**: sidebar fixa de 244px à esquerda (gradiente escuro), topbar branca no topo (status online, seletor "visualizar como" para demonstrar perfis, nome + badge de perfil do usuário, botão Sair), conteúdo à direita com padding 28px/32px.
- **Mobile (≤900px)**: sidebar oculta; navbar flutuante fixa na parte inferior, centralizada horizontalmente, formato pill, com os mesmos ícones da sidebar (sem rótulo de texto); conteúdo ocupa 100% da largura com padding reduzido (16px) e `padding-bottom` extra para não ficar sob a navbar.
- Grids responsivos: cards de estatísticas do painel (4 colunas → 2 no mobile), grid de gráficos 1.7fr/1fr (→ 1 coluna no mobile), grid de 2 colunas dos formulários/listas (→ 1 no mobile), grid de 3 colunas de Configurações (→ 1 no mobile).
- Cards com título (painel geral e configurações) usam header próprio: faixa com tint sutil + borda inferior, corpo com padding separado — não é mais um único bloco de padding uniforme.

## Navegação (sidebar / navbar mobile)
6 itens, cada um com ícone (SVG de traços simples, 24×24, `stroke-width:1.8`) à esquerda do texto:
1. Painel geral — ícone grade (4 quadrados)
2. Itens de estoque — ícone caixa
3. Entrada & Saída — ícone duas setas opostas
4. Central de notificações — ícone sino
5. Usuários — ícone duas pessoas *(visível apenas para perfil Administrador)*
6. Configurações — ícone engrenagem *(visível apenas para perfil Administrador)*

Item ativo: fundo marrom primário (`oklch(40% 0.09 43)`), texto branco, peso 600. Itens inativos: texto marrom escuro neutro, peso 500.

## Perfis e permissões (já especificados em `prime-horse-estoque-spec.md` do repo)
- **Administrador**: acesso total — cria/edita/exclui itens, categorias, locais, unidades, usuários; único que vê Usuários e Configurações.
- **Operador de campo**: só registra movimentações (entrada/saída); não vê botões de criar/editar/excluir itens, nem as telas Usuários/Configurações.
- **Financeiro**: somente leitura em tudo — todos os botões de ação ficam ocultos; mostrar badge "Modo somente leitura" nas telas com CRUD.
- O protótipo inclui um seletor "Visualizar como" na topbar só para fins de demonstração dos 3 perfis — **não portar esse seletor para produção**; em produção o perfil vem do usuário autenticado.

## Telas

### 1. Login / Primeiro acesso
- Layout em duas colunas (a coluna de marca oculta em mobile, ≤900px): à esquerda, painel de gradiente escuro com logo, headline "Controle total do seu estoque, em um só painel." e 3 destaques do produto (ícone check + texto); à direita, formulário centralizado (max-width 400px) com e-mail/senha, link "Esqueci minha senha", e os 2 botões de demonstração.
- Fluxo real de autenticação (Supabase Auth) permanece; o protótipo mostra apenas o layout.
- **Primeiro acesso**: ao logar por a primeira vez (senha temporária), abrir automaticamente o wizard "Primeiro acesso" (ver seção Wizards) por cima do painel, bloqueando o uso até a senha ser trocada.

### 2. Painel geral
- Cabeçalho com título + botão "Ativar notificações push" (estado ativo muda cor/ícone para check).
- 4 cards de estatística, cada um com chip de ícone (24–34px, fundo tint da cor do indicador) acima do número: Itens cadastrados, Usuários ativos, Itens em atenção (laranja), Itens com saldo negativo (vermelho). Hover eleva o card (leve translateY + sombra maior).
- Linha de gráficos (grid 1.7fr/1fr): "Movimentações recentes" — gráfico de barras (últimas 6 movimentações, altura proporcional à quantidade, verde = entrada / marrom = saída, com legenda) — e "Itens por categoria" — barras horizontais de proporção por categoria.
- 2 cards lado a lado: "Últimas movimentações" (últimas 5, com badge de tipo) e "Itens em estoque baixo" (itens com status ≠ normal, com badge de status). Ambos com estado vazio ("Nenhuma movimentação ainda." / "Tudo certo por aqui.") quando a lista está vazia.

### 3. Itens de estoque
- Botão "+ Novo item" (só Administrador) abre o wizard de criação.
- Busca por nome (input com ícone de lupa).
- Tabela: Nome, Categoria, Local, Qtd., Status (badge colorido), Ações (Editar → modal simples; Excluir → modal de confirmação). Ações ocultas para não-administradores.

### 4. Entrada & Saída
- Botão "+ Nova movimentação" (Administrador e Operador) abre o wizard de movimentação.
- Tabela de histórico: Item, Tipo (badge), Quantidade, Saldo resultante (vermelho e em negrito se negativo), Motivo, Responsável, Data.
- Regra de negócio: **uma saída nunca é bloqueada por deixar saldo negativo** — é registrada normalmente e sinalizada visualmente (mesma regra do spec original).

### 5. Central de notificações
- Lista do histórico de alertas (ícone de sino + mensagem + data), gerados automaticamente quando uma movimentação cruza o limite mínimo ou deixa o saldo negativo.
- Mesmo botão de push notifications do painel.

### 6. Usuários (Administrador)
- Botão "+ Novo usuário" abre wizard.
- Tabela: Nome, E-mail, Perfil (dropdown customizado, edição inline), Status (badge), Ações (Ativar/Inativar, Redefinir senha → modal de confirmação).

### 7. Configurações (Administrador)
- 3 cards: Categorias, Locais de armazenamento, Unidades de medida — cada um é uma lista aberta com Editar (modal simples) / Excluir (modal de confirmação) por item, e um input + botão "Adicionar" no final.

## Wizards (multi-etapas, em modal)
Estrutura comum: modal centralizado (max-width 560px), cabeçalho com título + botão fechar (X), stepper horizontal (bolinhas numeradas conectadas por linha — completo = marrom com check, atual = contorno marrom, futuro = cinza claro) com rótulo de cada etapa abaixo, corpo com o formulário da etapa atual, rodapé com "Voltar" (exceto na 1ª etapa) e botão primário que avança ou finaliza (desabilitado até os campos obrigatórios da etapa serem preenchidos).

1. **Novo item de estoque** (4 etapas): Identificação (nome, categoria, local) → Quantidades (unidade — dropdown com opção "Outra" para digitar — quantidade atual, quantidade mínima de alerta) → Detalhes opcionais (validade, fornecedor, preço de custo) → Revisão (resumo + botão "Criar item").
2. **Nova movimentação** (3 etapas): Item e tipo (dropdown de item + saldo atual exibido + seletor Entrada/Saída) → Quantidade e motivo (motivo é obrigatório) → Revisão (resumo + saldo novo calculado + aviso colorido se o saldo ficar negativo ou abaixo do mínimo + botão "Registrar movimentação").
3. **Novo usuário** (3 etapas): Dados (nome, e-mail) → Perfil (3 cards clicáveis com a descrição de cada perfil) → Revisão (resumo + senha temporária gerada, exibida em monospace, com aviso de troca obrigatória no primeiro acesso).
4. **Primeiro acesso** (2 etapas, sem opção de fechar/cancelar): Nova senha (nova senha + confirmação, validação de tamanho mínimo 6 e senhas coincidentes) → Concluído (tela de sucesso com ícone de check e botão "Ir para o painel").

## Modais simples (uma tela)
- **Editar item**: nome, quantidade atual, quantidade mínima, fornecedor — Cancelar / Salvar alterações.
- **Editar categoria/local/unidade**: campo de nome único — Cancelar / Salvar.
- **Confirmação genérica** (excluir item/categoria/local/unidade/usuário, redefinir senha): título + mensagem + Cancelar / botão de ação (vermelho para exclusão, marrom para as demais ações).

## Dropdowns customizados
Todos os `<select>` foram substituídos por um componente próprio (trigger + painel de opções abaixo, clique fora fecha o painel) para não exibir o menu nativo do navegador — usados no seletor de perfil da topbar, no perfil de cada usuário na tabela, e nos selects de categoria/local/unidade/item dentro dos wizards. Estilo do trigger: borda 1px `oklch(88% 0.012 70)`, radius 8px, chevron SVG simples (não a seta nativa do OS). Painel: fundo branco, mesma borda, sombra, opção selecionada com fundo tint marrom claro.

## Toasts
Toast de confirmação no canto inferior direito: cartão branco, borda esquerda verde de 4px, ícone de check em círculo verde claro, some automaticamente após ~2.6s. Usado após: criar/editar/excluir item, registrar movimentação, criar usuário, salvar configurações, ativar/desativar push.

## Interações & Estados
- Animações: fade-in no backdrop dos modais (~150ms), slide-up + fade no card do modal (~180ms).
- Todos os botões primários desabilitados (cinza, cursor not-allowed) até a validação da etapa atual passar.
- Badges de status calculados por regra: `qty < 0` → Negativo (vermelho); `qty <= minQty` → Estoque baixo (laranja); caso contrário → Normal (verde).

## State Management (equivalente ao protótipo, adaptar para o codebase real)
- Usuário autenticado + perfil (já existe via Supabase Auth/contexts no repo).
- Estado de navegação (tela atual).
- Estado do wizard aberto: tipo, etapa atual, dados do formulário.
- Estado do modal aberto: tipo, payload (id do item/entidade em edição).
- Listas de categorias, locais, unidades, itens, movimentações, usuários, notificações — no app real, vêm do Supabase (tabelas já existentes: `items`, `movements`, `users`/`profiles`, `categories`, `locations`, `units`, `notifications` — ver `supabase/migrations/0001_schema.sql`).
- Dropdown customizado: apenas 1 estado global de "qual dropdown está aberto" (chave única por dropdown) é suficiente.

## Assets
Nenhuma imagem externa — apenas ícones SVG de traço simples desenhados inline (grade, caixa, setas, sino, pessoas, engrenagem, lupa, lápis, lixeira, X, check, triângulo de alerta, cavalo estilizado para o logo). Todos podem ser recriados como componentes de ícone SVG no projeto ou substituídos por uma biblioteca de ícones já usada no repo, mantendo o traço fino (`stroke-width` ~1.8–2.2) e o estilo geométrico simples. Os gráficos de barras do painel geral são construídos só com `div`s (largura/altura percentual) — não usam biblioteca de charts; ao implementar no codebase real, usar a lib de gráficos já adotada no repo (ou Recharts/Chart.js) alimentada pelos dados reais do Supabase, mantendo a mesma leitura visual.

## Files
- `prime-horse-redesign.dc.html` — protótipo interativo completo (todas as telas, wizards, modais e o comportamento de navegação/permissões descritos acima). Abrir em um navegador para ver e testar todos os fluxos antes de implementar.
- Repositório de origem: `juliocasagrande/prime-horse` (branch `main`) — ver especialmente `prime-horse-estoque-spec.md` (regras de negócio e modelo de dados) e `supabase/migrations/0001_schema.sql` (schema real do banco) para a implementação dos dados reais por trás desta UI.
