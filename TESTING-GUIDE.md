# 🧪 Guia de Testes - MQTT & Acessibilidade TRON

## Teste Rápido (2 minutos)

### 1️⃣ Abra o jogo TRON

```
https://seu-dominio/tron/index.html
```

### 2️⃣ Abra o Console (F12)

Aperte `F12` e vá para a aba "Console"

### 3️⃣ Execute em Modo Host

```javascript
connectAsHost()
```

Você deve ver no console:
```
[MQTT] ✓ Conectado ao broker mqtt.eclipseprojects.io:9001
[MQTT] ✓ Inscrito no tópico tron/game/state
[MQTT] ✓ Inscrito no tópico tron/events/sounds
```

### 4️⃣ Verifique o Status

```javascript
console.log(MQTTClient.isConnected ? "✅ CONECTADO" : "❌ DESCONECTADO")
console.log(MQTTClient.getStatus())
```

Esperado:
```
✅ CONECTADO
{
  isConnected: true,
  brokerUrl: "ws://mqtt.eclipseprojects.io:9001",
  clientId: "tron_xyz123",
  subscriptions: ["tron/game/state", "tron/events/sounds"]
}
```

## Teste Completo (15 minutos)

### Cenário 1: Transmissão Host→Espectador

#### Na Máquina 1 (Host/Jogador)

```javascript
// Abrir Console
connectAsHost()

// Esperar "Conectado" no console
// Jogar normalmente
```

#### Na Máquina 2 (Espectador)

```javascript
// Abrir Console
connectAsSpectator()

// Ativar legendas
toggleAccessibility()

// Abrir DevTools para ver eventos
```

**Verificações**:
- ✅ Espectador vê "Conectado como espectador" no console
- ✅ Quando host dispara laser, espectador vê: `⚡ Disparo de laser`
- ✅ Eventos aparecem em tempo real (< 100ms)
- ✅ Legendas aparecem no display visual

### Cenário 2: Múltiplos Espectadores

#### Máquina 1 (Host)
```javascript
connectAsHost()
```

#### Máquina 2 (Espectador A)
```javascript
connectAsSpectator()
toggleAccessibility()
```

#### Máquina 3 (Espectador B)
```javascript
connectAsSpectator()
toggleAccessibility()
```

**Verificações**:
- ✅ Ambos espectadores recebem eventos sincronizados
- ✅ Sem perda de mensagens
- ✅ Sem conflitos de conexão

### Cenário 3: Reconexão Automática

#### Terminal
```bash
# Desligar broker (se usar Docker local)
docker stop mosquitto
```

#### Console (host/espectador)
```javascript
// Monitorar no console
// Você verá tentativas de reconexão:
// [MQTT] Tentativa 1/10 de reconexão em 5000ms
// [MQTT] Tentativa 2/10 de reconexão em 10000ms
```

#### Terminal
```bash
# Religar broker
docker start mosquitto
```

**Verificações**:
- ✅ Cliente reconecta automaticamente
- ✅ Mensagens continuam funcionando
- ✅ Sem perda permanente de conexão

## Teste de Acessibilidade

### Ativar Legendas

```javascript
toggleAccessibility()
```

Você verá um botão flutuante com ♿ símbolo de acessibilidade

### Testar Eventos

```javascript
// Adicionar evento manualmente
Accessibility.addSoundEvent("laser", "⚡ Laser disparado pelo jogador 1")

// Trocar idioma para inglês
Accessibility.setLanguage("en")

// Testar outro evento
Accessibility.addSoundEvent("victory", "🏆 Jogador 1 venceu!")
```

**Verificações**:
- ✅ Mensagens aparecem no display
- ✅ Desaparecem após 4 segundos
- ✅ Histórico mostra últimas 5 mensagens
- ✅ Idioma muda corretamente

## Teste com Broker Customizado

### Local (Docker)

```bash
# Iniciar Mosquitto
docker run -d --name mosquitto \
  -p 9001:9001 \
  -p 1883:1883 \
  eclipse-mosquitto
```

```javascript
// Conectar ao broker local
connectAsHost("ws://localhost:9001")

// Verificar
MQTTClient.isConnected ? "✅ LOCAL OK" : "❌ ERRO"
```

### Remoto (HiveMQ)

```javascript
// Conectar ao HiveMQ
connectAsHost("wss://broker.hivemq.com:8884")

// Verificar
MQTTClient.isConnected ? "✅ HIVEMQ OK" : "❌ ERRO"
```

## Testes Automatizados

### Executar Suite Completa

```javascript
// Modo automático (rápido)
TestSuite.runAll()

// Modo interativo (detalhado)
TestSuite.interactive()
```

