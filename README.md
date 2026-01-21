# Every Scoreboard

Um aplicativo versátil de placar para diversos jogos de cartas, desenvolvido com React Native e Expo.

## 📋 Sobre o Projeto

Este projeto é um marcador de pontos multi-jogos projetado para facilitar a contagem de pontos em jogos de cartas populares. Com uma interface limpa e intuitiva, ele suporta temas claro/escuro e internacionalização (Português e Inglês).

## 🎮 Jogos Suportados

- **Truco**: Marcador de tentos com histórico de partidas e gráfico de evolução.
- **Cacheta**: Gerenciamento de vidas e rodadas.
- **Fodinha**: Controle de vidas e apostas.
- **Canastra**: (Em desenvolvimento)

## 🚀 Tecnologias Utilizadas

- **React Native** (com Expo)
- **TypeScript**
- **React Navigation** (Navegação entre telas)
- **Reanimated** (Animações fluidas)
- **Shopify Skia** (Gráficos de alta performance)
- **Async Storage** (Persistência de dados)
- **i18n-js** (Internacionalização)

## 📂 Estrutura do Projeto

A estrutura de pastas em `src/` é organizada da seguinte forma:

- **components/**: Componentes de UI reutilizáveis (botões, modais, gráficos).
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
- **Tutorial Interativo**: Instruções de uso ao abrir cada jogo pela primeira vez. (Em desenvolvimento)
- **Regras Integradas**: Guia de "Como Jogar" disponível nos ajustes de cada jogo.

## ⚠️ Status e Próximos Passos

A tela de **Canastra** está atualmente em construção e será implementada em atualizações futuras.

Os tutoriais interativos foram implementados de maneira basica inicialmente, e continuam em desenvolvimento para ficarem mais explicativos

Planejamento para as próximas versões:
- Adicionar propagandas, e juntamente com isso, a funcionalidade do botão "Remover ADS" do menu principal, que irá remover essas propagandas.
