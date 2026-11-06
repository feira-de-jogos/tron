/**
 * Cliente MQTT WebSocket para transmissão de estado do jogo
 * Suporta múltiplos espectadores sincronizados
 */

const MQTTClient = {
  client: null,
  isConnected: false,
  brokerUrl: "ws://mqtt.eclipseprojects.io:9001", // Broker público padrão
  clientId: `tron_${Math.random().toString(36).substr(2, 9)}`,
  gameTopic: "tron/game/state",
  spectatorsTopic: "tron/spectators",
  soundEventsTopic: "tron/events/sounds",
  
  /**
   * Inicializa a conexão MQTT
   * @param {string} brokerUrl - URL do broker MQTT WebSocket
   * @param {function} onConnect - Callback ao conectar
   * @param {function} onDisconnect - Callback ao desconectar
   */
  initialize(brokerUrl = null, onConnect = null, onDisconnect = null) {
    if (brokerUrl) this.brokerUrl = brokerUrl;
    
    this.onConnect = onConnect;
    this.onDisconnect = onDisconnect;
    
    // Usar biblioteca paho-mqtt se disponível, caso contrário usar fallback WebSocket
    if (typeof Paho !== "undefined") {
      this._initPaho();
    } else {
      this._initWebSocketFallback();
    }
  },
  
  /**
   * Inicializa com cliente Paho MQTT
   */
  _initPaho() {
    try {
      this.client = new Paho.MQTT.Client(
        this.brokerUrl.replace("ws://", "").replace("wss://", ""),
        9001,
        this.clientId
      );
      
      this.client.onConnectionLost = (error) => {
        console.warn("[MQTT] Conexão perdida:", error);
        this.isConnected = false;
        if (this.onDisconnect) this.onDisconnect(error);
      };
      
      this.client.onMessageArrived = (message) => {
        this._handleMessage(message.destinationName, message.payloadString);
      };
      
      const options = {
        onSuccess: () => {
          console.log("[MQTT] Conectado ao broker");
          this.isConnected = true;
          this._subscribeTopics();
          if (this.onConnect) this.onConnect();
        },
        onFailure: (error) => {
          console.error("[MQTT] Falha na conexão:", error);
          this.isConnected = false;
        },
        useSSL: this.brokerUrl.startsWith("wss"),
        cleanSession: true
      };
      
      this.client.connect(options);
    } catch (e) {
      console.error("[MQTT] Erro ao inicializar Paho:", e);
      this._initWebSocketFallback();
    }
  },
  
  /**
   * Inicializa com fallback WebSocket simples
   */
  _initWebSocketFallback() {
    console.log("[MQTT] Usando fallback WebSocket");
    try {
      this.ws = new WebSocket(this.brokerUrl);
      this.ws.onopen = () => {
        console.log("[MQTT] WebSocket conectado");
        this.isConnected = true;
        if (this.onConnect) this.onConnect();
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this._handleMessage(data.topic, JSON.stringify(data.payload));
        } catch (e) {
          console.error("[MQTT] Erro ao parsear mensagem:", e);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error("[MQTT] WebSocket erro:", error);
      };
      
      this.ws.onclose = () => {
        console.log("[MQTT] WebSocket desconectado");
        this.isConnected = false;
        if (this.onDisconnect) this.onDisconnect();
      };
    } catch (e) {
      console.error("[MQTT] Erro ao inicializar WebSocket:", e);
    }
  },
  
  /**
   * Inscreve nos tópicos principais
   */
  _subscribeTopics() {
    if (this.client && this.client.subscribe) {
      this.client.subscribe(this.gameTopic);
      this.client.subscribe(this.soundEventsTopic);
      this.client.subscribe(this.spectatorsTopic);
    } else if (this.ws) {
      // Enviar mensagem de inscrição via WebSocket
      this.ws.send(JSON.stringify({
        action: "subscribe",
        topics: [this.gameTopic, this.soundEventsTopic, this.spectatorsTopic]
      }));
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
    
    const message = {
      timestamp: Date.now(),
      clientId: this.clientId,
      ...gameState
    };
    
    this._publish(this.gameTopic, message);
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
   * Publica mensagem no tópico
   */
  _publish(topic, data) {
    const payload = JSON.stringify(data);
    
    if (this.client && this.client.publish) {
      try {
        this.client.publish(
          topic,
          payload,
          1, // QoS
          false // retain
        );
      } catch (e) {
        console.error("[MQTT] Erro ao publicar:", e);
      }
    } else if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: "publish",
        topic: topic,
        payload: data
      }));
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
