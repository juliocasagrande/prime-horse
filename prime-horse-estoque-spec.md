# Prime Horse — Sistema de Gestão e Controle de Estoque

Especificação funcional e técnica para desenvolvimento do sistema. Este
documento é a fonte de verdade do escopo combinado com a cliente (Neiliane,
Prime Horse — haras de quarto de milha) e deve guiar todas as decisões de
implementação.

## 1. Contexto e objetivo

A Prime Horse hoje controla o estoque (feno, insumos e medicamentos) por
planilha de Excel. O objetivo é substituir esse controle por um sistema web,
multiusuário, com controle de entrada/saída, alertas de estoque baixo e
acesso tanto pelo computador (uso principal) quanto pelo celular (PWA
instalável).

**Fora do escopo desta primeira versão (não implementar):**
- Integração com sistemas financeiros ou emissão de nota fiscal.
- Relatórios financeiros ou cálculo de valor total do estoque.
- Múltiplas fazendas/contas — é uma instância única para a Prime Horse.
- Treinamento em vídeo ou onboarding guiado dentro do produto.

## 2. Stack técnica

- **Frontend:** React (Vite), PWA (manifest + service worker, instalável em
  computador e celular).
- **Backend/API:** Node.js.
- **Banco de dados e autenticação:** Supabase (Postgres + Auth + Row Level
  Security para as permissões por perfil).
- **Hospedagem:** Railway.
- **Notificações push:** Web Push (VAPID) via service worker.
- **Infraestrutura:** criar um **projeto novo** no Supabase e um **projeto
  novo** no Railway, específicos para este sistema — não reaproveitar
  projetos existentes de outros produtos.
- Priorizar sempre que possível permanecer dentro do free tier de cada
  serviço, deixando a arquitetura pronta para upgrade caso o uso cresça.

## 3. Perfis de usuário e permissões

| Perfil | Acesso |
|---|---|
| **Administrador** | Acesso total: cadastra/edita/exclui itens, categorias, locais, unidades de medida, usuários e limites de alerta. Pode redefinir a senha de qualquer usuário. |
| **Operador de campo** | Só pode registrar movimentações de entrada e saída. Não cadastra itens, locais nem usuários. |
| **Financeiro** | Acesso somente leitura: visualiza itens, estoque atual e histórico de movimentações. Não realiza nenhuma ação de escrita. |

Regras adicionais:
- Só o Administrador cadastra novos usuários no sistema (não há
  autocadastro).
- No primeiro acesso, o usuário é obrigado a definir sua própria senha
  (a senha inicial gerada pelo Administrador é temporária).
- O Administrador pode forçar a redefinição de senha de qualquer usuário a
  qualquer momento.

## 4. Autenticação

- E-mail + senha (Supabase Auth).
- Fluxo de "esqueci minha senha" com recuperação por e-mail incluído nesta
  primeira versão.
- Fluxo de primeiro acesso: Administrador cadastra o usuário com uma senha
  temporária → usuário loga → sistema obriga a troca de senha antes de
  liberar o uso.

## 5. Modelo de dados (visão funcional)

### 5.1 Itens de estoque
Campos:
- Nome (texto, obrigatório)
- Categoria (select, configurável — ver 6.1)
- Local de armazenamento (select, configurável — ver 6.2)
- Unidade de medida (select com opções pré-definidas + opção de digitar
  texto livre — ver 6.3)
- Quantidade atual (numérico)
- Quantidade mínima de alerta (numérico, definido individualmente por
  item — ver 6.4)
- Validade (data, opcional — relevante para medicamentos)
- Fornecedor (texto, opcional)
- Preço de custo (numérico, opcional)

### 5.2 Movimentações (entrada/saída)
Campos:
- Item (referência)
- Tipo (Entrada ou Saída)
- Quantidade
- Data/hora
- Responsável (usuário logado)
- Motivo/observação (texto curto, obrigatório — ex: "uso veterinário",
  "perda", "compra mensal")

Regra de negócio importante: **o sistema não deve bloquear uma saída que
deixaria o estoque negativo.** Ele deve registrar normalmente e exibir um
alerta visual destacando que o item ficou com saldo negativo, já que isso
indica um erro de lançamento anterior que precisa ser investigado (e não uma
situação a ser escondida ou impedida).

### 5.3 Usuários
Campos: nome, e-mail, perfil (Administrador / Operador de campo /
Financeiro), status (ativo/inativo).

## 6. Configurações administráveis (somente Administrador)

Tudo abaixo deve ser cadastrado/editado pelo próprio Administrador dentro do
sistema, sem depender de alteração de código:

1. **Categorias de item** — lista aberta, o Administrador cria quantas
   quiser (ex: Feno, Insumo, Medicamento, e outras que surgirem).
2. **Locais de armazenamento** — lista aberta, sem limite de cadastro (ex:
   Galpão A, Galpão B, Depósito, Farmácia, e novos que forem necessários).
3. **Unidades de medida** — combobox com as unidades mais comuns
   pré-cadastradas (ex: fardo, kg, litro, unidade, saco) e opção de digitar
   uma unidade personalizada na hora do cadastro do item.
