# ✅ Transmissão MQTT - Como Integrar o Jogo TRON

## Problema Identificado

O host não estava transmitindo o estado do jogo pelo MQTT porque:

1. ❌ Função `_captureGameState()` retornava `null`
2. ❌ Sem estado do jogo, não há o que transmitir
3. ❌ Faltava mecanismo de integração com o loop do jogo

---

## Solução: Game State Provider

Adicionado mecanismo de **Provider Function** que permite registrar uma função que fornece o estado atual do jogo.

### Como Funciona

```javascript
// Registrar função que fornece o estado do jogo
GameTransmission.setGameStateProvider(() => {
  return {
    players: [...],      // Array de jogadores
    projectiles: [...],  // Array de projéteis
    gameTime: 0,         // Tempo de jogo
    gameStatus: "playing" // Status: idle, playing, paused, finished
  };
});

// Depois disso:
connectAsHost()
// ↓ Sistema começa a transmitir estado a cada 50ms
```

---

## Integração Passo a Passo

### Passo 1: Identificar as Variáveis do Jogo

No arquivo `index.html`, localizar:
- **Jogadores**: Array ou objeto com `x`, `y`, `cor`, `energia`, etc
- **Projéteis**: Array com posição, tipo, etc
- **Estado do jogo**: Status atual (jogando, parado, etc)
- **Tempo**: Tempo decorrido da partida

Exemplo (HIPOTÉTICO - adaptar para seu jogo):
```javascript
// Variáveis globais do seu jogo
let jogadores = []; // Array de jogadores
let discos = [];    // Array de projéteis
let tempo = 0;      // Tempo atual
let estado = "idle"; // Estado do jogo
```

### Passo 2: Criar Função Provider

Criar uma função que retorna o estado atual:

```javascript
// Adicionar isso ANTES de connectAsHost()
function captureGameState() {
  // Mapear dados do jogo para formato MQTT
  const players = jogadores.map(j => ({
    id: j.id,
    x: j.x,
    y: j.y,
    color: j.cor,
    energy: j.energia,
    alive: !j.morto,
    direction: j.direcao
  }));
  
  const projectiles = discos.map(d => ({
    id: d.id,
    x: d.x,
    y: d.y,
    type: d.tipo,
    color: d.cor
  }));
  
  return {
    timestamp: Date.now(),
    gameTime: tempo,
    gameStatus: estado,
    players: players,
    projectiles: projectiles
  };
}

// Registrar o provider
GameTransmission.setGameStateProvider(captureGameState);

// Agora conectar como host
connectAsHost();
```

### Passo 3: Fluxo de Transmissão

Após registrar o provider e conectar como host:

```
┌─ connectAsHost()
│  └─ GameTransmission.initialize(false)  // false = host
│     └─ MQTTClient.initialize()
│        └─ [MQTT] ✅ Conectado
│        └─ _startGameStateTransmission()
│           └─ setInterval(() => _transmitGameState(), 50ms)
│              ├─ gameState = GameTransmission._captureGameState()
│              │                └─ Chama gameStateProvider() ← SEU CÓDIGO
│              ├─ MQTTClient.publishGameState(gameState)
│              │                └─ [MQTT] ✓ Publicado em tron/game/state
│              └─ Repeat a cada 50ms
```

---

## Exemplo Completo

### JavaScript (Integração no seu jogo)

```javascript
// 1. Definir função provider
function captureGameState() {
  // Capturar dados do seu jogo
  const players = []; // TODO: mapear jogadores do seu jogo
  const projectiles = []; // TODO: mapear projéteis do seu jogo
  
  return {
    timestamp: Date.now(),
    gameTime: performance.now() - gameStartTime,
    gameStatus: rodando ? "playing" : "stopped",
    players: players,
    projectiles: projectiles,
    worldState: {
      width: canvasWidth,
      height: canvasHeight
    }
  };
}

// 2. Registrar provider
GameTransmission.setGameStateProvider(captureGameState);

// 3. Conectar como host
connectAsHost();

// 4. Jogo roda normalmente
// Sistema MQTT transmite estado automaticamente a cada 50ms
```

