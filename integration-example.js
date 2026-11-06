/**
 * EXEMPLO DE INTEGRAÇÃO COMPLETA
 * 
 * Este arquivo demonstra como integrar MQTT e Acessibilidade
 * com o sistema de jogo TRON existente
 * 
 * Para usar:
 * 1. Incluir este arquivo após transmission.js no HTML
 * 2. Chamar as funções conforme necessário
 */

const TRONIntegration = {
  /**
   * Inicializa o sistema completo para um HOST (jogador transmissor)
   */
  initializeAsHost(brokerUrl = null) {
    console.log("🎮 Inicializando TRON como HOST (Transmissor)");
    
    // Inicializar transmissão
    GameTransmission.initialize(false, brokerUrl);
    
    // Interceptar funções de som do jogo
    this._integrateGameSounds();
    
    // Interceptar eventos de gameplay
    this._integrateGameEvents();
    
    console.log("✅ HOST inicializado e pronto para transmitir");
    return GameTransmission.getStatus();
  },
  
  /**
   * Inicializa o sistema completo para um ESPECTADOR
   */
  initializeAsSpectator(brokerUrl = null) {
    console.log("👁️ Inicializando TRON como ESPECTADOR");
    
    // Inicializar transmissão e acessibilidade
    GameTransmission.initialize(true, brokerUrl);
    
    // Mostrar menu de espectador
    this._showSpectatorUI();
    
    console.log("✅ ESPECTADOR inicializado");
    return GameTransmission.getStatus();
  },
  
  /**
   * Integra eventos de som com transmissão
   */
  _integrateGameSounds() {
    // Wrap playLaser
    if (typeof playLaser !== "undefined") {
      const original = playLaser;
      window.playLaser = function() {
        original.apply(this, arguments);
        GameTransmission.publishSoundEvent("laser", {
          description: "Laser disparado"
        });
      };
    }
    
    // Wrap playThrow
    if (typeof playThrow !== "undefined") {
      const original = playThrow;
      window.playThrow = function() {
        original.apply(this, arguments);
        GameTransmission.publishSoundEvent("throw", {
          description: "Arma lançada"
        });
      };
    }
    
    // Wrap playDerez
    if (typeof playDerez !== "undefined") {
      const original = playDerez;
      window.playDerez = function() {
        original.apply(this, arguments);
        GameTransmission.publishSoundEvent("derez", {
          description: "Personagem derrotado"
        });
      };
    }
    
    // Wrap playPortal
    if (typeof playPortal !== "undefined") {
      const original = playPortal;
      window.playPortal = function() {
        original.apply(this, arguments);
        GameTransmission.publishSoundEvent("portal", {
          description: "Portal aberto"
        });
      };
    }
    
    // Wrap updateMotoAudio
    if (typeof updateMotoAudio !== "undefined") {
      const original = updateMotoAudio;
      window.updateMotoAudio = function(isMoving) {
        original.apply(this, arguments);
        if (isMoving) {
          GameTransmission.publishSoundEvent("moto_engine", {
            description: "Motor acelerado"
          });
        }
      };
    }
    
    console.log("✅ Funções de som integradas");
  },
  
  /**
   * Integra eventos gerais do jogo
   */
  _integrateGameEvents() {
    // Hook: Jogador iniciado
    if (typeof iniciarNovoJogo !== "undefined") {
      const original = window.iniciarNovoJogo;
      window.iniciarNovoJogo = function() {
        GameTransmission.onGameStart();
        return original.apply(this, arguments);
      };
    }
    
    console.log("✅ Eventos de gameplay integrados");
  },
  
  /**
   * Mostra interface de espectador
   */
  _showSpectatorUI() {
    const container = document.getElementById("game-container");
    if (!container) return;
    
    // Criar painel de espectador
    const spectatorPanel = document.createElement("div");
    spectatorPanel.id = "spectator-panel";
    spectatorPanel.className = "spectator-panel";
    spectatorPanel.innerHTML = `
      <div class="spectator-header">
        👁️ MODO ESPECTADOR
      </div>
      <div class="spectator-info">
        <div class="info-line">
          <span class="info-label">Status:</span>
          <span class="info-value" id="spectator-status">Conectando...</span>
        </div>
        <div class="info-line">
          <span class="info-label">Acessibilidade:</span>
          <span class="info-value" id="spectator-accessibility">Desativada</span>
        </div>
        <div class="info-line">
          <span class="info-label">Eventos Recebidos:</span>
          <span class="info-value" id="spectator-events">0</span>
        </div>
      </div>
      <div class="spectator-controls">
        <button id="spectator-toggle-accessibility" class="spectator-btn">
          🎵 Ativar Legendas
        </button>
        <button id="spectator-stats" class="spectator-btn">
          📊 Estatísticas
        </button>
      </div>
    `;
    
    // Adicionar estilos
    const style = document.createElement("style");
    style.textContent = `
      .spectator-panel {
        position: absolute;
        top: 20px;
        left: 20px;
        z-index: 12;
        background: rgba(3, 7, 16, 0.95);
        border: 2px solid #0f7a99;
        border-radius: 8px;
        padding: 16px;
        color: #4de3ff;
        font-family: "Orbitron", monospace;
        font-size: 12px;
        min-width: 250px;
        box-shadow: 0 0 20px rgba(77, 227, 255, 0.3);
      }

      .spectator-header {
        font-size: 14px;
        font-weight: bold;
        letter-spacing: 2px;
        margin-bottom: 12px;
        text-shadow: 0 0 6px #4de3ff;
      }

      .spectator-info {
        margin-bottom: 12px;
        border-top: 1px solid #0f7a99;
        border-bottom: 1px solid #0f7a99;
        padding: 8px 0;
      }

      .info-line {
        display: flex;
        justify-content: space-between;
        padding: 4px 0;
        font-size: 11px;
      }

      .info-label {
        color: #0f7a99;
      }

      .info-value {
        color: #4de3ff;
        font-weight: bold;
      }

      .spectator-controls {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .spectator-btn {
        padding: 8px 12px;
        background: transparent;
        color: #4de3ff;
        border: 1px solid #4de3ff;
        border-radius: 4px;
        font-family: "Orbitron", monospace;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .spectator-btn:hover {
        background: #4de3ff;
        color: #030710;
        box-shadow: 0 0 12px #4de3ff;
      }

      @media (max-width: 768px) {
        .spectator-panel {
          top: auto;
          bottom: 20px;
          left: 20px;
          min-width: auto;
          font-size: 10px;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Adicionar ao container
    container.appendChild(spectatorPanel);
    
    // Conectar controles
    document.getElementById("spectator-toggle-accessibility").onclick = () => {
      Accessibility.toggle();
      const btn = document.getElementById("spectator-toggle-accessibility");
      btn.textContent = Accessibility.enabled ? "🔇 Desativar Legendas" : "🎵 Ativar Legendas";
      document.getElementById("spectator-accessibility").textContent = 
        Accessibility.enabled ? "Ativada" : "Desativada";
    };
    
    document.getElementById("spectator-stats").onclick = () => {
      alert(
        "Status MQTT:\n" +
        JSON.stringify(MQTTClient.getStatus(), null, 2) +
        "\n\nAcessibilidade:\n" +
        JSON.stringify(Accessibility.getStatus(), null, 2)
      );
    };
    
    // Atualizar status
    setInterval(() => {
      document.getElementById("spectator-status").textContent = 
        MQTTClient.isConnected ? "🟢 Conectado" : "🔴 Desconectado";
    }, 1000);
  },
  
  /**
   * Registra uma ação de jogador
   */
  registerPlayerAction(playerName, action, details = {}) {
    const message = `${playerName} ${action}`;
    Accessibility.addSoundEvent("player_action", message, JSON.stringify(details));
    
    MQTTClient.publishGameState({
      type: "player_action",
      player: playerName,
      action: action,
      details: details
    });
  },
  
  /**
   * Registra mudança de energia
   */
  registerEnergyChange(playerName, oldEnergy, newEnergy, maxEnergy) {
    const pct = Math.round((newEnergy / maxEnergy) * 100);
    
    if (newEnergy < oldEnergy) {
      // Energia perdida
      if (pct < 20) {
        Accessibility.addSoundEvent("energy_low", 
          `${playerName} com energia baixa: ${pct}%`);
      }
    } else if (newEnergy > oldEnergy) {
      // Energia recuperada
      Accessibility.addSoundEvent("energy_boost", 
        `${playerName} recuperou energia: ${pct}%`);
    }
    
    MQTTClient.publishGameState({
      type: "energy_update",
      player: playerName,
      energy: newEnergy,
      maxEnergy: maxEnergy,
      percentage: pct
    });
  },
  
  /**
   * Registra mudança de vida
   */
  registerHealthChange(playerName, oldHealth, newHealth, maxHealth) {
    const pct = Math.round((newHealth / maxHealth) * 100);
    
    if (newHealth <= 0) {
      Accessibility.describeDefeat(playerName);
    } else if (newHealth < oldHealth) {
      const damage = oldHealth - newHealth;
      Accessibility.addSoundEvent("player_action", 
        `${playerName} recebeu ${damage} de dano`);
    }
    
    MQTTClient.publishGameState({
      type: "health_update",
      player: playerName,
      health: newHealth,
      maxHealth: maxHealth,
      percentage: pct
    });
  },
  
  /**
   * Exportar logs de acessibilidade
   */
  exportAccessibilityLog() {
    const log = {
      timestamp: new Date().toISOString(),
      messages: Accessibility.messageQueue,
      status: Accessibility.getStatus()
    };
    
    console.log("📋 Accessibility Log:", log);
    return log;
  },
  
  /**
   * Retorna status completo
   */
  getFullStatus() {
    return {
      mqtt: MQTTClient.getStatus(),
      accessibility: Accessibility.getStatus(),
      transmission: GameTransmission.getStatus(),
      timestamp: new Date().toISOString()
    };
  }
};

// Expor globalmente
window.TRONIntegration = TRONIntegration;

console.log("%c🚀 TRON Integration Loaded", "color: #ff9331; font-size: 14px; font-weight: bold;");
console.log("Use: TRONIntegration.initializeAsHost()");
console.log("Use: TRONIntegration.initializeAsSpectator()");
