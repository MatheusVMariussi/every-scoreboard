# Every Scoreboard

Um aplicativo versátil de placar para diversos jogos de cartas, desenvolvido com React Native e Expo.

## 📋 Sobre o Projeto

Este projeto é um marcador de pontos multi-jogos projetado para facilitar a contagem de pontos em jogos de cartas populares. Com uma interface limpa e intuitiva, ele suporta temas claro/escuro e internacionalização (Português e Inglês).

## 🎮 Jogos Suportados

- **Truco**: Marcador de tentos com histórico de partidas e gráfico de evolução.
- **Cacheta**: Gerenciamento de vidas e rodadas, com controle de perdas e eliminações.
- **Fodinha**: Controle de vidas e apostas, com regras personalizáveis.
- **Canastra**: (Em breve)

## 🚀 Tecnologias Utilizadas

- **React Native** (com Expo)
- **TypeScript**
- **React Navigation** (Navegação entre telas)
- **Reanimated** (Animações fluidas)
- **Shopify Skia** (Gráficos de alta performance e efeitos visuais)
- **react-native-responsive-screen** (Dimensionamento responsivo)
- **Async Storage** (Persistência de dados)
- **i18n-js** (Internacionalização)
- **expo-speech-recognition** (Reconhecimento de fala no aparelho, para o placar por voz)
- **Jest** (Testes unitários com jest-expo)
- **ESLint** (Flat config com typescript-eslint strict + react-hooks + react-native)
- **Prettier** (Formatação consistente)

## 📂 Estrutura do Projeto

A estrutura de pastas em `src/` é organizada da seguinte forma:

- **components/**: Componentes de UI reutilizáveis (botões, modais, gráficos, tutoriais, error boundary).
- **screens/**: Telas principais de cada jogo (HomeScreen, TrucoScreen, etc.) e TransitionScreen para transições de orientação.
- **navigation/**: Configuração de rotas e navegação (React Navigation v7 com Native Stack).
- **hooks/**: Hooks customizados para lógica de jogo (`useTrucoGame`, `useCachetaGame`, `useFodinhaGame`) e navegação (`useTransitionBack`).
- **voice/**: Placar por voz — ciclo de vida do microfone, gramáticas por idioma (`grammar/pt-BR`, `grammar/en-US`), normalização de texto, parser de comandos e fila de pendentes. Independente de React e de i18n, para o parser ser puro e testável sem mocks.
- **theme/**: Definições de tema (Claro/Escuro), paleta de cores e contexto de tema.
- **i18n/**: Arquivos de tradução (pt-BR, en).
- **utils/**: Funções utilitárias, armazenamento local (AsyncStorage) e preferências do app (`appSettings`).

## ✨ Funcionalidades Principais

- **Persistência de Dados**: Os jogos salvam o estado atual automaticamente, permitindo fechar e reabrir o app sem perder o progresso.
- **Temas**: Suporte a modo claro e escuro, respeitando a preferência do sistema ou configurável pelo usuário.
- **Internacionalização**: Suporte automático a Português e Inglês.
- **Histórico**: Visualização gráfica do histórico de partidas (no Truco).
- **Tutorial Interativo**: Sistema de onboarding com efeito de "spotlight" (foco) que guia o usuário pelas principais funcionalidades ao abrir cada jogo pela primeira vez.
- **Regras Integradas**: Modais de ajuda detalhados ("Como Jogar") acessíveis via menu de configurações, explicando regras e pontuações.
- **Error Boundary**: Tela de recuperação em caso de erros inesperados, com opção de tentar novamente ou resetar os dados do app.
- **Transição de Orientação**: Sistema de TransitionScreen que mascara a mudança entre telas em portrait e landscape, evitando artefatos visuais.
- **Placar por Voz** (Cacheta e Fodinha): Marcação por fala, em dois modos — *segure para falar* e *sempre ouvindo*. Funciona em **Português e Inglês**, seguindo o idioma do app.

### 🎙️ Placar por Voz

Disponível nas telas de **Cacheta** e **Fodinha**, pelo microfone no rodapé.

**Como funciona**

A fala vira uma proposta, nunca uma alteração direta. O pipeline é:

1. **Reconhecimento** — `expo-speech-recognition` transcreve no aparelho. Os nomes da mesa são enviados como `contextualStrings`, enviesando o reconhecedor *antes* de ele errar.
2. **Normalização** — cada palavra passa por dobras de grafema do idioma, para que variações de escrita virem a mesma string (pt-BR: `Thiago`/`Tiago`, `Luiz`/`Luis`; en-US: `Chris`/`Kris`, `Jon`/`John`, `Megan`/`Meghan`).
3. **Gramática** — verbos, números, muletas e expressões compostas vêm de um objeto `Grammar` por idioma. O parser não conhece idioma nenhum: adicionar um novo é escrever outra gramática.
4. **Resolução de nomes** — Jaro-Winkler com duas notas de corte e checagem de ambiguidade. A regra que não se quebra é **nunca chutar**: dois nomes parecidos viram uma pergunta, não uma escolha.
5. **Fila de pendentes** — tudo espera aprovação do usuário. Nada chega ao placar sozinho.

**Exemplos**

| Português | Inglês |
| --- | --- |
| "léo e ana correram, o zé ganhou" | "chris and emma folded, jon won" |
| "todo mundo correu" | "everyone folded" |
| "matheus vai fazer duas" | "chris is gonna make two" |
| "matheus dois, joão um" | "chris two, emma one" |
| "léo ganhou, próxima rodada" | "chris won, next round" |
| "desfazer" | "undo" |

**Privacidade**: o áudio não é gravado, não é armazenado e não é enviado para servidores nossos — a transcrição é feita pelo próprio sistema do aparelho. O microfone só fica ativo enquanto está ouvindo, e é desligado ao sair da tela ou ao mandar o app para segundo plano.

## 🧪 Testes

O projeto utiliza **Jest** com o preset `jest-expo`. Para rodar os testes:

```bash
npm test
```

Os testes cobrem a lógica pura dos jogos:
- **Truco**: Cálculo de pontos base, histórico de pontos e detecção de vitória.
- **Cacheta**: Processamento de rodadas, validação de ganhadores, edição de histórico e remoção de jogadores/rodadas.
- **Fodinha**: Cálculo de dano (modo fixo e diferença), controle de apostas, edição de histórico e remoção de rodadas.
- **Voz**: Normalização por idioma, resolução difusa de nomes, parser de comandos (pt-BR e en-US), fila de pendentes e conversão da fila em lotes de placar.

## 🔧 Lint e Formatação

O projeto utiliza **ESLint** (flat config, strict TypeScript) e **Prettier**:

```bash
npm run lint          # Verifica erros de lint
npm run lint:fix      # Corrige erros automaticamente
npm run format        # Formata todo o código com Prettier
```

## ⚠️ Status e Próximos Passos

A tela de **Canastra** está escondida atrás de um badge "Em Breve" e será implementada em atualizações futuras.

Planejamento para as próximas versões:
- Implementação completa do placar de Canastra.
- Adicionar propagandas e funcionalidade "Remover ADS" (versão Premium).
