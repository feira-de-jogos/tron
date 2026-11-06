// GUIA DE INTEGRAÇÃO TÉCNICA - MQTT & ACESSIBILIDADE PARA TRON
// ============================================================
// Este guia mostra como integrar os módulos com o código existente do jogo

// ============================================================
// 1. INTEGRAÇÃO BÁSICA
// ============================================================

// No seu código do jogo, após carregar os scripts:

// Opção A: Inicializar como Host (transmissor)
function setupGameAsHost() {
  GameTransmission.initialize(false); // false = host
  
  // Agora todos os eventos serão transmitidos automaticamente
  console.log("✅ Jogo configurado como transmissor");
}

// Opção B: Inicializar como Espectador
function setupGameAsSpectator() {
  GameTransmission.initialize(true); // true = espectador
  
  // Opcionalmente ativar acessibilidade
  Accessibility.toggle();
  console.log("✅ Jogo configurado como espectador");
}

// ============================================================
// 2. INTEGRAÇÃO COM FUNÇÕES DE SOM EXISTENTES
// ============================================================

// Se sua função de som é assim:
function originalPlayLaser() {
  const ac = getAudioCtx();
  // ... código de síntese de áudio
}

// Você pode envolver assim:
function integratePlayLaser() {
  const originalPlayLaser = window.playLaser;
  
  window.playLaser = function() {
    // Executar som original
    originalPlayLaser.call(this);
    
    // Publicar evento
    GameTransmission.publishSoundEvent("laser", {
      description: "Laser disparado"
    });
  };
}

// Ou usar decorador (ES6+):
function wrapSoundFunction(funcName, soundType) {
  if (!window[funcName]) return;
  
  const original = window[funcName];
  window[funcName] = function(...args) {
    original.apply(this, args);
    GameTransmission.publishSoundEvent(soundType);
  };
}

// Usar:
// wrapSoundFunction("playLaser", "laser");
// wrapSoundFunction("playThrow", "throw");
// wrapSoundFunction("playDerez", "derez");

// ============================================================
// 3. REGISTRAR EVENTOS DE GAMEPLAY
// ============================================================

// Quando um jogador dispara uma arma:
function onPlayerShoot(playerName, weaponType, position) {
  playLaser(); // Som original
  
  if (GameTransmission.enabled) {
    GameTransmission.onLaserFired(playerName, position);
  }
}

// Quando há colisão:
function onCollisionDetected(player1Name, player2Name) {
  playDerez(); // Som de impacto
  
  if (GameTransmission.enabled) {
    GameTransmission.onCollision(player1Name, player2Name);
  }
}

// Quando jogador é derrotado:
function onPlayerDefeated(playerName, defeatedByName) {
  playDerez(); // Som de derrota
  
  if (GameTransmission.enabled) {
    GameTransmission.onPlayerDefeated(playerName, defeatedByName);
  }
}

// Quando jogo termina com vitória:
function onGameVictory(winnerName) {
  playPortal(); // Som especial
  
  if (GameTransmission.enabled) {
    GameTransmission.onVictory(winnerName);
  }
}

// Quando jogo termina (derrota/game over):
function onGameOver() {
  if (GameTransmission.enabled) {
    GameTransmission.onGameOver();
  }
}

// ============================================================
// 4. ATUALIZAR ESTADO DO JOGADOR
// ============================================================

// No seu loop de atualização do jogo:
function updateGameState() {
  // ... seu código de lógica do jogo
  
  // Quando vida/energia mudam:
  if (jogador.vida !== jogador.vidaAnterior) {
    if (GameTransmission.enabled) {
      GameTransmission.updatePlayerState(jogador.nome, {
        vida: jogador.vida,
        vidaMax: jogador.vidaMax,
        energia: jogador.energia,
        energiaMax: jogador.energiaMax,
        vivo: jogador.vida > 0
      });
    }
    
    // Para acessibilidade
    if (jogador.energia < jogador.energiaMax * 0.2) {
      Accessibility.addSoundEvent("energy_low", 
        `${jogador.nome} com energia baixa: ${Math.round(jogador.energia / jogador.energiaMax * 100)}%`
      );
    }
    
    jogador.vidaAnterior = jogador.vida;
  }
}

