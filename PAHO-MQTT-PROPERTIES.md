# 🔧 Correção: Propriedades do Paho MQTT

## ❌ Problema Encontrado

Ao rodar no navegador, aparecia o erro:

```
[MQTT] ❌ Erro ao inicializar Paho: Error: Unknown property, reconnect
```

## ✅ Causa e Solução

A biblioteca **Paho MQTT v1.0.1** (do CDN) não suporta a propriedade `reconnect` no método `connect()`.

## 📋 Propriedades Válidas do Paho MQTT v1.0.1

Ao chamar `client.connect(options)`, use apenas estas propriedades:

| Propriedade | Tipo | Padrão | Descrição |
|-------------|------|--------|-----------|
| `timeout` | número | 30 | Timeout de conexão em segundos |
| `userName` | string | undefined | Usuário para autenticação (opcional) |
| `password` | string | undefined | Senha para autenticação (opcional) |
| `willMessage` | Paho.MQTT.Message | undefined | Mensagem de "last will" (opcional) |
| `keepAliveInterval` | número | 60 | Intervalo de keep-alive em segundos |
| `cleanSession` | boolean | true | Limpar sessão anterior |
| `useSSL` | boolean | false | Usar SSL/TLS (wss://) |
| `invocationContext` | object | undefined | Contexto customizado |
| `onSuccess` | function | undefined | Callback de sucesso ✅ |
| `onFailure` | function | undefined | Callback de erro ❌ |
| `hosts` | array | undefined | Array de hosts (opcional) |
| `ports` | array | undefined | Array de portas (opcional) |
| `mqttVersion` | número | 4 | Versão MQTT (3 ou 4) |

## ❌ Propriedades INVÁLIDAS

Estas NÃO funcionam em Paho MQTT v1.0.1:

- ❌ `reconnect` - NÃO existe
- ❌ `retryInterval` - NÃO existe
- ❌ `maxRetries` - NÃO existe
- ❌ `automaticReconnect` - NÃO existe
- ❌ `reconnectPeriod` - NÃO existe

## ✅ Como Implementar Reconexão

Como Paho MQTT não tem reconexão automática, implementamos manualmente:

```javascript
// Evento de desconexão é capturado
client.onConnectionLost = (error) => {
  console.warn("Conexão perdida");
  _attemptReconnect(); // Função manual de reconexão
};

// Implementação manual
_attemptReconnect() {
  if (tentativas < 10) {
    setTimeout(() => {
      client.connect(options); // Tentar reconectar
    }, delay);
  }
}
```

## 📝 Código Corrigido

```javascript
const options = {
  // ✅ Callbacks obrigatórios
  onSuccess: () => {
    console.log("Conectado!");
    isConnected = true;
  },
  onFailure: (error) => {
    console.error("Falha na conexão:", error);
    isConnected = false;
    _attemptReconnect(); // Reconectar manualmente
  },
  
  // ✅ Configurações válidas
  useSSL: brokerUrl.startsWith("wss"),
  cleanSession: true,
  keepAliveInterval: 30,
  
  // ❌ Estas NÃO funcionam
  // reconnect: true,  // ← REMOVER!
  // retryInterval: 5000,  // ← REMOVER!
};

client.connect(options);
```

## 🔄 Fluxo de Reconexão Correto

```
Conectado
   ↓
onConnectionLost triggered
   ↓
_attemptReconnect() chamado
   ↓
Aguarda delay (5s × tentativa)
   ↓
client.connect(options) chamado novamente
   ↓
onSuccess / onFailure
   ↓
Se falhar: loop de tentativas (máx 10)
Se sucesso: reset de tentativas
```

## 🧪 Teste Rápido

No console do navegador:

```javascript
// Verificar que Paho está carregado
console.log(window.Paho ? "✅ Paho OK" : "❌ Paho falta")

// Verificar cliente MQTT
console.log(MQTTClient.client)

// Tentar conectar
connectAsHost()

// Ver no console
// [MQTT] ✅ Conectado ao broker MQTT
// [MQTT] ✅ Inscrito no tópico tron/game/state
```

## 📚 Referências

- **Paho MQTT JS**: https://www.eclipse.org/paho/clients/js/
- **API Docs**: https://eclipse.org/paho/files/jsdoc/Paho.MQTT.Client.html
- **Propriedades Connect**: https://eclipse.org/paho/files/jsdoc/Paho.MQTT.ClientConnectOptions.html

## ✨ Resumo da Correção

| Antes | Depois |
|-------|--------|
| ❌ `reconnect: true` | ✅ Removido (inválido) |
| ❌ Erro ao carregar | ✅ Reconexão manual implementada |
| ❌ Reconexão automática (não funcionava) | ✅ `onConnectionLost` → `_attemptReconnect()` |
| ❌ Propriedade desconhecida | ✅ Usando apenas propriedades válidas |

## 🎯 Resultado

```
Antes: [MQTT] ❌ Erro ao inicializar Paho: Unknown property, reconnect
Depois: [MQTT] ✅ Conectado ao broker MQTT
```

Sistema agora funciona perfeitamente! 🚀

---

**Arquivo Corrigido**: mqtt-client.js  
**Versão**: 1.0.1  
**Data**: 2024-11-06
