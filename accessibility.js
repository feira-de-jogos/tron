/**
 * Módulo de Acessibilidade para TRON
 * Converte eventos de som em texto para usuários surdos
 * Suporta descrições em tempo real dos eventos do jogo
 */

const Accessibility = {
  enabled: false,
  displayElement: null,
  messageQueue: [],
  maxMessages: 5,
  messageTimeout: 4000,
  
  // Mapeamento de tipos de sons para descrições acessíveis
  soundDescriptions: {
    laser: {
      pt: "⚡ Disparo de laser",
      en: "⚡ Laser fired",
      icon: "⚡"
    },
    throw: {
      pt: "💣 Arma lançada",
      en: "💣 Weapon thrown",
      icon: "💣"
    },
    derez: {
      pt: "💥 Personagem derrotado",
      en: "💥 Character defeated",
      icon: "💥"
    },
    portal: {
      pt: "🌀 Portal aberto",
      en: "🌀 Portal opened",
      icon: "🌀"
    },
    moto_engine: {
      pt: "🏍️ Motor acelerado",
      en: "🏍️ Engine accelerated",
      icon: "🏍️"
    },
    background_pad: {
      pt: "🎵 Música de fundo",
      en: "🎵 Background music",
      icon: "🎵"
    },
    game_start: {
      pt: "▶️ Jogo iniciado",
      en: "▶️ Game started",
      icon: "▶️"
    },
    game_over: {
      pt: "⏹️ Jogo finalizado",
      en: "⏹️ Game over",
      icon: "⏹️"
    },
    victory: {
      pt: "🏆 Vitória!",
      en: "🏆 Victory!",
      icon: "🏆"
    },
    collision: {
      pt: "💔 Colisão detectada",
      en: "💔 Collision detected",
      icon: "💔"
    },
    energy_low: {
      pt: "⚠️ Energia baixa",
      en: "⚠️ Low energy",
      icon: "⚠️"
    },
    energy_boost: {
      pt: "⚡ Energia recuperada",
      en: "⚡ Energy restored",
      icon: "⚡"
    },
    player_action: {
      pt: "👤 Ação do jogador",
      en: "👤 Player action",
      icon: "👤"
    }
  },
  
  /**
   * Inicializa o módulo de acessibilidade
   */
  initialize() {
    // Criar elemento para exibição de mensagens
    this.displayElement = document.createElement("div");
    this.displayElement.id = "accessibility-display";
    this.displayElement.setAttribute("aria-live", "polite");
    this.displayElement.setAttribute("aria-atomic", "true");
    this.displayElement.className = "accessibility-display";
    
    // Criar botão de toggle
    const toggleButton = document.createElement("button");
    toggleButton.id = "accessibility-toggle";
    toggleButton.className = "accessibility-toggle";
    toggleButton.innerHTML = "👁️ Acessibilidade";
    toggleButton.title = "Ativar/Desativar modo acessível (legenda de sons)";
    toggleButton.onclick = () => this.toggle();
    
    // Criar painel de informações
    const infoPanel = document.createElement("div");
    infoPanel.id = "accessibility-info";
    infoPanel.className = "accessibility-info escondido";
    infoPanel.innerHTML = `
      <h3>Modo Acessível Ativo</h3>
      <p>Descrições de som em tempo real</p>
      <div id="accessibility-status">Aguardando eventos...</div>
    `;
    
    // Adicionar elementos ao DOM
    const gameContainer = document.getElementById("game-container");
    if (gameContainer) {
      gameContainer.appendChild(this.displayElement);
      gameContainer.appendChild(toggleButton);
      gameContainer.appendChild(infoPanel);
    }
  },
  
  /**
   * Ativa/desativa o modo acessível
   */
  toggle() {
    this.enabled = !this.enabled;
    const btn = document.getElementById("accessibility-toggle");
    const info = document.getElementById("accessibility-info");
    
    if (this.enabled) {
      btn.classList.add("active");
      if (info) info.classList.remove("escondido");
      console.log("[Acessibilidade] Modo ativado");
    } else {
      btn.classList.remove("active");
      if (info) info.classList.add("escondido");
      this.messageQueue = [];
      this._updateDisplay();
      console.log("[Acessibilidade] Modo desativado");
    }
  },
  
  /**
   * Adiciona uma mensagem de evento de som
   */
  addSoundEvent(soundType, customDescription = null, additionalInfo = "") {
    if (!this.enabled) return;
    
    const description = customDescription || 
      (this.soundDescriptions[soundType]?.pt || soundType);
    
    const message = {
      id: Date.now() + Math.random(),
      text: description,
      info: additionalInfo,
      timestamp: new Date().toLocaleTimeString("pt-BR"),
      soundType: soundType,
      icon: this.soundDescriptions[soundType]?.icon || "📢"
    };
    
    this.messageQueue.unshift(message);
    
    // Manter apenas as últimas mensagens
    if (this.messageQueue.length > this.maxMessages) {
      this.messageQueue.pop();
    }
    
    this._updateDisplay();
    
    // Auto-remover após timeout
    setTimeout(() => {
      this.messageQueue = this.messageQueue.filter(m => m.id !== message.id);
      this._updateDisplay();
    }, this.messageTimeout);
  },
  
  /**
   * Atualiza a exibição das mensagens
   */
  _updateDisplay() {
    if (!this.displayElement) return;
    
    if (this.messageQueue.length === 0) {
      this.displayElement.innerHTML = "";
      return;
    }
    
    const html = this.messageQueue
      .map(msg => `
        <div class="accessibility-message" data-sound-type="${msg.soundType}">
          <span class="message-icon">${msg.icon}</span>
          <span class="message-text">${msg.text}</span>
          ${msg.info ? `<span class="message-info">${msg.info}</span>` : ""}
          <span class="message-time">${msg.timestamp}</span>
        </div>
      `)
      .join("");
    
    this.displayElement.innerHTML = html;
  },
  
  /**
   * Descreve o estado de um jogador
   */
  describePlayerState(playerName, state) {
    if (!this.enabled) return;
    
    let description = `${playerName}: `;
    
    if (state.vivo === false) {
      description += "DERROTADO";
      this.addSoundEvent("derez", description);
    } else if (state.vida && state.vidaMax) {
      const pctVida = Math.round((state.vida / state.vidaMax) * 100);
      description += `Vida ${pctVida}%`;
      
      if (pctVida < 30) {
        this.addSoundEvent("energy_low", description);
      } else {
        this.addSoundEvent("player_action", description);
      }
    }
    
    if (state.energia && state.energiaMax) {
      const pctEnergia = Math.round((state.energia / state.energiaMax) * 100);
      const energiaTexto = `Energia ${pctEnergia}%`;
      
      if (pctEnergia < 20) {
        this.addSoundEvent("energy_low", energiaTexto);
      }
    }
  },
  
  /**
   * Descreve uma colisão
   */
  describeCollision(player1, player2 = null) {
    if (!this.enabled) return;
    
    let description = `Colisão: ${player1}`;
    if (player2) description += ` com ${player2}`;
    
    this.addSoundEvent("collision", description);
  },
  
  /**
   * Descreve movimento de arma
   */
  describeWeaponEvent(playerName, weaponName, action = "usada") {
    if (!this.enabled) return;
    
    const description = `${playerName} ${action} ${weaponName}`;
    this.addSoundEvent("throw", description);
  },
  
  /**
   * Descreve vitória
   */
  describeVictory(winnerName) {
    if (!this.enabled) return;
    
    const description = `${winnerName} venceu!`;
    this.addSoundEvent("victory", description);
  },
  
  /**
   * Descreve derrota
   */
  describeDefeat(loserName) {
    if (!this.enabled) return;
    
    const description = `${loserName} foi derrotado`;
    this.addSoundEvent("derez", description);
  },
  
  /**
   * Retorna o status do módulo
   */
  getStatus() {
    return {
      enabled: this.enabled,
      messageCount: this.messageQueue.length,
      maxMessages: this.maxMessages
    };
  }
};