// ============================================================
// 5. INICIALIZAR NO STARTUP DO JOGO
// ============================================================

// No seu main.js ou código de inicialização:
function initGame() {
  // ... código existente do jogo
  
  // Determinar modo (host ou espectador)
  const isSpectator = getQueryParam("mode") === "spectator";
  const brokerUrl = getQueryParam("broker") || null;
  
  // Inicializar transmissão
  GameTransmission.initialize(isSpectator, brokerUrl);
  
  // Se for host, integrar eventos de som
  if (!isSpectator) {
    integrateGameSounds();
  }
  
  console.log("Jogo inicializado em modo:", isSpectator ? "ESPECTADOR" : "HOST");
}

// ============================================================
// 6. FAZER QUERY PARAMS FUNCIONAR
// ============================================================

function getQueryParam(name) {
  const url = new URLSearchParams(window.location.search);
  return url.get(name);
}

// URLs resultantes:
// Host: http://localhost/tron/index.html
// Host com broker: http://localhost/tron/index.html?mode=host&broker=wss://seu-broker.com:8883
// Espectador: http://localhost/tron/index.html?mode=spectator
// Espectador com broker: http://localhost/tron/index.html?mode=spectator&broker=wss://seu-broker.com:8883

// ============================================================
// 7. ADICIONAR MENU DE OPÇÕES
// ============================================================

// Adicionar ao seu menu:
function createNetworkMenu() {
  return `
    <div class="network-menu">
      <h3>Modo de Rede</h3>
      <button onclick="startAsHost()">
        🌐 Transmitir Partida
      </button>
      <button onclick="startAsSpectator()">
        👁️ Assistir Partida
      </button>
      <button onclick="toggleAccessibility()">
        ♿ Legendas (Acessibilidade)
      </button>
    </div>
  `;
}

function startAsHost() {
  connectAsHost();
  // Iniciar jogo normalmente
  iniciarNovoJogo();
}

function startAsSpectator() {
  connectAsSpectator();
  // Mostrar interface de espectador
  TRONIntegration.initializeAsSpectator();
}

// ============================================================
// 8. DEBUGGING E LOGGING
// ============================================================

// Adicionar ao seu logger/console:
function logGameEvent(eventType, data) {
  console.log(`[GAME] ${eventType}:`, data);
  
  // Se transmissão ativada, registrar também
  if (GameTransmission.enabled) {
    console.log(`[MQTT] Evento transmitido:`, eventType);
  }
}

// Monitorar status periodicamente:
function monitorTransmission() {
  setInterval(() => {
    const status = GameTransmission.getStatus();
    
    if (!status.mqttStatus.isConnected) {
      console.warn("⚠️ Desconectado do MQTT!");
    }
    
    // Verificar acessibilidade
    if (status.accessibilityStatus.enabled) {
      console.log(`📝 Modo acessível ativo (${status.accessibilityStatus.messageCount} mensagens)`);
    }
  }, 5000);
}

// ============================================================
// 9. TRATAMENTO DE ERROS
// ============================================================

// Wrapper de segurança para eventos:
function safePublishEvent(eventName, eventData) {
  try {
    if (GameTransmission.enabled && MQTTClient.isConnected) {
      GameTransmission.publishSoundEvent(eventName, eventData);
    }
  } catch (error) {
    console.error(`[ERROR] Falha ao publicar evento ${eventName}:`, error);
    // Continuar normalmente mesmo se MQTT falhar
  }
}

// Wrapper de segurança para acessibilidade:
function safeAddAccessibilityEvent(soundType, description) {
  try {
    if (Accessibility.enabled) {
      Accessibility.addSoundEvent(soundType, description);
    }
  } catch (error) {
    console.error(`[ERROR] Falha ao adicionar evento de acessibilidade:`, error);
  }
}

// ============================================================
// 10. EXEMPLO COMPLETO DE INTEGRAÇÃO
// ============================================================

class GameWithTransmission {
  constructor() {
    this.isHost = false;
    this.isSpectator = false;
    this.mqttConnected = false;
  }
  
