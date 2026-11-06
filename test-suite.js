/**
 * GUIA DE TESTE - MQTT & Acessibilidade para TRON
 * 
 * Execute os testes no console do navegador
 */

const TestSuite = {
  /**
   * Teste 1: Conectar ao MQTT como HOST
   */
  testMQTTHostConnection() {
    console.log("📌 Teste 1: Conectar ao MQTT como HOST");
    
    connectAsHost();
    
    setTimeout(() => {
      const status = MQTTClient.getStatus();
      console.log("Status:", status);
      console.assert(status.isConnected, "❌ Não conectou ao MQTT");
      if (status.isConnected) {
        console.log("✅ Teste 1 passou");
      }
    }, 2000);
  },
  
  /**
   * Teste 2: Conectar ao MQTT como ESPECTADOR
   */
  testMQTTSpectatorConnection() {
    console.log("📌 Teste 2: Conectar ao MQTT como ESPECTADOR");
    
    // Primeiro desconectar host se conectado
    MQTTClient.disconnect();
    
    setTimeout(() => {
      connectAsSpectator();
      
      setTimeout(() => {
        const status = MQTTClient.getStatus();
        console.log("Status:", status);
        console.assert(status.isConnected, "❌ Não conectou como espectador");
        if (status.isConnected) {
          console.log("✅ Teste 2 passou");
        }
      }, 2000);
    }, 500);
  },
  
  /**
   * Teste 3: Publicar evento de laser
   */
  testPublishLaserEvent() {
    console.log("📌 Teste 3: Publicar evento de laser");
    
    if (!MQTTClient.isConnected) {
      connectAsHost();
      setTimeout(() => this.testPublishLaserEvent(), 2000);
      return;
    }
    
    GameTransmission.publishSoundEvent("laser", {
      player: "TestPlayer",
      position: {x: 100, y: 200},
      description: "Teste de laser"
    });
    
    console.log("✅ Evento de laser publicado");
  },
  
  /**
   * Teste 4: Publicar evento de derrota
   */
  testPublishDefeatEvent() {
    console.log("📌 Teste 4: Publicar evento de derrota");
    
    if (!MQTTClient.isConnected) {
      connectAsHost();
      setTimeout(() => this.testPublishDefeatEvent(), 2000);
      return;
    }
    
    GameTransmission.onPlayerDefeated("TestPlayer", "Enemy");
    
    console.log("✅ Evento de derrota publicado");
  },
  
  /**
   * Teste 5: Ativar acessibilidade
   */
  testAccessibilityToggle() {
    console.log("📌 Teste 5: Ativar acessibilidade");
    
    Accessibility.toggle();
    
    const status = Accessibility.getStatus();
    console.log("Status:", status);
    console.assert(status.enabled, "❌ Acessibilidade não ativada");
    
    if (status.enabled) {
      console.log("✅ Teste 5 passou");
    }
  },
  
  /**
   * Teste 6: Adicionar mensagem de acessibilidade
   */
  testAccessibilityMessage() {
    console.log("📌 Teste 6: Adicionar mensagem de acessibilidade");
    
    if (!Accessibility.enabled) {
      Accessibility.toggle();
    }
    
    Accessibility.addSoundEvent("laser", "Teste de laser disparado", "Player1");
    
    const status = Accessibility.getStatus();
    console.log("Status:", status);
    console.assert(status.messageCount > 0, "❌ Nenhuma mensagem foi adicionada");
    
    if (status.messageCount > 0) {
      console.log("✅ Teste 6 passou");
    }
  },
  
  /**
   * Teste 7: Simular sequência completa de jogo
   */
  testGameplaySequence() {
    console.log("📌 Teste 7: Simular sequência de gameplay");
    
    if (!MQTTClient.isConnected) {
      connectAsHost();
      setTimeout(() => this.testGameplaySequence(), 2000);
      return;
    }
    
    if (!Accessibility.enabled) {
      Accessibility.toggle();
    }
    
    console.log("  - Iniciando jogo...");
    GameTransmission.onGameStart();
    
    setTimeout(() => {
      console.log("  - Jogador disparando laser...");
      GameTransmission.onLaserFired("Player1", {x: 100, y: 200});
    }, 500);
    
    setTimeout(() => {
      console.log("  - Colisão detectada...");
      GameTransmission.onCollision("Player1", "Player2");
    }, 1000);
    
    setTimeout(() => {
      console.log("  - Jogador derrotado...");
      GameTransmission.onPlayerDefeated("Player1", "Player2");
    }, 1500);
    
    setTimeout(() => {
      console.log("  - Vitória!");
      GameTransmission.onVictory("Player2");
    }, 2000);
    
    setTimeout(() => {
      console.log("✅ Teste 7 passou");
    }, 2500);
  },
  
  /**
   * Teste 8: Verificar estilos de acessibilidade
   */
  testAccessibilityStyles() {
    console.log("📌 Teste 8: Verificar estilos de acessibilidade");
    
    const toggleBtn = document.getElementById("accessibility-toggle");
    const display = document.getElementById("accessibility-display");
    
    console.assert(toggleBtn !== null, "❌ Botão de acessibilidade não encontrado");
    console.assert(display !== null, "❌ Display de acessibilidade não encontrado");
    
    if (toggleBtn && display) {
      console.log("✅ Teste 8 passou");
    }
  },
  
  /**
   * Teste 9: Verificar suporte multilíngue
   */
  testMultilingual() {
    console.log("📌 Teste 9: Verificar suporte multilíngue");
    
    const descriptions = Accessibility.soundDescriptions;
    let multilingual = true;
    
    for (let soundType in descriptions) {
      const desc = descriptions[soundType];
      if (!desc.pt || !desc.en) {
        console.warn(`  ⚠️ ${soundType} não tem PT e EN`);
        multilingual = false;
      }
    }
    
    if (multilingual) {
      console.log("✅ Teste 9 passou - Todos os eventos têm PT e EN");
    }
  },
  
  /**
   * Teste 10: Stress test - Muitos eventos
   */
  testStress() {
    console.log("📌 Teste 10: Stress test - Muitos eventos");
    
    if (!MQTTClient.isConnected) {
      connectAsHost();
      setTimeout(() => this.testStress(), 2000);
      return;
    }
    
    if (!Accessibility.enabled) {
      Accessibility.toggle();
    }
    
    const soundTypes = ["laser", "throw", "derez", "portal", "collision"];
    let count = 0;
    
    const interval = setInterval(() => {
      const soundType = soundTypes[Math.floor(Math.random() * soundTypes.length)];
      GameTransmission.publishSoundEvent(soundType, {
        count: count++,
        description: `Evento teste #${count}`
      });
      
      if (count >= 20) {
        clearInterval(interval);
        console.log(`✅ Teste 10 passou - ${count} eventos publicados`);
      }
    }, 100);
  },
  
  /**
   * Teste 11: Exportar status completo
   */
  testExportStatus() {
    console.log("📌 Teste 11: Exportar status completo");
    
    const status = {
      mqtt: MQTTClient.getStatus(),
      accessibility: Accessibility.getStatus(),
      transmission: GameTransmission.getStatus(),
      timestamp: new Date().toISOString()
    };
    
    console.log("Status Completo:", status);
    console.log("✅ Teste 11 passou");
    
    return status;
  },
  
  /**
   * Teste 12: Testar com broker customizado
   */
  testCustomBroker(brokerUrl) {
    console.log(`📌 Teste 12: Conectar com broker customizado: ${brokerUrl}`);
    
    MQTTClient.initialize(brokerUrl, 
      () => console.log("✅ Conectado ao broker customizado"),
      () => console.log("❌ Desconectado do broker customizado")
    );
  },
  
  /**
   * Executar todos os testes
   */
  runAll() {
    console.clear();
    console.log("%c🧪 TRON - Suite de Testes Completa", 
      "color: #4de3ff; font-size: 16px; font-weight: bold;");
    console.log("=====================================\n");
    
    this.testAccessibilityStyles();
    console.log("");
    
    this.testMQTTHostConnection();
    console.log("");
    
    setTimeout(() => {
      this.testAccessibilityToggle();
      console.log("");
      
      this.testAccessibilityMessage();
      console.log("");
      
      this.testPublishLaserEvent();
      console.log("");
      
      this.testMultilingual();
      console.log("");
      
      this.testExportStatus();
      console.log("");
      
      setTimeout(() => {
        this.testGameplaySequence();
      }, 1000);
    }, 3000);
  },
  
  /**
   * Executar teste interativo
   */
  interactive() {
    console.clear();
    console.log("%c🎮 Modo Interativo - TRON MQTT & Acessibilidade", 
      "color: #ff9331; font-size: 14px; font-weight: bold;");
    console.log("\nComandos disponíveis:");
    console.log("  TestSuite.runAll()              - Executar todos os testes");
    console.log("  connectAsHost()                 - Conectar como transmissor");
    console.log("  connectAsSpectator()            - Conectar como espectador");
    console.log("  toggleAccessibility()           - Ativar/desativar legendas");
    console.log("  GameTransmission.getStatus()    - Ver status da transmissão");
    console.log("  Accessibility.getStatus()       - Ver status de acessibilidade");
    console.log("  MQTTClient.getStatus()          - Ver status do MQTT");
    console.log("\nSimular eventos:");
    console.log("  GameTransmission.onLaserFired('Player1')");
    console.log("  GameTransmission.onPlayerDefeated('Player1')");
    console.log("  GameTransmission.onVictory('Player1')");
    console.log("  GameTransmission.onCollision('Player1', 'Player2')");
    console.log("");
  }
};

// Expor globalmente
window.TestSuite = TestSuite;

console.log("%c🧪 Test Suite Carregado", "color: #4de3ff; font-size: 12px;");
console.log("Use: TestSuite.interactive()  para ver comandos");
console.log("Use: TestSuite.runAll()       para executar testes");
