/**
 * EXEMPLO DE INTEGRAÇÃO MQTT - TRON GAME STATE TRANSMISSION
 * 
 * Como usar este exemplo:
 * 1. Adaptar as funções capturePlayerData() e captureProjectileData()
 *    para suas variáveis de jogo específicas
 * 2. Colocar o código de inicialização ao final do index.html
 * 3. Chamar connectAsHost() no console
 * 4. Abrir outra aba com connectAsSpectator()
 */

// ============================================================================
// PARTE 1: CAPTURAR DADOS DO SEU JOGO
// ============================================================================

/**
 * Exemplo 1: Se seu jogo tem array global de jogadores
 * Adaptar conforme estrutura real do seu jogo
 */
function capturePlayerData() {
  // ❌ EXEMPLO (adaptar para seu jogo):
  // if (!window.jogadores || !Array.isArray(window.jogadores)) {
  //   return [];
  // }
  
  // const players = window.jogadores.map((j, idx) => ({
  //   id: j.id || `player_${idx}`,
  //   x: j.x || 0,
  //   y: j.y || 0,
  //   color: j.cor || "#ffffff",
  //   energy: j.energia || 100,
  //   alive: !j.morto,
  //   direction: j.angulo || 0,
  //   name: j.nome || `Player ${idx + 1}`,
  //   score: j.pontos || 0
  // }));
  
  // return players;
  
  // Para teste sem integração real, retornar dados simulados:
  return [
    {
      id: "player_1",
      x: 250 + Math.random() * 50,
      y: 250 + Math.random() * 50,
      color: "#ff0000",
      energy: 75 + Math.random() * 25,
      alive: true,
      direction: Math.random() * 360,
      name: "Host Player",
      score: Math.floor(Math.random() * 5000)
    },
    {
      id: "player_2",
      x: 750 + Math.random() * 50,
      y: 750 + Math.random() * 50,
      color: "#00ff00",
      energy: 60 + Math.random() * 40,
      alive: true,
      direction: Math.random() * 360,
      name: "AI Player",
      score: Math.floor(Math.random() * 3000)
    }
  ];
}

/**
 * Exemplo 2: Capturar dados de projéteis
 */
function captureProjectileData() {
  // ❌ EXEMPLO (adaptar para seu jogo):
  // if (!window.discos || !Array.isArray(window.discos)) {
  //   return [];
  // }
  
  // const projectiles = window.discos.map((d, idx) => ({
  //   id: d.id || `proj_${idx}`,
  //   x: d.x || 0,
  //   y: d.y || 0,
  //   type: d.tipo || "laser",
  //   color: d.cor || "#ffffff",
  //   owner: d.ownerPlayerId || "unknown"
  // }));
  
  // return projectiles;
  
  // Para teste, retornar dados simulados:
  return [
    {
      id: "proj_1",
      x: 300 + Math.random() * 100,
      y: 300 + Math.random() * 100,
      type: "laser",
      color: "#ff9331",
      owner: "player_1"
    },
    {
      id: "proj_2",
      x: 700 + Math.random() * 100,
      y: 700 + Math.random() * 100,
      type: "weapon",
      color: "#4de3ff",
      owner: "player_2"
    }
  ];
}

/**
 * Exemplo 3: Capturar status do jogo
 */
function captureGameStatus() {
  // ❌ EXEMPLO (adaptar para seu jogo):
  // return {
  //   isRunning: window.rodando || false,
  //   timeElapsed: window.tempoPartida || 0,
  //   winner: window.vencedor || null,
  //   paused: window.pausado || false
  // };
  
  // Para teste, retornar dados simulados:
  return {
    isRunning: true,
    timeElapsed: Math.floor(Math.random() * 300000), // 0-5 minutos
    winner: null,
    paused: false
  };
}

// ============================================================================
// PARTE 2: FUNÇÃO PRINCIPAL QUE CAPTURA ESTADO COMPLETO
// ============================================================================

/**
 * ESTA É A FUNÇÃO QUE SERÁ REGISTRADA COM:
 * GameTransmission.setGameStateProvider(captureGameState)
 */
