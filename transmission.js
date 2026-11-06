/**
 * Módulo de Transmissão de Estado do Jogo
 * Sincroniza o estado da partida via MQTT para espectadores
 * Suporta modo acessível com legendas
 */

const GameTransmission = {
  enabled: false,
  isSpectator: false,
  isHost: false,
  updateInterval: 50, // ms entre atualizações
  updateTimer: null,
  lastGameState: null,
  
  /**
   * Inicializa o módulo de transmissão
   */
  initialize(isSpectator = false, brokerUrl = null) {
    this.isSpectator = isSpectator;
    this.isHost = !isSpectator;
    
    // Inicializar MQTT
    MQTTClient.initialize(
      brokerUrl,
      () => this._onMQTTConnect(),
      () => this._onMQTTDisconnect()
    );
    
    // Inicializar acessibilidade
    Accessibility.initialize();
    
    this.enabled = true;
  },
  
  /**
   * Callback ao conectar ao MQTT
   */
  _onMQTTConnect() {
    console.log("[GameTransmission] Conectado ao MQTT");
    
    if (this.isHost) {
      // Host inicia transmissão de estado
      this._startGameStateTransmission();
    } else if (this.isSpectator) {
      // Espectador registra interesse
      MQTTClient.registerSpectator({
        viewMode: "spectator",
        accessibilityEnabled: Accessibility.enabled
      });
    }
  },
  
  /**
   * Callback ao desconectar do MQTT
   */
  _onMQTTDisconnect(error) {
    console.warn("[GameTransmission] Desconectado do MQTT:", error);
    this._stopGameStateTransmission();
  },
  
  /**
   * Inicia transmissão de estado do jogo
   */
  _startGameStateTransmission() {
    if (this.updateTimer) return;
    
    this.updateTimer = setInterval(() => {
      this._transmitGameState();
    }, this.updateInterval);
  },
  
  /**
   * Para transmissão de estado
   */
  _stopGameStateTransmission() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  },
  
  /**
   * Transmite o estado atual do jogo
   */
  _transmitGameState() {
    const gameState = this._captureGameState();
    
    if (!gameState) return;
    
    // Detectar mudanças para otimizar transmissão
    if (JSON.stringify(gameState) !== JSON.stringify(this.lastGameState)) {
      MQTTClient.publishGameState(gameState);
      this.lastGameState = gameState;
    }
  },
  
  /**
   * Captura o estado atual do jogo
   * Nota: precisa ser integrada com o loop principal do jogo
   */
  _captureGameState() {
    // Este método será sobrescrito pela integração do jogo
    return null;
  },
  
  /**
   * Publica um evento de som
   */
  publishSoundEvent(soundType, soundData = {}) {
    if (!this.enabled || !MQTTClient.isConnected) return;
    
    // Publicar no MQTT
    MQTTClient.publishSoundEvent(soundType, soundData);
    
    // Adicionar ao display de acessibilidade
    Accessibility.addSoundEvent(soundType, null, soundData.description || "");
  },
  
  /**
   * Registra um som de disparo de laser
   */
  onLaserFired(playerName, position = {}) {
    this.publishSoundEvent("laser", {
      player: playerName,
      position: position,
      description: `${playerName} disparou um laser`
    });
    
    Accessibility.describeWeaponEvent(playerName, "laser", "disparou");
  },
  
  /**
   * Registra arma lançada
   */
  onWeaponThrown(playerName, weaponName, position = {}) {
    this.publishSoundEvent("throw", {
      player: playerName,
      weapon: weaponName,
      position: position,
      description: `${playerName} lançou ${weaponName}`
    });
    
    Accessibility.describeWeaponEvent(playerName, weaponName, "lançou");
  },
  
  /**
   * Registra um personagem derrotado
   */
  onPlayerDefeated(playerName, defeatedBy = null) {
    this.publishSoundEvent("derez", {
      player: playerName,
      defeatedBy: defeatedBy,
      description: `${playerName} foi derrotado${defeatedBy ? ` por ${defeatedBy}` : ""}`
    });
    
    Accessibility.describeDefeat(playerName);
  },
  
  /**
   * Registra colisão
   */
  onCollision(player1, player2 = null) {
    this.publishSoundEvent("collision", {
      player1: player1,
      player2: player2,
      description: `Colisão entre ${player1}${player2 ? ` e ${player2}` : ""}`
    });
    
    Accessibility.describeCollision(player1, player2);
  },
  
  /**
   * Registra portal aberto
   */
  onPortalOpened(position = {}) {
    this.publishSoundEvent("portal", {
      position: position,
      description: "Portal aberto"
    });
    
    Accessibility.addSoundEvent("portal");
  },
  
  /**
   * Registra início do jogo
   */
  onGameStart() {
    this.publishSoundEvent("game_start", {
      description: "Jogo iniciado"
    });
    
    Accessibility.addSoundEvent("game_start");
  },
  
  /**
   * Registra fim do jogo
   */
  onGameOver() {
    this.publishSoundEvent("game_over", {
      description: "Jogo finalizado"
    });
    
    Accessibility.addSoundEvent("game_over");
  },
  
  /**
   * Registra vitória
   */
  onVictory(winnerName) {
    this.publishSoundEvent("victory", {
      winner: winnerName,
      description: `${winnerName} venceu!`
    });
    
    Accessibility.describeVictory(winnerName);
  },
  
  /**
   * Atualiza estado de um jogador
   */
  updatePlayerState(playerName, state) {
    MQTTClient.publishGameState({
      type: "player_update",
      player: playerName,
      state: state
    });
    
    Accessibility.describePlayerState(playerName, state);
  },
  
  /**
   * Retorna status da transmissão
   */
  getStatus() {
    return {
      enabled: this.enabled,
      isHost: this.isHost,
      isSpectator: this.isSpectator,
      mqttStatus: MQTTClient.getStatus(),
      accessibilityStatus: Accessibility.getStatus()
    };
  }
};