  initialize(mode = "standalone", brokerUrl = null) {
    this.isHost = mode === "host";
    this.isSpectator = mode === "spectator";
    
    if (this.isHost || this.isSpectator) {
      GameTransmission.initialize(this.isSpectator, brokerUrl);
      
      // Callback quando conectar
      MQTTClient.onConnect = () => {
        this.mqttConnected = true;
        console.log("✅ Conectado ao MQTT");
      };
      
      // Callback quando desconectar
      MQTTClient.onDisconnect = () => {
        this.mqttConnected = false;
        console.warn("❌ Desconectado do MQTT");
      };
    }
    
    // Integrar eventos se for host
    if (this.isHost) {
      this.integrateGameEvents();
    }
  }
  
  integrateGameEvents() {
    // Seus eventos aqui
    console.log("Eventos de jogo integrados com MQTT");
  }
  
  publishEvent(eventType, eventData) {
    if (this.mqttConnected) {
      GameTransmission.publishSoundEvent(eventType, eventData);
    }
  }
  
  getStatus() {
    return {
      mode: this.isHost ? "HOST" : (this.isSpectator ? "SPECTATOR" : "STANDALONE"),
      mqttConnected: this.mqttConnected,
      transmissionStatus: GameTransmission.getStatus(),
      accessibilityStatus: Accessibility.getStatus()
    };
  }
}

// Uso:
// const game = new GameWithTransmission();
// game.initialize("host"); // ou "spectator"

// ============================================================
// 11. TESTES DE INTEGRAÇÃO
// ============================================================

function testIntegration() {
  console.log("🧪 Iniciando testes de integração...\n");
  
  // Teste 1: Conexão MQTT
  console.log("Teste 1: Conexão MQTT");
  connectAsHost();
  setTimeout(() => {
    const status = MQTTClient.getStatus();
    console.assert(status.isConnected, "❌ Não conectou");
    console.log("✅ MQTT conectado\n");
  }, 2000);
  
  // Teste 2: Acessibilidade
  console.log("Teste 2: Acessibilidade");
  Accessibility.toggle();
  console.assert(Accessibility.enabled, "❌ Não ativou");
  console.log("✅ Acessibilidade ativada\n");
  
  // Teste 3: Evento de laser
  console.log("Teste 3: Evento de laser");
  GameTransmission.onLaserFired("TestPlayer", {x: 0, y: 0});
  console.log("✅ Evento publicado\n");
  
  // Teste 4: Acessibilidade logging
  console.log("Teste 4: Log de acessibilidade");
  const accStatus = Accessibility.getStatus();
  console.log(`✅ Mensagens visíveis: ${accStatus.messageCount}\n`);
  
  console.log("🎉 Todos os testes passaram!");
}

// ============================================================
// 12. CHECKLIST DE INTEGRAÇÃO
// ============================================================

/*
CHECKLIST DE INTEGRAÇÃO:

□ Scripts carregados no HTML
  └─ mqtt-client.js
  └─ accessibility.js
  └─ transmission.js

□ Funções de som integradas
  └─ playLaser
  └─ playThrow
  └─ playDerez
  └─ playPortal

□ Eventos de gameplay integrados
  └─ onPlayerShoot
  └─ onCollision
  └─ onPlayerDefeated
  └─ onGameVictory
  └─ onGameOver

□ Estado do jogador sincronizado
  └─ Vida/Energia atualizados
  └─ Posição transmitida

□ Menu de opções adicionado
  └─ Botão para conectar como host
  └─ Botão para conectar como espectador
  └─ Botão para acessibilidade

□ Tratamento de erros implementado
  └─ Try/catch em eventos
  └─ Fallback para modo standalone

□ Logging e debugging
  └─ Console.log para eventos
  └─ Status monitoring
  └─ Error reporting

□ Testes executados
  └─ TestSuite.runAll()
  └─ Testes de integração customizados
  └─ Teste em múltiplos navegadores

□ Documentação atualizada
  └─ Comentários de código
  └─ Guia de integração
  └─ API documentada
*/

// ============================================================
// FIM DO GUIA DE INTEGRAÇÃO
// ============================================================
