# 🎮 TRON - Sistema MQTT & Acessibilidade

## 🌐 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                      🎮 TRON Game Browser                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────┐              ┌──────────────────────┐ │
│  │   HOST (Jogador)     │              │ SPECTATORS (Viewers) │ │
│  │                      │              │                      │ │
│  │ • Joga normalmente   │              │ • Veem a partida     │ │
│  │ • Publica eventos    │──WebSocket──▶│ • Recebem legendas   │ │
│  │ • Transmite estado   │  (MQTT)      │ • Ouvem/veem sons    │ │
│  │                      │              │                      │ │
│  └──────────────────────┘              └──────────────────────┘ │
│           │                                       │              │
│           ▼                                       ▼              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         transmission.js (Coordenador)                    │   │
│  │  • Sincroniza eventos                                   │   │
│  │  • Coordena com MQTT e Acessibilidade                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│           │                      │                               │
│           ▼                      ▼                               │
│  ┌──────────────────┐  ┌─────────────────────────────────────┐ │
│  │  mqtt-client.js  │  │     accessibility.js                │ │
│  │                  │  │                                     │ │
│  │ Publica/Subscreve│  │ • Converte sons em texto            │ │
│  │ Tópicos MQTT     │  │ • Display visual com emojis         │ │
│  │ Reconexão auto   │  │ • Suporte multilíngue (PT-BR, EN)   │ │
│  │ QoS 1            │  │ • ARIA labels                       │ │
│  └──────────────────┘  └─────────────────────────────────────┘ │
│           │                                                     │
│           ▼                                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │     Paho MQTT (Biblioteca JavaScript)                     │  │
│  │  • Traduz protocolo MQTT                                  │  │
│  │  • Gerencia conexão WebSocket                             │  │
│  │  • Pub/Sub de tópicos                                     │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────┐
         │  MQTT Broker                   │
         │  (Eclipse Mosquitto)           │
         │                                │
         │  Tópicos:                      │
         │  • tron/game/state             │
         │  • tron/events/sounds          │
         │  • tron/spectators             │
         └────────────────────────────────┘
```

## 🔄 Fluxo de Mensagens

### 1. Evento de Som no Host

```
Jogador dispara laser
        ↓
sounds.js (som original)
        ↓
transmission.js intercepta
        ↓
mqtt-client.js publica em tron/events/sounds
        ↓
Paho MQTT (codifica MQTT)
        ↓