4. **Quantidade mínima de alerta** — configurável individualmente por item
   (não é um valor único global); quando o estoque atual ficar igual ou
   abaixo desse valor, o item entra em "estoque baixo".
5. **Usuários do sistema** — cadastro, edição, inativação e redefinição de
   senha.

## 7. Alertas e notificações push

- Quando a quantidade atual de um item atinge ou fica abaixo da quantidade
  mínima definida para ele, o item deve aparecer destacado como
  "Estoque baixo" no painel e na listagem de itens.
- Implementar notificações push completas (Web Push/VAPID) para avisar a
  equipe quando um item entra em estado de estoque baixo, mesmo com o
  sistema fechado — incluindo:
  - Solicitação de permissão de notificação no navegador/PWA.
  - Registro e gerenciamento de subscriptions por usuário.
  - Envio do push no momento em que o item cruza o limite mínimo.
  - Tela/central de notificações dentro do sistema, com histórico dos
    alertas já enviados.

## 8. PWA e uso offline

- Aplicação instalável tanto no computador (funciona como programa,
  acessado pelo navegador) quanto no celular (instalável como aplicativo).
- Sempre que possível, implementar funcionamento offline:
  - Cache local (service worker) das telas e dos dados mais recentes de
    estoque para consulta sem internet.
  - Fila local de movimentações registradas offline, sincronizada
    automaticamente com o servidor assim que a conexão voltar.
  - Indicador visual de status de conexão (online/offline/sincronizando).
- Caso alguma funcionalidade não seja tecnicamente viável de funcionar 100%
  offline (ex: push notifications, gestão de usuários), deixar isso
  explícito para a cliente, priorizando que ao menos a consulta ao estoque e
  o registro de movimentações funcionem offline.

## 9. Identidade visual

Manter a paleta em tons de marrom pastel/dourado já usada no protótipo, mas
com **melhor diferenciação entre os elementos** (o protótipo anterior ficou
com tons muito parecidos entre si, gerando confusão visual). Diretrizes:

- **Fundo geral:** branco/creme bem claro.
- **Superfícies (cards, tabelas):** branco, com bordas sutis, para se
  destacar do fundo.
- **Menu lateral:** um tom pastel levemente diferente do fundo principal,
  separado por uma borda fina — não pode se confundir visualmente com o
  conteúdo.
- **Cor primária (ações, botões, links, item ativo do menu):** um marrom
  mais definido que os tons neutros de fundo, para ficar claramente
  identificável como elemento clicável/ativo — sem perder o estilo leve e
  pastel do conjunto.
- **Cores de status:** verde para "normal/ok", laranja para "atenção/estoque
  baixo" e vermelho para "negativo/erro" — bem diferenciadas entre si e dos
  tons neutros de fundo, para que o usuário identifique o status de um item
  rapidamente, mesmo sem prestar atenção ao texto.
- **Tipografia:** Lora (serifada) para títulos, Poppins para o restante da
  interface — mesma dupla usada no protótipo e na proposta comercial.
- Estilo geral: leve, claro, com bastante espaço em branco, sem áreas
  grandes de cor escura.

O protótipo navegável enviado à cliente (link abaixo) deve ser usado como
referência de estrutura de telas e fluxo de navegação, não como referência
final de cores:
`https://claude.ai/code/artifact/c6b6c474-712e-4ac1-93ef-93a8112bd152`

## 10. Telas principais (referência do protótipo)

1. **Painel geral** — resumo (itens cadastrados, movimentações recentes,
   itens em atenção, usuários ativos), últimas movimentações, itens em
   estoque baixo.
2. **Itens de estoque** — listagem completa, cadastro/edição/exclusão
   (Administrador), com categoria, local, quantidade e status.
3. **Entrada & saída** — formulário de registro de movimentação (item,
   tipo, quantidade, motivo/observação) e histórico.
4. **Usuários** — gestão de usuários e permissões (somente Administrador).
5. **Configurações** (nova, não existia no protótipo) — cadastro de
   categorias, locais e unidades de medida, e definição da quantidade
   mínima de alerta por item.
6. **Central de notificações** (nova) — histórico de alertas de estoque
   baixo já disparados.

## 11. Critérios de aceite do MVP

- [ ] Administrador consegue cadastrar categorias, locais, unidades e
      usuários sem precisar de alteração de código.
- [ ] Os 3 perfis de usuário respeitam corretamente as permissões descritas.
- [ ] Primeiro acesso força troca de senha; Administrador consegue resetar
      senha de qualquer usuário; recuperação de senha por e-mail funciona.
- [ ] Uma saída que deixa o estoque negativo é registrada normalmente, com
      alerta visual, sem bloquear a ação.
- [ ] Toda movimentação exige motivo/observação.
- [ ] Itens abaixo da quantidade mínima aparecem destacados e disparam
      notificação push.
- [ ] Sistema instalável como PWA no celular e utilizável como programa no
      computador.
- [ ] Consulta ao estoque e registro de movimentações funcionam offline,
      sincronizando ao reconectar.
- [ ] Paleta de cores com boa diferenciação entre fundo, menu, cor
      primária e cores de status, mantendo o estilo leve/pastel.
- [ ] Projetos novos e isolados criados no Supabase e no Railway,
      dedicados a este sistema.
