# 📖 Guia de Excelência para READMEs (Padrão Master-Sheet)

Este guia define a convenção de documentação para todo o monorepo do **Master-Sheet**. Ele estabelece os padrões para a criação e manutenção do **README principal na raiz** e dos **READMEs específicos de cada aplicação** (`apps/api`, `apps/web`, `apps/mobile`), garantindo paridade com as melhores práticas de projetos "Awesome README".

---

## 1. Estrutura de Documentação do Monorepo

O Master-Sheet opera sob uma estrutura hierárquica de documentação:

1. **Root README (`/README.md`):** Visão macro do ecossistema. Focado em arquitetura do monorepo, orquestração com Turborepo/pnpm, setup rápido de desenvolvimento, mapa de pacotes e roadmap global.
2. **App READMEs (`/apps/*/README.md`):** Visão micro de cada aplicação. Focados em variáveis de ambiente específicas, comandos de build/testes locais, convenções de código da plataforma e tabelas detalhadas de rotas/telas.

---

## 2. Identidade Visual e Engajamento
- **Hero Section:** Logo ou banner alinhado e centralizado, seguido de uma tagline clara de uma linha que define a proposta do ecossistema.
- **Badges:** Badges estilizadas indicando status do Turborepo, versão do Node/pnpm, cobertura de testes, licença e badges de stack (NestJS, React, Expo, Prisma).
- **Demos Visuais:** GIFs ou screenshots demonstrando a renderização dinâmica de fichas, editor de templates e a interface mobile.

---

## 3. Navegação e Estrutura
- **TOC (Sumário):** Obrigatório no Root README e nos READMEs de cada app.
- **Hierarquia Visual:** Uso de ícones unicode e emojis nos títulos para distinção visual rápida.
- **Seções Expansíveis:** Uso de `<details>` e `<summary>` para schemas JSON longos, variáveis de ambiente extensas e logs de migração.

---

## 4. Conteúdo Técnico por Nível de Documentação

### A. Root README (`/README.md`)
- **Visão Geral & Proposta:** O motor dinâmico de JSON para fichas de RPG de múltiplos sistemas.
- **Arquitetura de Workspace:** Explicação gráfica (Mermaid.js) da relação entre `apps/api`, `apps/web` e `apps/mobile`.
- **Quickstart Monorepo (TL;DR):** Comandos pnpm para clonar, instalar e rodar todo o ecossistema com um único comando (`pnpm dev`).
- **Tabela de Variáveis de Ambiente Globais:** Mapeamento de `.env` da raiz e propagação para os apps.

### B. Backend API (`apps/api/README.md`)
- **API Reference completa:** Tabela detalhada de endpoints, métodos HTTP, DTOs de entrada e decorators de segurança (`@GetCurrentUser()`, `JwtAuthGuard`, `OwnerGuard`).
- **Data Model & Migrations:** Instruções de execução das migrations Prisma (`pnpm --filter api exec prisma migrate dev`) e explicação da estratégia de **JSONB** e **Tags Relacionais N:N**.
- **Segurança & AppSec:** Como funciona o hash Bcrypt, isolamento de recursos por `userId` e mitigação de dados sensíveis.

### C. Web Dashboard (`apps/web/README.md`)
- **Dynamic Form Engine:** Explicação de como a UI converte o `Template.structure` (JSON) em formulários interativos com `React Hook Form` e `Zod`.
- **Roteamento & Estado:** Mapeamento de rotas do `react-router-dom` e estratégias de cache via `React Query`.
- **Guia de Design System:** Tokens do Tailwind CSS v4, ícones do Lucide e uso de componentes acessíveis.

### D. Mobile App (`apps/mobile/README.md`)
- **Navegação & Gestos:** Estrutura do Expo Router, navegação por abas deslizáveis (Swipeable Tabs) para fichas densas.
- **Offline & Persistence:** Mecanismo de **Optimistic UI Updates** e armazenamento seguro do JWT via `expo-secure-store`.
- **Execução Nativa:** Instruções para rodar no Android Studio (Windows Nativo) ou Expo Go.

---

## 5. Estrutura Padrão do Root README

```markdown
# 🎲 Master-Sheet

> Engine flexível para criação, compartilhamento e gerenciamento de fichas dinâmicas de RPG.

<!-- Badges -->
![Turborepo](https://img.shields.io/badge/Turborepo-v2.0-blue)
![pnpm](https://img.shields.io/badge/pnpm-v9.0-orange)
![NestJS](https://img.shields.io/badge/NestJS-v11.0-red)
![React](https://img.shields.io/badge/React-Vite-blue)
![Expo](https://img.shields.io/badge/Expo-React_Native-black)

## 📋 Sumário
- [Visão Geral](#-visão-geral)
- [Arquitetura do Monorepo](#-arquitetura-do-monorepo)
- [Tech Stack](#-tech-stack)
- [Quickstart (TL;DR)](#-quickstart-tldr)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Qualidade e Segurança](#-qualidade-e-segurança)
- [Roadmap](#-roadmap)

---

## 🏗️ Arquitetura do Monorepo
<!-- Diagrama Mermaid mostrando a comunicação das apps com a API e o PostgreSQL -->

## 🛠️ Tech Stack
| Camada | Tecnologia |
| :--- | :--- |
| Workspace | Turborepo + pnpm Workspaces |
| Backend API | NestJS, Prisma ORM, PostgreSQL |
| Web App | React, Vite, Tailwind CSS, React Query |
| Mobile App | React Native, Expo, NativeWind |

## 🚀 Quickstart (TL;DR)
```bash
# Clone o repositório
git clone https://github.com/usuario/master-sheet.git

# Instale dependências globais
pnpm install

# Suba os containers do banco de dados
docker compose up -d

# Execute as migrations do Prisma
pnpm --filter api exec prisma migrate dev

# Inicie o ecossistema em modo de desenvolvimento
pnpm dev

---

## 6. Mandato para Agentes de IA

Você, como agente de software (Antigravity), tem o dever de manter toda a documentação íntegra, precisa e sincronizada com o código-fonte em cada iteração.

- **Proatividade:** A atualização do README correspondente ao escopo alterado é um critério obrigatório de **"Definition of Done"**. Se você adicionou um endpoint no NestJS, atualize o `apps/api/README.md`. Se adicionou uma rota no React ou Expo, atualize o README do app correspondente.
- **Sincronismo de Comandos:** Mantenha os comandos de terminal estritamente alinhados com a instrução do `AGENTS.md` (uso exclusivo de `pnpm` e comandos com `--filter`).
- **Precisão de Schemas:** Atualize os exemplos de JSON de `structure` e `data` sempre que a engine dinâmica de fichas sofrer evoluções arquiteturais.

> [!IMPORTANT]
> **Regra de Ouro:** O README da raiz ou o README do app afetado DEVE ser atualizado em **qualquer mudança** que altere contratos de API, variáveis de ambiente, dependências ou comandos de execução.