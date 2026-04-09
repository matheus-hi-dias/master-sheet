# 📚 Especificação de Funcionalidades: Master-Sheet (Backend, Web & Mobile)

Este documento detalha o comportamento, os principais componentes e as regras de negócio para as telas do ecossistema Master-Sheet, traçando paralelos entre como elas devem existir no ambiente **Web (React/Vite)** e no ambiente **Mobile (React Native/NativeWind)**.

---

## 🎨 Global UI/UX & Design System (Apoiado em `src`)

Antes de explorar as telas individualmente, todo o aplicativo obedece a tokens visuais muito estritos e parametrizados em sua fundação:
- **Esquema de Cores:** Ambiente fundamentalmente escuro (fundo global na cor `--color-bg-app`: `#121212` e painéis de suporte `--color-bg-panel`: `#1A1A1B`). As caixas frontais adotam `--color-bg-card` (`#242424`). Textos primários ressaltam em `#E0E0E0`, e os demais utilizam tom muted em `#888888`.
- **Ações e Foco:** Tons de ouro lideram a identidade primária comunicativa (`--color-gold`: `#D4AF37`), aplicados largamente em componentes interativos (ex: `<Btn variant="gold">`, foco em `<Input>`). Bordas são ativadas em golden ratios ou se revelam neutras (`#3D3D3D`).
- **Tipografia e Moduladores Visuais:** Fonte de marca `Cinzel` como display/hero text (e para números em dados de RPG), baseando o resto em `Lato`. Marcante padronização via classes `uppercase` espaçadas (`tracking-[0.1em]`) para rótulos pequenos (`<SectionLabel>`).
- **Comportamentos Animados:** Animações interativas nativas CSS, como subida/fading com `animate-fade-in`, rolagens rotativas 3D falsas num `dice-in` para interações de teste com dados e subida inferior pop-up via `toast-in` nas notificações globais.

---

## 1. Tela de Login e Autenticação

### 🌐 Web (React + Vite)
- **Componentes:** Container na tela flutuante acompanhado de um fundo interativo com brilho luminoso radial (`radial-gradient`), ancorando um `<Card>` com margem demarcatória superior em tons de ouro. Formulários modelados via blocos encadeados `<Input>` (agora com capacidade reativa via botão de revelar/ocultar senhas utilizando ícone de olho) e consolidados usando `<Btn variant="gold">` (ou ghost). Todo o bloco renderizando na tela com subida suave (`animate-fade-in`).
- **Funcionamento:**
  - Após inserir as credenciais e comunicar com o NestJS, armazenar o **JWT** localmente (localStorage) ou via Cookies HTTP Only.
  - Update instantâneo no estado global (Zustand ou React Context) para redirecionar o usuário para o Dashboard, utilizando `react-router-dom`.
- **UX/Design:** Ao invés da tela padrão ou modals, os feedbacks comunicacionais utilizam instantaneamente subcomponentes `<Toast>`. Assemelham-se a pílulas douradas subindo em animação interativa (`toast-in`) do limite inferior da tela (centralizados e suspensos).

### 📱 Mobile (React Native + Expo)
- **Componentes:** Tela de fundo esticada para ocupar toda a View. Inputs espaçados (`<TextInput>`).
- **Funcionamento:**
  - Armazenar o JWT de maneira forte utilizando o pacote **`expo-secure-store`**.
  - O fluxo controla a navegação mudando toda a árvore do *Navigation Container* de "Auth Stack" para "Main App Stack".
- **UX/Design:** Uso intensivo do teclado nativo. O botão "Avançar" do teclado do celular deve pular do texto do e-mail diretamente para o campo de senha (`returnKeyType="next"`).

---

## 2. Dashboard Pessoal (Minhas Fichas)

A tela onde o jogador visualiza, edita e seleciona os personagens/fichas cadastradas.

