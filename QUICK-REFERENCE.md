# 🎯 Referência Rápida - MQTT & Acessibilidade TRON

## ⚡ Comandos Essenciais

### No Console do Navegador (F12)

```javascript
// ========== INICIALIZAÇÃO ==========
connectAsHost()                          // Modo transmissor (jogador)
connectAsSpectator()                     // Modo receptor (espectador)
connectAsHost("ws://localhost:9001")     // Com broker customizado
connectAsSpectator("wss://custom.com:8883")

// ========== ACESSIBILIDADE ==========
toggleAccessibility()                    // Ativar/desativar legendas
Accessibility.toggle()                   // Mesmo acima
Accessibility.setLanguage("en")          // Trocar para inglês
Accessibility.setLanguage("pt")          // Trocar para português

// ========== STATUS & DEBUG ==========
MQTTClient.isConnected                   // true/false
MQTTClient.getStatus()                   // Status completo
MQTTClient.getSubscriptions()            // Tópicos inscritos
GameTransmission.getStatus()             // Status da transmissão

// ========== TESTES ==========
TestSuite.runAll()                       // Todos os testes (automático)
TestSuite.interactive()                  // Modo interativo com perguntas

// ========== EVENTOS (manual) ==========
Accessibility.addSoundEvent("laser", "Laser disparado")
Accessibility.addSoundEvent("victory", "Jogador 1 venceu!")
GameTransmission.onLaserFired("Player1", {x: 512, y: 384})
GameTransmission.onPlayerDefeated("Player2", "Player1")
GameTransmission.onGameOver()
GameTransmission.onVictory("Player1")
```

## 📊 Tópicos MQTT

```
tron/game/state       → Estado geral da partida
tron/events/sounds    → Eventos de som (laser, throw, etc)
tron/spectators       → Info de espectadores conectados
```

## 🎮 Eventos de Som

| Evento | Emoji | Descrição | Código |
|--------|-------|-----------|--------|
| laser | ⚡ | Disparo de laser | `laser` |
| throw | 💣 | Arma lançada | `throw` |
| derez | 💥 | Personagem derrotado | `derez` |
| portal | 🌀 | Portal aberto | `portal` |
| moto_engine | 🏍️ | Motor acelerado | `moto_engine` |
| collision | 💔 | Colisão detectada | `collision` |
| energy_low | ⚠️ | Energia baixa | `energy_low` |
| energy_boost | ⚡ | Energia recuperada | `energy_boost` |
| victory | 🏆 | Vitória! | `victory` |
| game_over | ⏹️ | Jogo finalizado | `game_over` |
| game_start | ▶️ | Jogo iniciado | `game_start` |

## 🌐 Brokers Disponíveis

### Público (sem config)

```javascript
// ⭐ Recomendado
connectAsHost("wss://feira-de-jogos.dev.br/mqtt")

// Alternativas
connectAsHost("wss://broker.hivemq.com:8884")        // MQTT 5.0
connectAsHost("wss://broker.emqx.io:8883")           // Alta performance
```

### Local (Docker)

```bash
# Mosquitto
docker run -d --name mosquitto -p 9001:9001 eclipse-mosquitto

# EMQX
docker run -d --name emqx -p 8083:8083 emqx/emqx

# No console:
connectAsHost("ws://localhost:9001")
```

## 📁 Arquivos Principais

| Arquivo | Descrição |
|---------|-----------|
| `mqtt-client.js` | Cliente MQTT sobre WebSocket |
| `accessibility.js` | Sistema de legendas para surdos |
| `transmission.js` | Coordenador MQTT + Acessibilidade |
| `integration-example.js` | Exemplos de integração |
| `test-suite.js` | 12 testes automatizados |
| `test-page.html` | Interface visual de testes |
| `mqtt-config.json` | Configuração centralizada |

## 📚 Documentação

| Doc | Conteúdo |
|-----|----------|
| `QUICK-START.md` | Início rápido (5 min) |
| `MQTT-ACCESSIBILITY-README.md` | API completa |
| `MQTT-WEBSOCKET-PROTOCOL.md` | 🆕 Guia do protocolo |
| `TESTING-GUIDE.md` | 🆕 Guia de testes |
| `IMPLEMENTATION-SUMMARY.md` | Resumo técnico |
| `CHANGELOG-MQTT-UPDATES.md` | 🆕 O que mudou |
| `INTEGRATION-GUIDE.js` | Exemplos de código |

## 🔧 Configurações

### MQTT
- **QoS**: 1 (at least once)
- **Keepalive**: 60s
- **Reconexão**: backoff exponencial (5s → 50s)
- **Max tentativas**: 10

### Acessibilidade
- **Max mensagens**: 5 no display
- **Timeout**: 4 segundos
- **Temas**: 2 (claro/escuro)
- **Idiomas**: PT-BR, EN

## ⚠️ Requisitos

### Obrigatório
- Navegador moderno (Chrome, Firefox, Safari, Edge)
- JavaScript habilitado
- Biblioteca Paho MQTT (carregada automaticamente via CDN)

### Recomendado
- Conexão de internet estável
- Broker MQTT com suporte a WebSocket
- WebSocket não bloqueado por firewall

## 🚀 Início Rápido

```javascript
// Passo 1: Abrir console (F12)
// Passo 2: Copiar e colar:
connectAsHost()
toggleAccessibility()

// Passo 3: Jogar! 🎮
```

## 🐛 Problemas Comuns

```javascript
// Problema: "Biblioteca Paho MQTT não encontrada"
// Solução:
const s = document.createElement('script')
s.src = 'https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.min.js'
document.head.appendChild(s)

// Problema: "Conexão recusada"
// Solução: Testar com broker diferente
connectAsHost("wss://broker.hivemq.com:8884")

// Problema: "Espectador não recebe eventos"
// Solução: Verificar se host está conectado
console.log(MQTTClient.isConnected)
MQTTClient.publish("tron/events/sounds", {type: "laser"})
```

## 📈 Performance

| Métrica | Esperado |
|---------|----------|
| Latência | < 100ms (local), < 200ms (remoto) |
| Conexão | < 1s |
| Reconexão | < 10s |
| Memória | < 50MB durante gameplay |
| CPU | < 5% |

## ✅ Checklist

- [ ] Paho MQTT carregado (`window.Paho` existe)
- [ ] Host conectado (console mostra "Conectado")
- [ ] Espectador conectado
- [ ] Acessibilidade ativa (botão ♿ visível)
- [ ] Eventos aparecem em tempo real
- [ ] Múltiplos espectadores sincronizados
- [ ] Latência aceitável

## 🔗 Links Úteis

- Paho MQTT: https://www.eclipse.org/paho/clients/js/
- MQTT Spec: http://mqtt.org/
- Mosquitto: https://mosquitto.org/
- HiveMQ: https://www.hivemq.com/
- EMQX: https://www.emqx.com/

## 🎉 Tudo Pronto?

```javascript
// Teste rápido
connectAsHost()
console.log("✅ PRONTO!" if MQTTClient.isConnected else "❌ ERRO")
```

Sucesso! Sistema está operacional. 🚀

---
**Última atualização**: 2024-11-06  
**Versão**: 1.0.0
