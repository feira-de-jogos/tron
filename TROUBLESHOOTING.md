# 🔧 Troubleshooting Rápido - MQTT TRON

## ❌ Erro: "Unknown property, reconnect"

**Solução**: ✅ Já corrigido! (commit 45bb1e5)

Se ainda vir este erro:
1. Limpe o cache (Ctrl+Shift+Del)
2. Recarregue a página (Ctrl+F5)
3. Abra console (F12)

Resultado esperado:
```
[MQTT] ✅ Conectado ao broker MQTT
[MQTT] ✓ Inscrito no tópico tron/game/state
```

---

## ✅ Teste Rápido (30 segundos)

```javascript
// 1. Verificar Paho MQTT
console.log(window.Paho ? "✅ OK" : "❌ Falta")

// 2. Conectar como Host
connectAsHost()

// 3. Ver status (deve aparecer no console):
// [MQTT] ✅ Conectado ao broker MQTT
// [MQTT] Client ID: tron_xxx
// [MQTT] ✓ Inscrito em tópicos

// 4. Verificar conexão
console.log(MQTTClient.isConnected ? "✅ Conectado" : "❌ Erro")
```

---

## 🎯 Comandos Principais

```javascript
// Inicializar
connectAsHost()                    // Host/transmissor
connectAsSpectator()               // Espectador

// Customizar broker
connectAsHost("ws://localhost:9001")

// Legendas/Acessibilidade
toggleAccessibility()              // Ativar/desativar

// Ver status
MQTTClient.isConnected             // true/false
MQTTClient.getStatus()             // Status completo
MQTTClient.getSubscriptions()      // Tópicos inscritos

// Testar
TestSuite.runAll()                 // Todos os testes
TestSuite.interactive()            // Com perguntas

// Debug
Accessibility.addSoundEvent("laser", "Test")  // Teste manual
```

---

## 🌐 Brokers Para Testar

### Público (sem config)
```javascript
connectAsHost("ws://mqtt.eclipseprojects.io:9001")  // ⭐ Padrão
connectAsHost("wss://broker.hivemq.com:8884")       // SSL
connectAsHost("wss://broker.emqx.io:8883")          // SSL
```

### Local (Docker)
```bash
# Terminal
docker run -d --name mosquitto -p 9001:9001 eclipse-mosquitto

# Console
connectAsHost("ws://localhost:9001")
```

---

## 🚨 Problemas Comuns

### ❌ "Biblioteca Paho MQTT não encontrada"
- CDN não carregou
- Solução: Recarregar página ou Internet offline

### ❌ "Conexão recusada"
- Broker offline ou URL incorreta
- Solução: Testar outro broker

### ❌ "Sem eventos recebidos"
- Host não conectou ou tópicos errados
- Solução: Ver console para erros

### ❌ "Legendas não aparecem"
- Acessibilidade não foi ativada
- Solução: `toggleAccessibility()`

---

## 📋 Checklist

- [ ] Cache limpo (Ctrl+Shift+Del)
- [ ] Página recarregada (Ctrl+F5)
- [ ] Console aberto (F12)
- [ ] Paho MQTT carregado (`window.Paho`)
- [ ] `connectAsHost()` executado
- [ ] Mensagem de sucesso no console
- [ ] `MQTTClient.isConnected === true`

---

## 📞 Mais Informações

- Paho MQTT Properties: `PAHO-MQTT-PROPERTIES.md`
- Guia Completo: `MQTT-WEBSOCKET-PROTOCOL.md`
- Testes: `TESTING-GUIDE.md`
- Quick Start: `QUICK-START.md`

---

**Sistema está funcionando? Parabéns!** 🎉

Próximo: `toggleAccessibility()` para ver legendas! ♿