### 🌐 Web
- **Componentes:** Layout em Grid contendo "Cards de Personagem". Sidebar lateral para acesso rápido a outras rotas (Configurações, Galeria).
- **Funcionamento:**
  - `React Query` carrega e cacheia o array de *Sheets* do ator.
  - Hover nos cards revela botões de ações rápidas ("Deletar", "Duplicar", "Compartilhar Ficha").
- **UX/Design:** Estilo visual encorpado onde o título principal fará uso da robusta `<PageHeader>`, alocando o título hero usando tipografia serifa exibida. O agrupamento contínuo em listagens de `<Card>` permite espaçamento enxuto visando o preenchimento de telas horizontais. Os cartões integram botões subjacentes (e.g. deletar) utilizando explicitamente a identidade secundária `<Btn variant="ghost">` ou `<Btn variant="danger">`.

### 📱 Mobile
- **Componentes:** Fundo de tela com **Bottom Tabs Navigation** (Explorar, Minhas Fichas, Perfil). Listagem vertical (`<FlatList>` ou `FlashList`).
- **Funcionamento:**
  - Renderiza um componente em grade/lista fluído.
  - Empregar o recurso de **Pull-to-Refresh** (deslizar para baixo), forçando o cache do React Query a repuxar do banco.
- **UX/Design:** Cards de altura maior com foto em destaque. Scroll vertical e botões com *Touch Target* de fácil acesso (mínimo 44x44px).

---

## 3. Galeria de Templates (Pesquisa e Comunidade)

Espaço onde os usuários encontram as "regras e esqueletos de fichas" predefinidas (ex. D&D 5e, Call of Cthulhu).

### 🌐 Web
- **Componentes:** Barra de busca avançada e filtros multi-seletores estilo "Pill" para as *Global Tags*. Modal para "Pré-visualização".
- **Funcionamento:**
  - A pesquisa consome o back-end e filtra Templates onde `IsPublic: true`.
  - Ao clicar em "Preview", carregar uma ficha mockada apenas-leitura sem registrar no banco que o usuário a possui, possibilitando a visualização da árvore de JSON.

### 📱 Mobile
- **Componentes:** Lista infinita paginada (`onEndReached`). Carrossel horizontal de filtros no cabeçalho.
- **Funcionamento:**
  - Rolagem por milhares de fichas deve ser paginada para otimizar memória e rede.
  - Toque no Template abre uma rotina *BottomSheet Modal* inferior exibindo informações ("Criar nova Ficha usando este Template").

---

## 4. O Editor de Fichas (Criação e Edição - Tela Principal)

O coração do aplicativo. O engine responsável por ler o `Template.JSON` e montar uma UI dinâmica associada ao sistema de status atual associado a `Sheet.data` (Ficha do usuário).

### 🌐 Web
- **Componentes:** Abas laterais ou superiores customizadas (ex. Atributos, Perícias, Equipamento). Engine recursivo de componentes.
- **Funcionamento:**
  - **Dynamic Form Mapper:** Para cada campo mapeado no JSON, ele processa dinamicamente a geração do formulário e insere lógicas estipuladas.
  - O preenchimento da ficha deve salvar por si só (*Auto-save*, utilizando `debounce`) disparando Mutates no React Query.
- **UX/Design:** Layout funcional extremamente guiado pela estrutura modular limpa, demarcando domínios extensos usando categorizadores refinados `(<SectionLabel>)` adornados em uppercase e tom ouro sobre a linha de limite inferior. Clicar nos blocos de atributos instanciará massivamente a interface gráfica utilitária trancando o focus-screen e alocando um `<DiceOverlay>`: o indicador vibrará num grande número reluzente dourado originado pela microinteração veloz `animate-dice-in` na matriz principal da página.

### 📱 Mobile
- **Componentes:** Swipeable Tabs (Abas Deslizáveis). O espaço vertical ganha primazia.
- **Funcionamento:**
  - Os mapas de JSON lidam com uma aba por vez para impedir gargalo de renderização e travar a thread na interface nativa.
  - **Floating Action Button (FAB) global (`<FAB>`)** estrategicamente assentado no limite de fuga (canto inferior), arredondado, maciço em tom cor de marca (`--color-gold`) com proeminente resposta sombreada flexível ao foco, que aumenta (`hover:scale-110`). Um recurso de conveniência dedicado unicamente a "Rolagem Rápida" analisando o inventário/status do usuário para testes ativos intermitentes.
