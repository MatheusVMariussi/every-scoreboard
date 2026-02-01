# Every Scoreboard

Um aplicativo versátil de placar para diversos jogos de cartas, desenvolvido com React Native e Expo.

## 📋 Sobre o Projeto

Este projeto é um marcador de pontos multi-jogos projetado para facilitar a contagem de pontos em jogos de cartas populares. Com uma interface limpa e intuitiva, ele suporta temas claro/escuro e internacionalização (Português e Inglês).

## 🎮 Jogos Suportados

- **Truco**: Marcador de tentos com histórico de partidas e gráfico de evolução.
- **Cacheta**: Gerenciamento de vidas e rodadas, com controle de perdas e eliminações.
- **Fodinha**: Controle de vidas e apostas, com regras personalizáveis.
- **Canastra**: (Em desenvolvimento)

## 🚀 Tecnologias Utilizadas

- **React Native** (com Expo)
- **TypeScript**
- **React Navigation** (Navegação entre telas)
- **Reanimated** (Animações fluidas)
- **Shopify Skia** (Gráficos de alta performance e efeitos visuais)
- **Async Storage** (Persistência de dados)
- **i18n-js** (Internacionalização)

## 📂 Estrutura do Projeto

A estrutura de pastas em `src/` é organizada da seguinte forma:

- **components/**: Componentes de UI reutilizáveis (botões, modais, gráficos, tutoriais).
- **screens/**: Telas principais de cada jogo (HomeScreen, TrucoScreen, etc.).
- **navigation/**: Configuração de rotas e navegação.
- **hooks/**: Hooks customizados (ex: `useScreenOrientation`).
- **theme/**: Definições de tema (Claro/Escuro) e contexto de tema.
- **i18n/**: Arquivos de tradução (pt-BR, en).
- **utils/**: Funções utilitárias e armazenamento local.

## ✨ Funcionalidades Principais

- **Persistência de Dados**: Os jogos salvam o estado atual automaticamente, permitindo fechar e reabrir o app sem perder o progresso.
- **Temas**: Suporte a modo claro e escuro, respeitando a preferência do sistema ou configurável pelo usuário.
- **Internacionalização**: Suporte automático a Português e Inglês.
- **Histórico**: Visualização gráfica do histórico de partidas (no Truco).
- **Tutorial Interativo**: Sistema de onboarding com efeito de "spotlight" (foco) que guia o usuário pelas principais funcionalidades ao abrir cada jogo pela primeira vez.
- **Regras Integradas**: Modais de ajuda detalhados ("Como Jogar") acessíveis via menu de configurações, explicando regras e pontuações.

## ⚠️ Status e Próximos Passos

A tela de **Canastra** está atualmente em construção e será implementada em atualizações futuras.

Planejamento para as próximas versões:
- Implementação completa do placar de Canastra.
- Adicionar propagandas e funcionalidade "Remover ADS" (versão Premium).