### Console (Teste Rápido)

```javascript
// Registrar provider simples para teste
GameTransmission.setGameStateProvider(() => ({
  timestamp: Date.now(),
  gameTime: Math.random() * 1000,
  gameStatus: "playing",
  players: [
    { id: 1, x: 100, y: 100, color: "#ff0000" },
    { id: 2, x: 200, y: 200, color: "#00ff00" }
  ],
  projectiles: []
}));

// Conectar
connectAsHost();

// Verificar se transmitindo
console.log("[Debug] MQTTClient.isConnected:", MQTTClient.isConnected);
console.log("[Debug] GameTransmission.isHost:", GameTransmission.isHost);

// No console do espectador
connectAsSpectator();
```

---

## Estrutura Recomendada de Estado

O estado transmitido deve conter:

```javascript
{
  // Metadados
  timestamp: 1699345673000,      // Momento do capture
  gameTime: 45230,                // Tempo decorrido em ms
  gameStatus: "playing",          // idle, playing, paused, finished
  
  // Dados dos jogadores
  players: [
    {
      id: "player_1",
      x: 100,
      y: 150,
      color: "#ff0000",
      energy: 85,                 // 0-100
      alive: true,
      direction: 0,               // Ângulo em graus
      name: "Player 1",
      score: 1250
    },
    // ... outros jogadores
  ],
  
  // Dados de projéteis
  projectiles: [
    {
      id: "proj_1",
      x: 200,
      y: 300,
      type: "laser",               // laser, weapon, portal
      color: "#4de3ff",
      owner: "player_1"
    },
    // ... outros projéteis
  ],
  
  // Opcional: outros dados
  worldState: {
    width: 1024,
    height: 768,
    obstacles: []
  }
}
```

---

## Fluxo de Dados

### Host (Transmissor)

```
┌─ Seu Jogo TRON
│  ├─ requestAnimationFrame(loop)
│  └─ atualiza(dt)
│     ├─ Atualiza posição dos jogadores
│     ├─ Atualiza projéteis
│     └─ ... (lógica do jogo)
│
└─ GameTransmission (paralelo)
   ├─ setInterval(() => _transmitGameState(), 50ms)
   │  └─ gameState = gameStateProvider()  ← Chama sua função
   │     └─ Retorna estado atual
   │
   └─ MQTTClient.publishGameState(gameState)
      └─ WebSocket
         └─ MQTT Broker (wss://mqtt.feira-de-jogos.dev.br/mqtt)
            └─ Tópico: tron/game/state
               └─ [Payload] {...estado do jogo...}
```

### Espectador (Receptor)

```
MQTT Broker
└─ Tópico: tron/game/state
   └─ MQTTClient (inscrição)
      └─ onMessageArrived()
         └─ _handleMessage()
            └─ Accessibility.addGameState()
               └─ Exibir legendas/texto
                  └─ Tela do espectador mostra ações
```

---

## Otimizações

### 1. **Mudanças Apenas**

```javascript
// Já implementado: apenas transmite se estado mudou
if (JSON.stringify(gameState) !== JSON.stringify(this.lastGameState)) {
  MQTTClient.publishGameState(gameState);
  this.lastGameState = gameState;
}
```

**Benefício**: Reduz tráfico MQTT. Se nada mudou, não publica.

### 2. **Intervalo Ajustável**

```javascript
// Padrão: 50ms (20 vezes por segundo)
GameTransmission.updateInterval = 50;

// Para menos tráfico, aumentar para 100ms (10x/s)
GameTransmission.updateInterval = 100;

// Para mais frequência, reduzir para 33ms (30x/s)
GameTransmission.updateInterval = 33;
```

### 3. **Filtrar Dados Desnecessários**

```javascript
// Em vez de transmitir tudo:
return {
  players: jogadores,  // Array completo
  projectiles: discos  // Array completo
};

// Transmitir apenas o essencial:
return {
  players: jogadores.map(j => ({
    id: j.id,
    x: Math.round(j.x),
    y: Math.round(j.y),
    c: j.cor,  // Abreviação
    e: j.energia
  })),
  projectiles: discos.map(d => ({
    id: d.id,
    x: Math.round(d.x),
    y: Math.round(d.y),
    t: d.tipo
  }))
};
```