**Testes inclusos:**
1. ✅ Inicialização do cliente MQTT
2. ✅ Conexão com broker
3. ✅ Publicação de mensagens
4. ✅ Subscrição a tópicos
5. ✅ Reconexão após desconexão
6. ✅ Acessibilidade básica
7. ✅ Adicionar/remover eventos
8. ✅ Trocar idioma
9. ✅ Toggle acessibilidade
10. ✅ Sincronização host/espectador
11. ✅ Stress test (100+ eventos)
12. ✅ Limpeza de recursos

### Resultado Esperado

```
✅ Test 1: MQTT Client Initialization - PASSED
✅ Test 2: Broker Connection - PASSED
✅ Test 3: Message Publishing - PASSED
✅ Test 4: Topic Subscription - PASSED
✅ Test 5: Reconnection Logic - PASSED
✅ Test 6: Accessibility Toggle - PASSED
✅ Test 7: Sound Event Queue - PASSED
✅ Test 8: Language Switching - PASSED
✅ Test 9: Accessibility Feature - PASSED
✅ Test 10: Host-Spectator Sync - PASSED
✅ Test 11: Stress Test - PASSED
✅ Test 12: Resource Cleanup - PASSED

Total: 12 PASSED, 0 FAILED
```

## Teste de Performance

### Verificar Latência

```javascript
// Publicar muitos eventos rapidamente
for (let i = 0; i < 100; i++) {
  GameTransmission.onLaserFired("Player1", {x: Math.random()*800, y: Math.random()*600})
}

// Monitorar tempo de entrega no console
// Esperado: < 200ms latência
```

### Monitorar Memória

```javascript
// Abrir DevTools > Performance > Memory
// Iniciar gravação
// Jogar por 1 minuto com acessibilidade ligada
// Parar gravação

// Esperado: Sem memory leaks visíveis
// Aumento máximo de 50MB durante gameplay
```

## Troubleshooting

### ❌ "Biblioteca Paho MQTT não encontrada"

**Causa**: Paho MQTT não foi carregado

**Solução**:
```javascript
// Verificar se biblioteca existe
console.log(window.Paho ? "✅ Paho carregado" : "❌ Paho falta")

// Carregar manualmente se necessário
const script = document.createElement('script')
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.min.js'
document.head.appendChild(script)
script.onload = () => console.log("✅ Paho carregado manualmente")
```

### ❌ "Conexão recusada"

**Causa**: Broker offline ou URL incorreta

**Solução**:
```javascript
// Verificar URL do broker
console.log(MQTTClient.brokerUrl)

// Testar conectividade
fetch('https://mqtt.eclipseprojects.io').catch(e => console.log("Broker OK"))

// Tentar outro broker
connectAsHost("wss://broker.hivemq.com:8884")
```

### ❌ "Sem eventos recebidos no espectador"

**Causa**: Host não conectou ou topics errados

**Solução**:
```javascript
// No HOST - verificar status
console.log("Host conectado?", MQTTClient.isConnected)
console.log("Subscrito em:", MQTTClient.getSubscriptions())

// Testar publicação manual
MQTTClient.publish("tron/events/sounds", {type: "laser"})

// No ESPECTADOR - verificar recebimento
console.log("Espectador conectado?", MQTTClient.isConnected)
```

## Checklist de Validação

- [ ] Biblioteca Paho MQTT carrega sem erros
- [ ] Host conecta ao broker com sucesso
- [ ] Espectador conecta como espectador
- [ ] Eventos são publicados em tempo real
- [ ] Acessibilidade exibe legendas corretamente
- [ ] Múltiplos espectadores recebem sincronizados
- [ ] Reconexão funciona após perda de conexão
- [ ] Sem memory leaks durante gameplay
- [ ] Latência < 200ms
- [ ] Funciona em navegadores modernos:
  - [ ] Chrome/Edge (desktop)
  - [ ] Firefox (desktop)
  - [ ] Safari (desktop)
  - [ ] Mobile (iOS/Android)

## Próximas Melhorias

- [ ] TTS (Text-to-Speech) para acessibilidade auditiva
- [ ] Persistência de histórico de eventos
- [ ] Dashboard de espectadores
- [ ] Estatísticas em tempo real
- [ ] Gravação de replays
- [ ] Integração com plataformas de streaming (Twitch)

---

**Teste com sucesso? Parabéns!** 🎉

Sistema está pronto para produção.

Para dúvidas, consulte:
- MQTT-WEBSOCKET-PROTOCOL.md
- QUICK-START.md
- INTEGRATION-GUIDE.js
