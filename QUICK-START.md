# Guia Rápido de Iniciação - MQTT & Acessibilidade TRON

## 🔧 Pré-requisitos

- **Navegador moderno** com suporte a WebSocket e JavaScript
- **Biblioteca Paho MQTT** (já carregada automaticamente no index.html via CDN)
- **Broker MQTT com suporte a WebSocket** (exemplos abaixo)

### Brokers Disponíveis

| Broker | URL | Tipo | Descrição |
|--------|-----|------|-----------|
| **Eclipse Mosquitto** ⭐ | `wss://mqtt.feira-de-jogos.dev.br/mqtt` | Público | Recomendado - MQTT sobre WebSocket |
| **HiveMQ** | `wss://broker.hivemq.com:8884` | Público | MQTT 5.0 seguro |
| **EMQX** | `wss://broker.emqx.io:8883` | Público | Alta performance |
| **Local (Docker)** | `ws://localhost:9001` | Local | Para desenvolvimento |


### 🐛 Nota: Correção de Propriedades

Se vir erro `"Unknown property, reconnect"`:
- ✅ Já foi corrigido! (Recarregue a página com Ctrl+F5)
- Paho MQTT v1.0.1 não suporta `reconnect` automático
- Ver: `PAHO-MQTT-PROPERTIES.md` para detalhes
### ⚠️ Importante: MQTT sobre WebSocket vs WebSocket Puro

- **O servidor WebSocket NÃO usa WebSocket puro**
- **Usa MQTT sobre WebSocket** (protocolo MQTT transportado via WebSocket)
- A biblioteca Paho MQTT é responsável por traduzir entre JavaScript e o protocolo MQTT
- Brokers devem ser configurados com suporte a MQTT sobre WebSocket

## 🚀 Quick Start (30 segundos)

### Cenário 1: Jogar com Legendas (Acessibilidade para Surdos)

1. Abra o jogo TRON normalmente
2. Abra o **Console do Navegador** (F12)
3. Cole e execute:
```javascript
toggleAccessibility()
```
4. Pronto! Todos os sons serão exibidos como texto

### Cenário 2: Transmitir Partida para Espectadores

1. **No computador do jogador (HOST):**
   - Abra o console (F12)
   - Execute:
   ```javascript
   connectAsHost()
   ```
   - Jogue normalmente

2. **No computador do espectador:**
   - Abra o console (F12)
   - Execute:
   ```javascript
   connectAsSpectator()
   toggleAccessibility()
   ```
   - Veja a partida com legendas em tempo real!

### Cenário 3: Usar Broker Customizado

```javascript
// Host com broker customizado
connectAsHost("wss://seu-broker.com:8883")

// Espectador com broker customizado
connectAsSpectator("wss://seu-broker.com:8883")
```

## 📋 Checklist de Funcionalidades

- ✅ MQTT via WebSocket
- ✅ Transmissão de estado em tempo real
- ✅ Legendas para surdos
- ✅ Múltiplos espectadores simultâneos
- ✅ Eventos de som sincronizados
- ✅ UI acessível com emojis
- ✅ Suporte multilíngue (PT-BR, EN)
- ✅ Fallback WebSocket puro
- ✅ Sem dependências externas necessárias

## 🎮 Eventos Disponíveis

Durante o jogo, os seguintes eventos são transmitidos automaticamente:

```
⚡ Laser disparado
💣 Arma lançada
💥 Personagem derrotado
🌀 Portal aberto
🏍️ Motor acelerado
💔 Colisão detectada
⚠️ Energia baixa
⚡ Energia recuperada
🏆 Vitória!
⏹️ Jogo finalizado
▶️ Jogo iniciado
```

## 🧪 Testar as Funcionalidades

Abra o console e execute:

```javascript
// Ver testes disponíveis
TestSuite.interactive()

// Executar todos os testes
TestSuite.runAll()

// Testar conexão MQTT como host
TestSuite.testMQTTHostConnection()

// Testar acessibilidade
TestSuite.testAccessibilityToggle()

// Simular uma sequência de jogo
TestSuite.testGameplaySequence()
```

## 🔍 Verificar Status

```javascript
// Status MQTT
MQTTClient.getStatus()

// Status de acessibilidade
Accessibility.getStatus()

// Status completo
GameTransmission.getStatus()
```