---

## Debugging

### Verificar se Provider Está Registrado

```javascript
console.log("Provider registrado?", GameTransmission.gameStateProvider !== null);
```

### Ver Estado Sendo Capturado

```javascript
// Forçar captura manual
const state = GameTransmission._captureGameState();
console.log("Estado capturado:", state);
```

### Monitorar Publicações

```javascript
// Já está ativo, ver no console:
// [MQTT] ✓ Publicado em tron/game/state
// [MQTT] ✓ Publicado em tron/game/state
// ... (a cada 50ms)
```

### Verificar no Espectador

```javascript
// No console do espectador:
connectAsSpectator();

// Ver mensagens recebidas:
MQTTClient.client.onMessageArrived = (msg) => {
  console.log("Recebido em", msg.destinationName, ":", msg.payloadString);
};
```

---

## Troubleshooting

### Host conecta mas não transmite

**Problema**: Console mostra `[MQTT] ✅ Conectado` mas sem mensagens de publicação

**Solução**:
1. Verificar se provider foi registrado: `console.log(GameTransmission.gameStateProvider)`
2. Se null, registrar: `GameTransmission.setGameStateProvider(yourFunction)`
3. Se provider retorna null, verificar sua implementação

### Espectador não recebe nada

**Problema**: Espectador conecta mas console não mostra mensagens

**Solução**:
1. Verificar se host está transmitindo: abrir console do host
2. Verificar se espectador está inscrito nos tópicos: `[MQTT] ✓ Inscrito`
3. Verificar conectividade: host e espectador na mesma rede/broker

### Muitas mensagens no console

**Problema**: Console muito poluído com `[MQTT] ✓ Publicado`

**Solução**:
1. Mudar intervalo: `GameTransmission.updateInterval = 100` (reduz frequência)
2. Ou desabilitar logs: modificar mqtt-client.js

---

## Referências de Integração

### Função Provider Mínima

```javascript
GameTransmission.setGameStateProvider(() => ({
  timestamp: Date.now(),
  gameStatus: "playing",
  players: [],
  projectiles: []
}));
```

### Função Provider Completa

```javascript
GameTransmission.setGameStateProvider(() => {
  // Seu código que captura estado do jogo
  const state = {
    timestamp: Date.now(),
    gameTime: performance.now() - startTime,
    gameStatus: isGameRunning ? "playing" : "stopped",
    players: mapPlayersFromYourGame(),
    projectiles: mapProjectilesFromYourGame()
  };
  return state;
});
```

---

## Próximos Passos

1. **Identificar estruturas do seu jogo**: Achar onde estão dados dos jogadores/projéteis
2. **Criar função provider**: Função que retorna estado
3. **Registrar provider**: `GameTransmission.setGameStateProvider(yourFunction)`
4. **Conectar como host**: `connectAsHost()`
5. **Testar com espectador**: Abrir outra aba com `connectAsSpectator()`
6. **Verificar console**: Deve ver `[MQTT] ✓ Publicado em tron/game/state`

---

## Exemplo de Teste

### Teste Simples (Sem Integração Real)

```javascript
// 1. Registrar provider que simula dados
GameTransmission.setGameStateProvider(() => ({
  timestamp: Date.now(),
  gameStatus: "playing",
  players: [
    { id: 1, x: Math.random() * 1000, y: Math.random() * 1000, color: "#ff0000" },
    { id: 2, x: Math.random() * 1000, y: Math.random() * 1000, color: "#00ff00" }
  ],
  projectiles: [
    { id: 1, x: 500, y: 500, type: "laser" }
  ]
}));

// 2. Conectar como host
connectAsHost();

// 3. Esperar 3 segundos
setTimeout(() => {
  // 4. Em outra aba, conectar como espectador
  console.log("Abra outra aba e execute: connectAsSpectator()");
}, 3000);
```

---

**Versão**: 1.0.6  
**Data**: 2026-11-06  
**Status**: ✅ Pronto para Integração
