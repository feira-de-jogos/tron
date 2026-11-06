# 🌐 MQTT sobre WebSocket - Entendendo o Protocolo

## O Que é MQTT sobre WebSocket?

MQTT sobre WebSocket é o **protocolo MQTT encapsulado dentro de conexões WebSocket**, permitindo que navegadores web se conectem a brokers MQTT através de websockets.

### Diferença: WebSocket Puro vs MQTT sobre WebSocket

| Aspecto | WebSocket Puro | MQTT sobre WebSocket |
|---------|-----------------|---------------------|
| **Transporte** | WebSocket bruto | WebSocket encapsulado |
| **Protocolo** | Definido pela aplicação (JSON, dados binários, etc) | MQTT (padrão ISO/IEC) |
| **Biblioteca** | APIs nativas do navegador | Paho MQTT (traduz MQTT para WebSocket) |
| **Porta Padrão** | 9000, 8080, custom | 9001 (ws), 8884 (wss) |
| **Exemplo** | `ws://localhost:9000` | `wss://feira-de-jogos.dev.br/mqtt` |

## Por Que Usar MQTT sobre WebSocket?

### ✅ Vantagens

1. **Protocolo Padronizado**: MQTT é padrão ISO/IEC 20922
2. **Eficiente**: Menor overhead que JSON/HTTP
3. **Pub/Sub Nativo**: Subscrição a tópicos integrada
4. **QoS Garantido**: Níveis de entrega (0, 1, 2)
5. **Suporte Ubíquo**: Funciona em qualquer broker MQTT moderno
6. **Escalável**: Suporta milhões de clientes simultâneos

### ❌ Quando NÃO Usar

- APIs REST simples são mais fáceis para casos simples
- Aplicações que precisam apenas de HTTP puro
- Clientes que não precisam de pub/sub real-time

## Como Funciona no TRON

### 1. **Inicialização da Conexão**

```
Browser (JavaScript)
  ↓
  └─ Paho MQTT (biblioteca)
      ↓
      └─ WebSocket (transporte)
          ↓
          └─ Broker MQTT (mqtt.eclipseprojects.io:9001)
```

### 2. **Fluxo de Mensagem**

**Host (Jogador transmitindo):**
```
Evento de Som (laser disparado)
  ↓
transmission.js (wrapper)
  ↓
MQTTClient.publish() 
  ↓
Paho MQTT (codifica em protocolo MQTT)
  ↓
WebSocket (envia via ws://)
  ↓
Broker MQTT
  ↓
Tópico: tron/events/sounds
```

**Espectador (recebendo):**
```
Broker MQTT (tron/events/sounds)
  ↓
WebSocket (ws://)
  ↓
Paho MQTT (decodifica protocolo MQTT)
  ↓
MQTTClient.onMessage()
  ↓
Accessibility.addSoundEvent()
  ↓
Display Visual (⚡ Disparo de laser)
```

## Brokers Compatíveis

### Recomendados

#### 1. **Eclipse Mosquitto** ⭐ (Recomendado)
- **URL**: `wss://feira-de-jogos.dev.br/mqtt`
- **Tipo**: Público
- **QoS**: 0, 1, 2
- **Características**:
  - Broker open-source mais popular
  - Estável e confiável
  - Sem autenticação necessária
  - Excelente para testes

#### 2. **HiveMQ**
- **URL**: `wss://broker.hivemq.com:8884` (seguro)
- **Tipo**: Público
- **Características**:
  - MQTT 5.0 completo
  - Gerenciado e escalável
  - SSL/TLS por padrão
  - Dashboard web

#### 3. **EMQX**
- **URL**: `wss://broker.emqx.io:8883` (seguro)
- **Tipo**: Público
- **Características**:
  - Alta performance
  - Suporte clustering
  - REST API integrada

### Para Desenvolvimento Local

#### Docker + Mosquitto
```bash
docker run -d --name mosquitto \
  -p 9001:9001 \
  -p 1883:1883 \
  eclipse-mosquitto
```

Conectar com: `ws://localhost:9001`

#### Docker + EMQX
```bash
docker run -d --name emqx \
  -p 8083:8083 \
  -p 1883:1883 \
  emqx/emqx
```

Conectar com: `ws://localhost:8083`

## Tópicos MQTT no TRON

### Estrutura de Tópicos