function captureGameState() {
  const gameStatus = captureGameStatus();
  
  return {
    // Metadados
    timestamp: Date.now(),
    gameTime: gameStatus.timeElapsed,
    gameStatus: gameStatus.isRunning ? "playing" : "stopped",
    
    // Dados dos jogadores
    players: capturePlayerData(),
    
    // Dados de projéteis/armas
    projectiles: captureProjectileData(),
    
    // Dados do mundo (opcional)
    world: {
      width: 1024,
      height: 1024,
      mapName: "default"
    },
    
    // Placar
    leaderboard: [
      { playerName: "Host Player", score: Math.floor(Math.random() * 10000) },
      { playerName: "AI Player", score: Math.floor(Math.random() * 10000) }
    ]
  };
}

// ============================================================================
// PARTE 3: HANDLERS DE EVENTOS (OPCIONAL)
// ============================================================================

/**
 * Publicar evento quando jogador dispara laser
 */
function onPlayerFiresLaser(playerName, x, y) {
  GameTransmission.onLaserFired(playerName, { x, y });
  
  // Também pode publicar manualmente:
  // GameTransmission.publishSoundEvent("laser", {
  //   player: playerName,
  //   position: { x, y },
  //   description: `${playerName} disparou um laser`
  // });
}

/**
 * Publicar evento quando jogador é derrotado
 */
function onPlayerDefeated(playerName, defeatedBy) {
  GameTransmission.onPlayerDefeated(playerName, defeatedBy, {
    defeatedAt: Date.now()
  });
}

/**
 * Publicar evento de vitória
 */
function onGameVictory(winnerName, finalScore) {
  GameTransmission.onVictory(winnerName, {
    finalScore: finalScore,
    gameTime: performance.now() - gameStartTime
  });
}

// ============================================================================
// PARTE 4: INICIALIZAÇÃO (Adicionar isso ao final do index.html)
// ============================================================================

/**
 * SCRIPT A SER ADICIONADO NO FINAL DO index.html:
 * 
 * Colocar DEPOIS de todos os scripts MQTT/accessibility serem carregados
 * e ANTES de iniciar o loop principal do jogo
 */

// Registrar a função que fornece o estado do jogo
GameTransmission.setGameStateProvider(captureGameState);

// Agora o host pode iniciar transmissão com:
//   connectAsHost()
//
// Espectador pode se conectar com:
//   connectAsSpectator()

// ============================================================================
// PARTE 5: GUIA DE INTEGRAÇÃO REAL
// ============================================================================

/**
 * PASSO A PASSO PARA INTEGRAÇÃO REAL NO SEU JOGO:
 * 
 * 1. IDENTIFICAR VARIÁVEIS DO JOGO
 *    Procure no index.html por:
 *    - Array/objeto com dados dos jogadores
 *    - Array/objeto com dados dos projéteis
 *    - Variáveis de status do jogo
 *    - Função de captura de tempo
 * 
 * 2. ADAPTAR FUNÇÕES
 *    Modificar:
 *    - capturePlayerData()      ← Seus jogadores
 *    - captureProjectileData()  ← Seus projéteis
 *    - captureGameStatus()      ← Status do seu jogo
 *    - captureGameState()       ← Combina tudo
 * 
 * 3. REGISTRAR PROVIDER
 *    Chamar no index.html:
 *    GameTransmission.setGameStateProvider(captureGameState);
 * 
 * 4. INICIAR TRANSMISSÃO
 *    No console ou código:
 *    connectAsHost()
 * 
 * 5. TESTAR
 *    Abrir outra aba e executar:
 *    connectAsSpectator()
 * 
 * 6. VERIFICAR
 *    Console deve mostrar:
 *    [MQTT] ✓ Publicado em tron/game/state
 *    (a cada 50ms)
 */

// ============================================================================
// PARTE 6: TESTE SEM INTEGRAÇÃO REAL
// ============================================================================