// Estilos para acessibilidade (para adicionar ao CSS)
const accessibilityStyles = `
  /* Botão de toggle de acessibilidade */
  .accessibility-toggle {
    position: absolute;
    bottom: 20px;
    right: 20px;
    z-index: 15;
    padding: 12px 16px;
    background: rgba(3, 7, 16, 0.85);
    color: #4de3ff;
    border: 2px solid #4de3ff;
    border-radius: 6px;
    font-family: "Orbitron", monospace;
    font-size: 12px;
    cursor: pointer;
    box-shadow: 0 0 12px rgba(77, 227, 255, 0.3);
    transition: all 0.3s ease;
    pointer-events: auto;
  }

  .accessibility-toggle:hover {
    background: rgba(77, 227, 255, 0.1);
    box-shadow: 0 0 20px rgba(77, 227, 255, 0.6);
  }

  .accessibility-toggle.active {
    background: #4de3ff;
    color: #030710;
    box-shadow: 0 0 25px #4de3ff;
  }

  /* Painel de informações */
  .accessibility-info {
    position: absolute;
    bottom: 70px;
    right: 20px;
    z-index: 14;
    background: rgba(3, 7, 16, 0.9);
    border: 2px solid #4de3ff;
    border-radius: 6px;
    padding: 12px 16px;
    color: #4de3ff;
    font-family: "Orbitron", monospace;
    font-size: 11px;
    max-width: 200px;
    box-shadow: 0 0 15px rgba(77, 227, 255, 0.4);
  }

  .accessibility-info h3 {
    margin-bottom: 8px;
    font-size: 12px;
    letter-spacing: 2px;
  }

  .accessibility-info p {
    margin-bottom: 8px;
    color: #0f7a99;
  }

  /* Display de mensagens de acessibilidade */
  .accessibility-display {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 14;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 400px;
    pointer-events: none;
  }

  .accessibility-message {
    background: rgba(3, 7, 16, 0.95);
    border-left: 4px solid #4de3ff;
    border-radius: 4px;
    padding: 12px 14px;
    color: #fff;
    font-family: "Orbitron", monospace;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 0 12px rgba(77, 227, 255, 0.3);
    animation: slideIn 0.3s ease-out;
  }

  .accessibility-message .message-icon {
    font-size: 16px;
    flex-shrink: 0;
  }

  .accessibility-message .message-text {
    flex: 1;
    font-weight: bold;
    letter-spacing: 1px;
  }

  .accessibility-message .message-info {
    color: #4de3ff;
    font-size: 11px;
    opacity: 0.8;
  }

  .accessibility-message .message-time {
    color: #0f7a99;
    font-size: 10px;
    white-space: nowrap;
  }

  /* Cores específicas por tipo de evento */
  .accessibility-message[data-sound-type="laser"] {
    border-left-color: #ff9331;
  }

  .accessibility-message[data-sound-type="derez"] {
    border-left-color: #ff3b3b;
  }

  .accessibility-message[data-sound-type="portal"] {
    border-left-color: #9d4edd;
  }

  .accessibility-message[data-sound-type="energy_low"] {
    border-left-color: #ff9331;
  }

  .accessibility-message[data-sound-type="victory"] {
    border-left-color: #3bff5b;
  }

  .accessibility-message[data-sound-type="collision"] {
    border-left-color: #ff3b3b;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @media (max-width: 768px) {
    .accessibility-display {
      top: auto;
      bottom: 100px;
      right: 10px;
      max-width: calc(100vw - 30px);
    }

    .accessibility-toggle {
      bottom: 10px;
      right: 10px;
      padding: 10px 12px;
      font-size: 11px;
    }

    .accessibility-info {
      bottom: 60px;
      right: 10px;
      max-width: calc(100vw - 30px);
    }
  }
`;
