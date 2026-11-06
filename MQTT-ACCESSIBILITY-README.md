# MQTT WebSocket + Acessibilidade para TRON

## Visão Geral

Este módulo adiciona suporte completo para transmissão de estado de partida via MQTT WebSocket e um sistema robusto de acessibilidade para jogadores surdos. Permite que espectadores assistam as partidas em tempo real com sincronização perfeita, incluindo legendas descritivas de todos os eventos sonoros.

## Funcionalidades

### 🌐 MQTT WebSocket
- **Transmissão em Tempo Real**: Sincroniza o estado da partida entre host e espectadores
- **Broker Flexível**: Suporta qualquer broker MQTT com WebSocket
- **Fallback WebSocket**: Funciona mesmo sem biblioteca Paho MQTT
- **QoS Configurável**: Entrega confiável de mensagens
- **Pub/Sub Robusto**: Tópicos organizados por tipo de evento

### ♿ Acessibilidade para Surdos
- **Legendas de Eventos**: Converte sons em texto em tempo real
- **UI Acessível**: Display visual com emojis e cores
- **Descrições Contextuais**: Cada evento tem descrição clara
- **Toggle Fácil**: Botão para ativar/desativar modo acessível
- **Histórico de Eventos**: Mantém últimas mensagens visíveis

## Arquitetura

### Arquivos Novos

#### 1. `mqtt-client.js`
Cliente MQTT WebSocket com suporte a:
- Conexão com broker MQTT
- Publicação/subscrição de tópicos
- Fallback para WebSocket puro
- Métodos para diferentes tipos de eventos

**Tópicos principais:**
- `tron/game/state` - Estado geral do jogo
- `tron/events/sounds` - Eventos de som
- `tron/spectators` - Informações de espectadores

#### 2. `accessibility.js`
Sistema de acessibilidade com:
- Display visual de eventos
- Mapeamento de sons para descrições
- Suporte multilíngue (PT-BR, EN)
- Animações e estilos integrados
- ARIA labels para leitores de tela

#### 3. `transmission.js`
Módulo integrador que:
- Sincroniza estado do jogo via MQTT
- Conecta eventos de som com acessibilidade
- Fornece API simples para o jogo
- Gerencia host/espectador

#### 4. Integração no `index.html`
- Carregamento dos scripts
- Hooks de eventos do jogo
- Funções globais de controle
- Injeção de estilos CSS

## Como Usar

### Instalação

1. Os arquivos já estão no projeto:
   - `mqtt-client.js`
   - `accessibility.js`
   - `transmission.js`

2. Os scripts são carregados automaticamente no `index.html`

### Modo Espectador com Acessibilidade

#### Via Console do Navegador

```javascript
// Conectar como espectador e ativar acessibilidade
connectAsSpectator()

// Depois ativar acessibilidade
toggleAccessibility()
```

#### Via Código

```javascript
// Inicializar como espectador
GameTransmission.initialize(isSpectator = true)

// Ativar acessibilidade
Accessibility.toggle()
```

### Modo Host (Transmissor)

#### Via Console

```javascript
// Conectar como transmissor
connectAsHost()
```

#### Via Código

```javascript
// Inicializar como host
GameTransmission.initialize(isSpectator = false)
```

### Usar Broker Customizado

```javascript
// Com URL customizada
connectAsSpectator("wss://seu-broker.com:8883")
connectAsHost("wss://seu-broker.com:8883")

// Ou via objeto MQTTClient
MQTTClient.initialize("wss://seu-broker.com:8883", 
  () => console.log("Conectado"),
  () => console.log("Desconectado")
)
```

## Eventos de Som Suportados

| Tipo | Descrição | Ícone |
|------|-----------|-------|
| `laser` | Disparo de laser | ⚡ |
| `throw` | Arma lançada | 💣 |
| `derez` | Personagem derrotado | 💥 |
| `portal` | Portal aberto | 🌀 |
| `moto_engine` | Motor acelerado | 🏍️ |
| `collision` | Colisão detectada | 💔 |
| `energy_low` | Energia baixa | ⚠️ |
| `energy_boost` | Energia recuperada | ⚡ |
| `victory` | Vitória! | 🏆 |
| `game_over` | Jogo finalizado | ⏹️ |
| `game_start` | Jogo iniciado | ▶️ |

## API de Transmissão

### GameTransmission

```javascript
// Inicializar
GameTransmission.initialize(isSpectator, brokerUrl)

// Eventos de armas
GameTransmission.onLaserFired(playerName, position)
GameTransmission.onWeaponThrown(playerName, weaponName, position)

// Eventos de gameplay
GameTransmission.onPlayerDefeated(playerName, defeatedBy)
GameTransmission.onCollision(player1, player2)
GameTransmission.onPortalOpened(position)
GameTransmission.onGameStart()
GameTransmission.onGameOver()
GameTransmission.onVictory(winnerName)

// Atualizar estado
GameTransmission.updatePlayerState(playerName, state)

// Status
GameTransmission.getStatus()
```

## API de Acessibilidade

### Accessibility

```javascript
// Controlar
Accessibility.toggle()

// Adicionar evento manual
Accessibility.addSoundEvent(soundType, customDescription, additionalInfo)

// Descrever estados
Accessibility.describePlayerState(playerName, state)
Accessibility.describeCollision(player1, player2)
Accessibility.describeWeaponEvent(playerName, weaponName, action)
Accessibility.describeVictory(winnerName)
Accessibility.describeDefeat(loserName)

// Status
Accessibility.getStatus()
```

## API MQTT

### MQTTClient