WebSocket (ws://)
        ↓
Broker MQTT (Eclipse Mosquitto)
```

### 2. Espectador Recebe e Exibe

```
Broker MQTT
        ↓
mqtt-client.js subscreve tron/events/sounds
        ↓
Paho MQTT (decodifica MQTT)
        ↓
WebSocket (ws://)
        ↓
transmission.js notifica
        ↓
accessibility.js
        ↓
Display Visual: ⚡ "Disparo de laser"
```

## 📡 Tópicos MQTT

### Estrutura

```
tron/
├── game/
│   └── state              - Estado geral da partida
│       {players[], round, status}
├── events/
│   └── sounds             - Eventos de som
│       {type, player, position, timestamp}
└── spectators             - Info de espectadores
    {count, viewers[], timestamp}
```

### QoS e Retenção

| Tópico | QoS | Retained | Descrição |
|--------|-----|----------|-----------|
| tron/game/state | 1 | Sim | Estado atualizado, espectadores pegam último |
| tron/events/sounds | 1 | Não | Eventos transientes, sem histórico |
| tron/spectators | 1 | Não | Info de espectadores online |

## 🎤 Eventos Transmitidos

| Evento | Ícone | Tópico | Descrição | QoS |
|--------|-------|--------|-----------|-----|
| laser | ⚡ | tron/events/sounds | Disparo de laser | 1 |
| throw | 💣 | tron/events/sounds | Arma lançada | 1 |
| derez | 💥 | tron/events/sounds | Personagem derrotado | 1 |
| portal | 🌀 | tron/events/sounds | Portal aberto | 1 |
| moto_engine | 🏍️ | tron/events/sounds | Motor acelerado | 1 |
| collision | 💔 | tron/events/sounds | Colisão detectada | 1 |
| energy_low | ⚠️ | tron/events/sounds | Energia baixa | 1 |
| energy_boost | ⚡ | tron/events/sounds | Energia recuperada | 1 |
| victory | 🏆 | tron/events/sounds | Vitória! | 1 |
| game_over | ⏹️ | tron/events/sounds | Jogo finalizado | 1 |
| game_start | ▶️ | tron/events/sounds | Jogo iniciado | 1 |

## 🔧 Arquitetura de Módulos

### mqtt-client.js (6.8 KB)
```
MQTTClient
├── initialize(brokerUrl, onConnect, onDisconnect)
├── publish(topic, data)
├── subscribe(topic, callback)
├── unsubscribe(topic)
├── disconnect()
├── getStatus()
├── getSubscriptions()
└── [Private]
    ├── _initPaho()
    ├── _attemptReconnect()
    ├── _handleMessage(topic, payload)
    └── _handleConnectionError(error)
```

### accessibility.js (11 KB)
```
Accessibility
├── initialize()
├── toggle()
├── addSoundEvent(type, description, info)
├── setLanguage(lang)
├── describePlayerState(name, state)
├── getStatus()
└── [Private]
    ├── _createUI()
    ├── _updateDisplay()
    ├── _clearOldMessages()
    └── _injectCSS()
```

### transmission.js (5.6 KB)
```
GameTransmission
├── initialize(isSpectator, brokerUrl)
├── onLaserFired(player, position)
├── onWeaponThrown(player, weapon, position)
├── onPlayerDefeated(player, defeatedBy)
├── onCollision(player1, player2)
├── onPortalOpened(position)
├── onGameStart()
├── onGameOver()
├── onVictory(winner)
├── updatePlayerState(player, state)
└── getStatus()
```

## 📊 Fluxo de Reconexão

```
Conectado ──────────────────────── Desconexão (perda de rede)
                                        │
                                        ▼
                          Tentativa 1: aguarda 5s
                                        │
                                        ├─► Sucesso? ──→ Conectado ✅
                                        │
                                        ▼
                          Tentativa 2: aguarda 10s
                                        │
                                        ├─► Sucesso? ──→ Conectado ✅
                                        │
                                        ▼
                          Tentativa 3: aguarda 15s
                                        │
                                        ├─► Sucesso? ──→ Conectado ✅
                                        │
                                        ▼
                                   ...
                                        │
                                        ▼
                         Tentativa 10: aguarda 50s
                                        │
                                        ├─► Sucesso? ──→ Conectado ✅
                                        │
                                        ▼
                          Falha Total: Error Message
```

## 🎯 Estados da Aplicação

```
┌─────────────────────────────────┐
│      Jogo Carregado             │
│ (Paho MQTT carregado via CDN)   │
└──────────────┬──────────────────┘
               │
        ┌──────▼──────┐
        │   Usuário   │
        │   Executa   │
        │  conectar   │
        └──────┬──────┘
               │
        ┌──────▼──────────────────┐
        │    Modo Selecionado     │
        ├──────────────────────────┤
        │  Sim ──┐          ┌─── Não
        │        │          │
        ▼        │          ▼
     HOST      │        SPECTATOR
   (publica)    │       (subscreve)
        │        │          │
        └────┬───┘          └────┬───┐
             │                    │   │
             ▼                    │   ▼
       Publicando              Recebendo
       eventos                 legendas
             │                    │
             └────────┬───────────┘
                      │
                      ▼
              Display em Tempo Real
```

## 🔐 Segurança

### Transporte
- **Desenvolvimento**: `ws://` (não encriptado)
- **Produção**: `wss://` (com TLS/SSL)

### Autenticação (Opcional)
```javascript
// Se broker exigir usuário/senha
client.connect({
  useSSL: true,
  userName: "user",
  password: "pass"
})
```

## 📈 Performance

### Latência Tipicamente Observada
- **Local (Docker)**: 5-10ms
- **Mesmo datacenter**: 20-50ms
- **Broker público (país)**: 50-100ms
- **Intercontinental**: 100-300ms

### Throttling
O sistema aguarda 50ms entre publicações (configurável em mqtt-config.json)

## 🧪 Teste do Fluxo Completo

```
1. Abrir Jogo
   └─ index.html carrega
      └─ Paho MQTT via CDN
         └─ mqtt-client.js, accessibility.js, transmission.js

2. Host: connectAsHost()
   └─ MQTTClient conecta a ws://mqtt.eclipseprojects.io:9001
      └─ Subscreve: tron/game/state, tron/events/sounds
         └─ Status: ✓ Conectado

3. Spectator: connectAsSpectator()
   └─ MQTTClient conecta (mesmo broker)
      └─ Subscreve: tron/game/state, tron/events/sounds
         └─ Status: ✓ Conectado como espectador

4. Spectator: toggleAccessibility()
   └─ Accessibility.initialize()
      └─ Display criado
         └─ Status: ♿ Acessibilidade ativada

5. Host: Dispara laser no jogo
   └─ sounds.js reproduz som
      └─ transmission.js intercepta
         └─ mqtt-client.js publica em tron/events/sounds
            └─ Paho MQTT envia via WebSocket
               └─ Broker recebe e distribui
                  └─ Spectator recebe
                     └─ Accessibility exibe: ⚡ "Disparo de laser"

6. ✅ Resultado Final
   └─ Host joga, Espectador vê legendas em tempo real
```

## 📚 Arquivos de Suporte

### Configuração
- **mqtt-config.json** - Brokers, tópicos, eventos, temas

### Exemplos
- **integration-example.js** - Padrões de integração
- **INTEGRATION-GUIDE.js** - Comentários detalhados

### Testes
- **test-suite.js** - 12 testes automatizados
- **test-page.html** - Interface visual

## 🎓 Hierarquia de Documentação

```
Iniciante (5 min)
  ↓
QUICK-START.md
  ├─ Ler: QUICK-REFERENCE.md
  └─ Testar: connectAsHost()

Desenvolvedor (30 min)
  ↓
MQTT-ACCESSIBILITY-README.md
  ├─ Entender: MQTT-WEBSOCKET-PROTOCOL.md
  └─ Integrar: INTEGRATION-GUIDE.js

Mantedor (2+ horas)
  ↓
IMPLEMENTATION-SUMMARY.md
  ├─ Estudar: Código fonte
  ├─ Testar: TESTING-GUIDE.md
  └─ Evoluir: CHANGELOG-MQTT-UPDATES.md
```

## 🚀 Comandos Principais

```javascript
// Inicializar
connectAsHost()
connectAsSpectator()

// Controlar Acessibilidade
toggleAccessibility()

// Status
MQTTClient.isConnected
MQTTClient.getStatus()

// Testar
TestSuite.runAll()
TestSuite.interactive()

// Debug
console.log(MQTTClient.getSubscriptions())
Accessibility.addSoundEvent("laser", "Teste")
```

## ✨ Pontos-Chave

1. **MQTT sobre WebSocket** - Protocolo MQTT via WebSocket
2. **Paho MQTT** - Biblioteca responsável pela tradução
3. **Broker Flexível** - Suporta público/local/customizado
4. **Acessibilidade** - Legendas sincronizadas com sons
5. **Sem Dependencies NPM** - Apenas CDN + JS puro
6. **Zero Breaking Changes** - Jogo original intacto

## 📊 Estatísticas

- **Tópicos MQTT**: 3
- **Tipos de Eventos**: 11
- **Idiomas**: 2 (PT-BR, EN)
- **Testes Automatizados**: 12
- **Documentos**: 11
- **Módulos de Código**: 5
- **Linhas de Código**: ~2000
- **Linhas de Documentação**: ~15000

---

**Status**: ✅ Sistema Completo e Operacional  
**Versão**: 1.0.0  
**Pronto para Produção**: Sim ✅

Comece agora: Execute `connectAsHost()` no console! 🚀
