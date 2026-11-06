/**
 * Cliente MQTT sobre WebSocket para transmissão de estado do jogo
 * Suporta múltiplos espectadores sincronizados
 * 
 * NOTA: Requer broker com suporte a MQTT sobre WebSocket (não WebSocket puro)
 * Exemplos: Eclipse Mosquitto, HiveMQ, EMQX
 */

const MQTTClient = {
  client: null,
  isConnected: false,
  brokerUrl: "wss://mqtt.feira-de-jogos.dev.br/mqtt", // Broker principal (MQTT sobre WebSocket seguro)
  clientId: `tron_${Math.random().toString(36).substr(2, 9)}`,
  gameTopic: "tron/game/state",
  spectatorsTopic: "tron/spectators",
  soundEventsTopic: "tron/events/sounds",
  reconnectInterval: 5000,
  reconnectAttempts: 0,
  maxReconnectAttempts: 10,
  timeout: 30000, // 30 segundos timeout de conexão
  keepAliveInterval: 60, // 60 segundos keep-alive (aumentado de 30)
  reconnectScheduled: false, // Flag para evitar reconexões simultâneas
  
  /**
   * Inicializa a conexão MQTT sobre WebSocket
   * @param {string} brokerUrl - URL do broker MQTT WebSocket (ws:// ou wss://)
   * @param {function} onConnect - Callback ao conectar
   * @param {function} onDisconnect - Callback ao desconectar
   */
  initialize(brokerUrl = null, onConnect = null, onDisconnect = null) {
    if (brokerUrl) this.brokerUrl = brokerUrl;
    
    this.onConnect = onConnect;
    this.onDisconnect = onDisconnect;
    this.reconnectAttempts = 0;
    this.reconnectScheduled = false; // Reset da flag
    
    // Usar biblioteca paho-mqtt se disponível
    if (typeof Paho !== "undefined") {
      this._initPaho();
    } else {
      console.error("[MQTT] Biblioteca Paho MQTT não encontrada!");
      console.error("[MQTT] Por favor, inclua a biblioteca Paho MQTT no HTML:");
      console.error("[MQTT] <script src='https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.min.js'></script>");
      this._handleConnectionError("Biblioteca Paho MQTT não encontrada");
    }
  },
  
  /**
   * Inicializa com cliente Paho MQTT sobre WebSocket
   */
  _initPaho() {
    try {
      // Extrair host, porta e caminho da URL (ex: wss://mqtt.feira-de-jogos.dev.br/mqtt)
      let url = this.brokerUrl;
      let isSecure = url.startsWith("wss://");
      
      // Remove protocolo
      let hostPath = url.replace("wss://", "").replace("ws://", "");
      
      // Separar host+porta do caminho
      let host, port, path = "/mqtt"; // caminho padrão
      
      if (hostPath.includes("/")) {
        const parts = hostPath.split("/");
        host = parts[0];
        path = "/" + parts.slice(1).join("/");
      } else {
        host = hostPath;
      }
      
      // Extrair porta do host se existir
      if (host.includes(":")) {
        const parts = host.split(":");
        host = parts[0];
        port = parseInt(parts[1]);
      } else {
        // Porta padrão: 443 para wss://, 9001 para ws://
        port = isSecure ? 443 : 9001;
      }
      
      // Criar cliente Paho MQTT com host, porta, caminho e clientId
      this.client = new Paho.MQTT.Client(host, port, path, this.clientId);
      
      // Callbacks de conexão/desconexão
      this.client.onConnectionLost = (error) => {
        console.warn("[MQTT] Conexão perdida:", error.errorMessage || error);
        this.isConnected = false;
        
        if (this.onDisconnect) {
          this.onDisconnect(error);
        }
        
        // Tentar reconectar
        this._attemptReconnect();
      };
      
      // Callback para mensagens recebidas
      this.client.onMessageArrived = (message) => {
        this._handleMessage(message.destinationName, message.payloadString);
      };
      
      // Opções de conexão (propriedades válidas do Paho MQTT)
      const options = {
        onSuccess: () => {
          console.log("[MQTT] ✅ Conectado ao broker MQTT");
          console.log("[MQTT] Host:", this.brokerUrl);
          console.log("[MQTT] Client ID:", this.clientId);
          
          this.isConnected = true;
          this.reconnectAttempts = 0; // Reset de tentativas
          this.reconnectScheduled = false; // Reset da flag de reconexão
          
          // Inscrever nos tópicos
          this._subscribeTopics();
          
          if (this.onConnect) {
            this.onConnect();
          }
        },
        
        onFailure: (error) => {
          console.error("[MQTT] ❌ Falha na conexão:", error.errorMessage || error);
          this.isConnected = false;
          this.reconnectScheduled = false; // Reset da flag
          this._attemptReconnect();
        },
        
        useSSL: this.brokerUrl.startsWith("wss"),
        cleanSession: true,
        keepAliveInterval: this.keepAliveInterval, // 60 segundos
        timeout: this.timeout, // 30 segundos timeout
        // Nota: 'reconnect' não é suportado pelo Paho MQTT v1.0.1
        // A reconexão é implementada manualmente em _attemptReconnect()
      };
      
      // Conectar ao broker
      this.client.connect(options);
      
    } catch (e) {
      console.error("[MQTT] ❌ Erro ao inicializar Paho:", e);
      this._handleConnectionError(e);
    }
  },
  
  /**
   * Tenta reconectar ao broker
   */
  _attemptReconnect() {
    // Evitar reconexões simultâneas
    if (this.reconnectScheduled) {
      return;
    }
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectInterval * this.reconnectAttempts;
      
      this.reconnectScheduled = true;
      
      console.warn(
        `[MQTT] Tentando reconectar em ${delay}ms... (tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );
      
      setTimeout(() => {
        this.reconnectScheduled = false;
        
        // Verificar se ainda está desconectado antes de reconectar
        if (!this.isConnected) {
          this.initialize(null, this.onConnect, this.onDisconnect);
        }
      }, delay);
    } else {
      console.error("[MQTT] ❌ Máximo de tentativas de reconexão atingido");
      this._handleConnectionError("Máximo de reconexões atingido");
    }
  },
  
  /**
   * Trata erros de conexão
   */
  _handleConnectionError(error) {
    console.error("[MQTT] ❌ Erro fatal de conexão:", error);
    console.error("[MQTT] Verifique:");
    console.error("[MQTT]  1. URL do broker está correta?");
    console.error("[MQTT]  2. Broker aceita MQTT sobre WebSocket?");
    console.error("[MQTT]  3. Biblioteca Paho MQTT está carregada?");
    
    if (this.onDisconnect) {
      this.onDisconnect({errorMessage: error});
    }
  },
  
  /**
   * Inscreve nos tópicos principais
   */
  _subscribeTopics() {
    if (this.client && this.client.subscribe) {
      try {
        this.client.subscribe(this.gameTopic);
        this.client.subscribe(this.soundEventsTopic);
        this.client.subscribe(this.spectatorsTopic);
        
        console.log("[MQTT] ✅ Inscrito nos tópicos:");
        console.log(`       - ${this.gameTopic}`);
        console.log(`       - ${this.soundEventsTopic}`);
        console.log(`       - ${this.spectatorsTopic}`);
      } catch (e) {
        console.error("[MQTT] ❌ Erro ao inscrever nos tópicos:", e);
      }
    }
  },
  
  /**
   * Processa mensagens recebidas
   */
  _handleMessage(topic, payload) {
    try {
      const data = typeof payload === "string" ? JSON.parse(payload) : payload;
      
      if (topic === this.gameTopic) {
        this._onGameState(data);
      } else if (topic === this.soundEventsTopic) {
        this._onSoundEvent(data);
      } else if (topic === this.spectatorsTopic) {
        this._onSpectatorUpdate(data);
      }
    } catch (e) {
      console.error("[MQTT] Erro ao processar mensagem:", e);
    }
  },
  
  /**
   * Callback para atualização de estado do jogo
   */
  _onGameState(gameState) {
    if (this.onGameState) {
      this.onGameState(gameState);
    }
  },
  
  /**
   * Callback para eventos de som
   */
  _onSoundEvent(soundEvent) {
    if (this.onSoundEvent) {
      this.onSoundEvent(soundEvent);
    }
  },
  
  /**
   * Callback para atualizações de espectadores
   */
  _onSpectatorUpdate(spectatorData) {
    if (this.onSpectatorUpdate) {
      this.onSpectatorUpdate(spectatorData);
    }
  },
  
  /**
   * Publica o estado atual do jogo
   */
  publishGameState(gameState) {
    if (!this.isConnected) {
      console.warn("[MQTT] Não conectado, estado não publicado");
      return;
    }
    
    // Validar que gameState é um objeto válido
    if (!gameState || typeof gameState !== "object") {
      console.warn("[MQTT] ❌ Estado do jogo inválido para publicação:", gameState);
      return;
    }
    
    try {
      const message = {
        timestamp: Date.now(),
        clientId: this.clientId,
        ...gameState
      };
      
      this._publish(this.gameTopic, message);
    } catch (e) {
      console.error("[MQTT] ❌ Erro ao publicar estado do jogo:", e);
    }
  },
  
  /**
   * Publica um evento de som
   */
  publishSoundEvent(soundType, soundData = {}) {
    if (!this.isConnected) return;
    
    const message = {
      timestamp: Date.now(),
      clientId: this.clientId,
      soundType: soundType,
      soundData: soundData
    };
    
    this._publish(this.soundEventsTopic, message);
  },
  
  /**
   * Registra como espectador
   */
  registerSpectator(spectatorInfo = {}) {
    if (!this.isConnected) return;
    
    const message = {
      timestamp: Date.now(),
      clientId: this.clientId,
      action: "join",
      isSpectator: true,
      ...spectatorInfo
    };
    
    this._publish(this.spectatorsTopic, message);
  },
  
  /**
   * Publica mensagem no tópico MQTT
   */
  _publish(topic, data) {
    if (!this.isConnected) {
      console.warn("[MQTT] ❌ Não conectado ao broker - mensagem não publicada");
      return;
    }
    
    try {
      // Validar payload
      const payload = JSON.stringify(data);
      
      if (!payload || payload.length === 0) {
        console.warn("[MQTT] ❌ Payload vazio");
        return;
      }
      
      // Limitar tamanho do payload (max 128KB para MQTT)
      if (payload.length > 128000) {
        console.warn("[MQTT] ❌ Payload muito grande:", payload.length, "bytes");
        return;
      }
      
      if (this.client && this.client.send) {
        const message = new Paho.MQTT.Message(payload);
        message.destinationName = topic;
        message.qos = 1; // QoS 1: at least once delivery
        message.retained = false;
        
        this.client.send(message);
        console.log(`[MQTT] ✓ Publicado em ${topic} (${payload.length} bytes)`);
      } else {
        console.error("[MQTT] ❌ Cliente MQTT não disponível para publicação");
      }
    } catch (e) {
      console.error("[MQTT] ❌ Erro ao publicar:", e.message || e);
    }
  },
  
  /**
   * Desconecta do broker
   */
  disconnect() {
    if (this.client && this.client.disconnect) {
      this.client.disconnect();
    } else if (this.ws) {
      this.ws.close();
    }
    this.isConnected = false;
  },
  
  /**
   * Retorna status de conexão
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      clientId: this.clientId,
      brokerUrl: this.brokerUrl
    };
  }
};