```
tron/                              # Namespace do jogo
├── game/state                     # Estado geral da partida
│   └── Payload: {players[], round, status}
├── events/
│   └── sounds                     # Eventos de som
│       └── Payload: {type, player, data}
└── spectators                     # Info de espectadores
    └── Payload: {count, viewers[]}
```

### Exemplos de Publicação

**Evento de Laser Disparado:**
```
Topic: tron/events/sounds
QoS: 1
Message: {
  "type": "laser",
  "player": "Usuario1",
  "position": [512, 384],
  "timestamp": 1699000000123
}
```

**Atualização de Estado:**
```
Topic: tron/game/state
QoS: 1
Message: {
  "players": [
    { "name": "Usuario1", "x": 512, "y": 384, "energy": 85 },
    { "name": "Usuario2", "x": 256, "y": 128, "energy": 60 }
  ],
  "round": 3,
  "status": "playing",
  "timestamp": 1699000000123
}
```

## Reconexão Automática

O cliente MQTT implementa **backoff exponencial** para reconectar:

```
Tentativa 1: Aguarda 5s
Tentativa 2: Aguarda 10s
Tentativa 3: Aguarda 15s
...
Tentativa 10: Aguarda 50s (máximo)
```

Se após 10 tentativas falhar, exibe erro com link para CDN do Paho MQTT.

## Segurança

### WSS (WebSocket Seguro)

Para produção, use `wss://` em vez de `ws://`:

```javascript
// Desenvolvimento (sem SSL)
connectAsHost("wss://feira-de-jogos.dev.br/mqtt")

// Produção (com SSL)
connectAsHost("wss://broker.emqx.io:8883")
```

### Autenticação (Opcional)

Se o broker exigir autenticação:

```javascript
// Modificar mqtt-client.js:
this.client.connect({
  useSSL: true,
  userName: "seu-usuario",
  password: "sua-senha",
  onSuccess: () => { /* ... */ },
  onFailure: () => { /* ... */ }
});
```

## Troubleshooting

### Erro: "Biblioteca Paho MQTT não encontrada"

**Causa**: Paho MQTT não foi carregado
**Solução**: Abrir DevTools e verificar se `window.Paho` existe:

```javascript
console.log(window.Paho) // Deve mostrar objeto Paho
```

Se undefined, carregue a biblioteca manualmente no console:
```javascript
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.min.js';
document.head.appendChild(script);
```

### Erro: "Conexão recusada"

**Possíveis causas**:
1. Broker offline
2. Porta incorreta (deve ser 9001 para ws, 8883/8884 para wss)
3. Firewall bloqueando WebSocket
4. Broker não tem suporte a WebSocket

**Solução**: Testar conectividade:
```bash
# Instalar wscat
npm install -g wscat

# Testar conexão
wscat -c wss://feira-de-jogos.dev.br/mqtt
```

### Erro: "Tempo limite de conexão"

**Causa**: Broker não responde em tempo hábil
**Solução**: Aumentar timeout ou usar broker mais próximo geograficamente

## Performance

### QoS (Quality of Service)

O TRON usa **QoS 1** (at least once):

| QoS | Garantia | Overhead | Uso |
|-----|----------|----------|-----|
| 0 | Nenhuma | Mínimo | Eventos que podem ser perdidos |
| 1 | Pelo menos uma vez | Médio | **TRON - Eventos de som** |
| 2 | Exatamente uma vez | Alto | Transações críticas |

### Latência Típica

- **Local (Docker)**: < 5ms
- **Broker Público (mesmo país)**: 10-50ms
- **Broker Remoto (outro país)**: 50-200ms

Para o TRON, latências até 200ms são aceitáveis.

## Referências

- [MQTT Specification](http://mqtt.org/)
- [Paho MQTT JavaScript](https://www.eclipse.org/paho/clients/js/)
- [HiveMQ MQTT Introduction](https://www.hivemq.com/mqtt-essentials/)
- [Eclipse Mosquitto](https://mosquitto.org/)
- [EMQX Documentation](https://docs.emqx.com/)

## Próximos Passos

1. ✅ Configurar broker (recomendado: Eclipse Mosquitto)
2. ✅ Carregar biblioteca Paho MQTT
3. ✅ Inicializar em modo Host/Espectador
4. ✅ Monitorar console para logs de conexão
5. ✅ Ativar acessibilidade para legendas

```javascript
// Teste rápido
connectAsHost()
console.log("Status:", MQTTClient.isConnected ? "✅ Conectado" : "❌ Desconectado")
```