## 📱 Modo Multiplayer

### Setup:
1. **Computador A (Host):**
   ```javascript
   connectAsHost()
   // Joga normalmente
   ```

2. **Computador B (Espectador 1):**
   ```javascript
   connectAsSpectator()
   toggleAccessibility()
   // Vê a partida com legendas
   ```

3. **Computador C (Espectador 2):**
   ```javascript
   connectAsSpectator()
   toggleAccessibility()
   // Também vê a partida
   ```

### Todos os Espectadores:
- Veem a mesma partida em tempo real
- Têm legendas sincronizadas
- Podem ligar/desligar legendas independentemente

## ♿ Acessibilidade para Surdos

### Ativar:
```javascript
Accessibility.toggle()
```

### O que é exibido:
- 🎯 Botão flutuante (👁️ Acessibilidade) no canto inferior direito
- 📝 Painel de legendas mostrando últimos 5 eventos
- ⏱️ Timestamp de cada evento
- 📊 Cores diferentes por tipo de evento

### Personalizações:
```javascript
// Máximo de mensagens visíveis
Accessibility.maxMessages = 10

// Tempo que mensagem fica visível (ms)
Accessibility.messageTimeout = 6000
```

## 🌐 Brokers Públicos Disponíveis

### Eclipse Mosquitto (Padrão - Sem Ação Necessária)
- URL: `mqtt.eclipseprojects.io:9001`
- Já configurado por padrão

### HiveMQ
```javascript
connectAsHost("wss://broker.hivemq.com:8884")
```

### Mosquitto Padrão Local
```javascript
// Se você rodou Mosquitto localmente
connectAsHost("wss://localhost:9001")
```

## 🐳 Rodar seu próprio Broker (Opcional)

### Com Docker:
```bash
# Mosquitto
docker run -it -p 8883:8883 -p 9001:9001 eclipse-mosquitto

# EMQX (alternativa)
docker run -d --name emqx -p 1883:1883 -p 8883:8883 -p 8083:8083 -p 8084:8084 emqx/emqx
```

Depois use:
```javascript
connectAsHost("wss://localhost:9001")
```

## 📊 Monitorar Tópicos MQTT

Se tiver cliente MQTT instalado (mosquitto_sub):

```bash
# Monitorar estado do jogo
mosquitto_sub -h mqtt.eclipseprojects.io -t "tron/game/state"

# Monitorar eventos de som
mosquitto_sub -h mqtt.eclipseprojects.io -t "tron/events/sounds"

# Monitorar espectadores
mosquitto_sub -h mqtt.eclipseprojects.io -t "tron/spectators"
```

## 🐛 Troubleshooting

### Problema: "Não conecta ao MQTT"
**Solução:**
```javascript
// Verificar status
MQTTClient.getStatus()

// Reiniciar conexão
MQTTClient.disconnect()
connectAsHost()
```

### Problema: "Acessibilidade não mostra"
**Solução:**
```javascript
// Verificar se está ativada
Accessibility.getStatus()

// Ativar forçadamente
Accessibility.enabled = true
Accessibility._updateDisplay()
```

### Problema: "Mensagens não chegam"
**Solução:**
```javascript
// Verificar Network > WebSocket no DevTools
// Procurar por "mqtt.eclipseprojects.io"

// Verificar frames de mensagem MQTT
// Ver aba "Messages" no WebSocket
```

## 🎓 Exemplos Avançados

### Transmitir com evento customizado:
```javascript
GameTransmission.onLaserFired("Player1", {x: 100, y: 200})
```

### Adicionar descrição customizada:
```javascript
Accessibility.addSoundEvent("laser", "Player1 atirou no player2!", "Momento crítico")
```

### Exportar log de acessibilidade:
```javascript
TRONIntegration.exportAccessibilityLog()
```

## 📞 Suporte

Dúvidas? Verifique:
1. Console do navegador (F12) para erros
2. Network tab para conexão MQTT
3. Documentação completa em `MQTT-ACCESSIBILITY-README.md`

## 🎉 Pronto!

Você está pronto para:
- ✨ Jogar com acessibilidade
- 📡 Transmitir partidas
- 👥 Ter múltiplos espectadores
- ♿ Assistir com legendas

Divirta-se no GRID CITY COMBAT! 🏍️💡