- **UX/Design:** A formatação muda; textos que iriam de lado na web vão preferencialmente acima das caixas (`TextField`). Teclado adequado deve abrir dinamicamente baseado na *typagem* do JSON (ex. teclado numérico se a caixa for de números).

---

## 5. Gerenciamento e Dualidade de Tags

Responsável por lidar com a mecânica em onde e quais tags podem ser indexadas.

### 🌐 Web
- **Componentes:** Componente React-Select multi-opção com Auto-completar inteligente cujos rótulos e escolhas refratam visualmente a classe estética encapsulada pelo agrupador minimalista `<Tag>`. Alternam cores densamente do opaco/transparente atrativo de tons atenuados quando sugeridas, para a estampa bruta e focada que detém ouro forte ao ser efetivamente adicionada ou clicada.
- **Funcionamento:**
  - O endpoint de submissão do front tem inteligência prévia de separar lógicas. Se você está alterando os escopos do *Template*, utiliza-se as regras base globais; se é a sua Ficha particular, comunica apenas a tabela `SheetTag`.

### 📱 Mobile
- **Componentes:** View modal separada focado na adição de tags.
- **Funcionamento:**
  - Devido ao tamanho da tela e dificuldade de digitar enquanto lida com seleções simultaneamente, clicar no campo "Adicionar Tag" muda a navegação ou sobe tela de input limpa só para gerenciá-las, minimizando o teclado obscurecer informações da lista original.

---

## 6. Sincronização Lenta & Estado Offline

### 🌐 Web e 📱 Mobile *(Funcionalidade Compartilhada)*
Dada a natureza das campanhas de RPG (onde frequentemente não se tem um bom sinal de internet), o app **deve** usar preceitos de:
- **Optimistic UI Updates:** Alterar visualmente os atributos, textos ou itens no frontend **imediatamente** antes ou durante a submissão no NestJS, e caso a requisição seja concluída com sucesso, não há engasgo na interface.
- **Tratamento de Estado:** Caso um erro ocorra na requisição `fetch`/`axios`, o sistema deve reverter automaticamente o estado do React Query para os mesmos dados seguros que estavam antes do usuário agir (Rollback em tela).


## 7. Engine de Lógica e Cálculos (Backend)

Diferente de um CRUD comum, o Master-Sheet possui uma "inteligência" de processamento.

### ⚙️ Funcionamento

- **Mapeador de Atributos:** O backend deve expor um endpoint que recebe o JSON da ficha e retorna valores calculados (ex: se o usuário tem Força 18, o backend retorna que o modificador é +4. Esse modificador deve ser definido no JSON do Template de acordo com intervalos definidos pelo usuário).
- **Validação de Integridade:** Antes de salvar uma `Sheet`, o backend verifica se os campos enviados existem no `Template` pai para evitar dados lixo no banco.

## 8. Sistema Híbrido de Tags (Persistência)

### ⚙️ Funcionamento

- **Normalização:** Toda tag enviada (Web ou Mobile) passa por um `toLowerCase().trim()` antes de tocar o banco de dados.
- **Performance:** Implementar índices no PostgreSQL para os nomes das tags, permitindo que a busca na "Galeria de Templates" seja instantânea mesmo com milhares de registros.

## 9. Fluxo de Autenticação e Segurança

### ⚙️ Funcionamento

- **Refresh Tokens:** (Futuro) Preparar a estrutura para rota de `/refresh` para que o usuário mobile não precise logar toda semana.
- **Guards de Escopo:** Implementar um `OwnerGuard` genérico que verifica se o ID do recurso solicitado pertence ao usuário logado, evitando que um jogador acesse a ficha de outro via URL/ID.