/**
 * Para TESTAR sem modificar o jogo real:
 * 
 * 1. Abrir console (F12)
 * 2. Executar em uma aba (HOST):
 * 
 *    GameTransmission.setGameStateProvider(captureGameState);
 *    connectAsHost();
 * 
 * 3. Esperar 2-3 segundos
 * 
 * 4. Abrir outra aba do mesmo jogo
 * 
 * 5. Executar em outra aba (SPECTATOR):
 * 
 *    connectAsSpectator();
 * 
 * 6. Verificar console de ambas abas
 * 
 * RESULTADO ESPERADO:
 * HOST:
 *   [MQTT] ✅ Conectado ao broker MQTT
 *   [MQTT] ✓ Inscrito nos tópicos
 *   [MQTT] ✓ Publicado em tron/game/state
 *   [MQTT] ✓ Publicado em tron/game/state
 *   ... (repetido a cada 50ms)
 * 
 * SPECTATOR:
 *   [MQTT] ✅ Conectado ao broker MQTT
 *   [MQTT] ✓ Inscrito nos tópicos
 *   [GameTransmission] Recebido estado do jogo
 *   [Accessibility] Evento: Player: Host Player...
 */

// ============================================================================
// PARTE 7: VERIFICAÇÃO E DEBUG
// ============================================================================

/**
 * VERIFICAR SE ESTÁ FUNCIONANDO
 */
function debugMQTTTransmission() {
  console.group("🔍 DEBUG MQTT Transmission");
  
  console.log("✓ Provider registrado?", GameTransmission.gameStateProvider !== null);
  console.log("✓ MQTT conectado?", MQTTClient.isConnected);
  console.log("✓ É Host?", GameTransmission.isHost);
  console.log("✓ É Espectador?", GameTransmission.isSpectator);
  console.log("✓ Transmissão ativa?", GameTransmission.updateTimer !== null);
  
  // Tentar capturar estado manualmente
  const state = GameTransmission._captureGameState();
  console.log("✓ Estado capturado:", state);
  
  console.groupEnd();
}

// Usar no console:
// debugMQTTTransmission()

// ============================================================================
// PARTE 8: ESTRUTURA DE DADOS ESPERADA
// ============================================================================

/**
 * ESTRUTURA DE ESTADO TRANSMITIDO:
 * 
 * {
 *   "timestamp": 1699345673123,
 *   "gameTime": 45230,
 *   "gameStatus": "playing",
 *   "players": [
 *     {
 *       "id": "player_1",
 *       "x": 245.5,
 *       "y": 248.3,
 *       "color": "#ff0000",
 *       "energy": 89,
 *       "alive": true,
 *       "direction": 45,
 *       "name": "Host Player",
 *       "score": 3250
 *     },
 *     {
 *       "id": "player_2",
 *       "x": 745.1,
 *       "y": 748.9,
 *       "color": "#00ff00",
 *       "energy": 72,
 *       "alive": true,
 *       "direction": 270,
 *       "name": "AI Player",
 *       "score": 2100
 *     }
 *   ],
 *   "projectiles": [
 *     {
 *       "id": "proj_1",
 *       "x": 300.5,
 *       "y": 325.7,
 *       "type": "laser",
 *       "color": "#ff9331",
 *       "owner": "player_1"
 *     }
 *   ],
 *   "world": {
 *     "width": 1024,
 *     "height": 1024,
 *     "mapName": "default"
 *   },
 *   "leaderboard": [
 *     { "playerName": "Host Player", "score": 3250 },
 *     { "playerName": "AI Player", "score": 2100 }
 *   ]
 * }
 */

// ============================================================================
// FIM DO EXEMPLO
// ============================================================================

/**
 * RESUMO:
 * 
 * 1. Este arquivo contém exemplos de como integrar seu jogo TRON com MQTT
 * 
 * 2. Adaptar as funções de captura (capturePlayerData, etc) para seus dados reais
 * 
 * 3. Registrar o provider: GameTransmission.setGameStateProvider(captureGameState)
 * 
 * 4. Conectar como host: connectAsHost()
 * 
 * 5. Em outra aba, conectar como espectador: connectAsSpectator()
 * 
 * 6. Verificar console para ver transmissão de estado
 * 
 * 7. Se não funcionar, executar: debugMQTTTransmission() para debug
 */