```javascript
// Inicializar
MQTTClient.initialize(brokerUrl, onConnect, onDisconnect)

// Publicar
MQTTClient.publishGameState(gameState)
MQTTClient.publishSoundEvent(soundType, soundData)
MQTTClient.registerSpectator(spectatorInfo)

// Callbacks
MQTTClient.onGameState = (data) => {}
MQTTClient.onSoundEvent = (data) => {}
MQTTClient.onSpectatorUpdate = (data) => {}

// Status
MQTTClient.getStatus()
MQTTClient.disconnect()
```

## Exemplo Completo

```html
<!-- Carregar scripts (já no index.html) -->
<script src="mqtt-client.js"></script>
<script src="accessibility.js"></script>
<script src="transmission.js"></script>

<script>
// 1. Modo Host (transmite a partida)
document.getElementById("btn-transmitir").onclick = () => {
  connectAsHost("wss://seu-broker.com:8883")
  console.log("Transmitindo partida...")
}

// 2. Modo Espectador (assiste com legendas)
document.getElementById("btn-assistir").onclick = () => {
  connectAsSpectator("wss://seu-broker.com:8883")
  toggleAccessibility()
  console.log("Assistindo com legendas ativadas...")
}

// 3. Durante o gameplay, registrar eventos
function fireWeapon(playerName) {
  playLaser() // Som original
  GameTransmission.onLaserFired(playerName, {x: 100, y: 200})
}

function playerDefeated(playerName, defeatedBy) {
  playDerez() // Som original
  GameTransmission.onPlayerDefeated(playerName, defeatedBy)
}
</script>
```

## Configuração de Broker MQTT

### Usar Broker Público (padrão)
O projeto usa `mqtt.eclipseprojects.io:9001` por padrão. Perfeito para teste!

### Usar Broker Privado

#### Mosquitto (Docker)
```bash
docker run -it -p 8883:8883 -p 9001:9001 eclipse-mosquitto
```

#### EMQX (Docker)
```bash
docker run -d --name emqx -p 1883:1883 -p 8883:8883 -p 8083:8083 -p 8084:8084 -p 18083:18083 emqx/emqx:latest
```

Depois use:
```javascript
connectAsHost("wss://localhost:8883")
```

## Tópicos MQTT

### tron/game/state
Publica estado geral da partida
```json
{
  "timestamp": 1234567890,
  "clientId": "tron_abc123",
  "players": [...],
  "gameStatus": "running",
  "score": {...}
}
```

### tron/events/sounds
Publica eventos de som
```json
{
  "timestamp": 1234567890,
  "clientId": "tron_abc123",
  "soundType": "laser",
  "soundData": {
    "player": "Player1",
    "position": {x: 100, y: 200},
    "description": "Player1 disparou um laser"
  }
}
```

### tron/spectators
Publica informações de espectadores
```json
{
  "timestamp": 1234567890,
  "clientId": "tron_spectator_123",
  "action": "join",
  "isSpectator": true,
  "accessibilityEnabled": true
}
```

## Estilos CSS

Os estilos são injetados automaticamente. Personalize em `accessibility.js`:

```javascript
const accessibilityStyles = `
  /* Seus estilos aqui */
`
```

Classes disponíveis:
- `.accessibility-toggle` - Botão
- `.accessibility-display` - Display de mensagens
- `.accessibility-message` - Cada mensagem
- `.accessibility-info` - Painel de info

## Suporte Multilíngue

Eventos já suportam português (PT-BR) e inglês (EN).

Adicionar novo idioma em `accessibility.js`:

```javascript
soundDescriptions: {
  laser: {
    pt: "⚡ Disparo de laser",
    en: "⚡ Laser fired",
    es: "⚡ Disparo de láser",  // Novo idioma
    icon: "⚡"
  }
}
```

## Debugging

### Console
```javascript
// Ver status MQTT
MQTTClient.getStatus()

// Ver status de acessibilidade
Accessibility.getStatus()

// Ver status geral
GameTransmission.getStatus()

// Ativar/desativar logs (opcional)
console.log = window.oldLog = console.log
```

### Network Tab
- Observar WebSocket em `Devices` ou `Network`
- Procurar por `mqtt.eclipseprojects.io` ou seu broker
- Verificar frames de mensagens MQTT

## Performance

- **Intervalo de atualização**: 50ms (ajustável em `transmission.js`)
- **Max mensagens visíveis**: 5 (ajustável em `accessibility.js`)
- **Timeout mensagem**: 4s (ajustável em `accessibility.js`)
- **QoS MQTT**: 1 (entrega garantida)

## Compatibilidade

| Navegador | MQTT | Acessibilidade | Notas |
|-----------|------|-----------------|-------|
| Chrome    | ✅   | ✅              | Recomendado |
| Firefox   | ✅   | ✅              | Funciona perfeitamente |
| Safari    | ✅   | ✅              | iOS 13+ |
| Edge      | ✅   | ✅              | Compatível |

## Troubleshooting

### "Não conecta ao MQTT"
1. Verificar URL do broker
2. Verificar se WebSocket está ativo (porta 9001, 8083, etc)
3. Verificar CORS se for broker remoto

### "Acessibilidade não aparece"
1. Verificar console para erros
2. Clicar no botão 👁️ Acessibilidade
3. Garantir que `Accessibility.enabled === true`

### "Mensagens não chegam"
1. Verificar Network tab para frames MQTT
2. Verificar que o broker está rodando
3. Verificar tópicos: `tron/game/state`, `tron/events/sounds`

## Próximos Passos

- [ ] Adicionar suporte a WebRTC para transmissão de vídeo
- [ ] Implementar gravação de partidas
- [ ] Dashboard de espectadores
- [ ] Relatórios de acessibilidade
- [ ] Suporte a TTS (Text-to-Speech)

## Licença

Mesmo que o projeto TRON

## Contribuindo

Pull requests bem-vindos! Para mudanças grandes, abra uma issue primeiro.
