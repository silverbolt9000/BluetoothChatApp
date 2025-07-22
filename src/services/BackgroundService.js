import { AppState } from 'react-native';
import BluetoothService from './BluetoothService';
import NotificationService from './NotificationService';
import StorageService from './StorageService';

class BackgroundService {
  constructor() {
    this.isInBackground = false;
    this.connectionCheckInterval = null;
    this.messageListeners = [];
    this.connectionListeners = [];
    
    this.setupAppStateListener();
    this.setupBluetoothListeners();
  }

  // Configurar listener para mudanças de estado do app
  setupAppStateListener() {
    AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  // Gerenciar mudanças de estado do app
  handleAppStateChange(nextAppState) {
    console.log('Estado do app mudou para:', nextAppState);
    
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      this.isInBackground = true;
      this.startBackgroundTasks();
    } else if (nextAppState === 'active') {
      this.isInBackground = false;
      this.stopBackgroundTasks();
      // Limpar notificações quando o app volta ao primeiro plano
      NotificationService.clearAllNotifications();
    }
  }

  // Iniciar tarefas em segundo plano
  startBackgroundTasks() {
    console.log('Iniciando tarefas em segundo plano');
    
    // Verificar conexão periodicamente
    this.startConnectionCheck();
    
    // Configurar listeners para mensagens em background
    this.setupBackgroundMessageHandling();
  }

  // Parar tarefas em segundo plano
  stopBackgroundTasks() {
    console.log('Parando tarefas em segundo plano');
    
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
  }

  // Verificar conexão periodicamente
  startConnectionCheck() {
    // Verificar conexão a cada 30 segundos
    this.connectionCheckInterval = setInterval(async () => {
      try {
        const status = BluetoothService.getConnectionStatus();
        
        if (!status.isConnected && status.connectedDevice) {
          // Tentar reconectar se a conexão foi perdida
          console.log('Tentando reconectar em segundo plano...');
          await this.attemptReconnection(status.connectedDevice);
        }
      } catch (error) {
        console.error('Erro na verificação de conexão em segundo plano:', error);
      }
    }, 30000);
  }

  // Tentar reconectar automaticamente
  async attemptReconnection(device, maxAttempts = 3) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Tentativa de reconexão ${attempt}/${maxAttempts}`);
        
        const success = await BluetoothService.connectToDevice(device);
        
        if (success) {
          console.log('Reconexão bem-sucedida');
          
          if (this.isInBackground) {
            NotificationService.showConnectionNotification(device.name, true);
          }
          
          return true;
        }
      } catch (error) {
        console.error(`Falha na tentativa ${attempt}:`, error);
      }
      
      // Aguardar antes da próxima tentativa
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    console.log('Falha em todas as tentativas de reconexão');
    
    if (this.isInBackground) {
      NotificationService.showConnectionNotification(device.name, false);
    }
    
    return false;
  }

  // Configurar listeners do Bluetooth
  setupBluetoothListeners() {
    // Listener para mensagens
    const handleMessage = async (message) => {
      console.log('Mensagem recebida em segundo plano:', message);
      
      // Salvar mensagem
      const status = BluetoothService.getConnectionStatus();
      if (status.connectedDevice) {
        await StorageService.saveMessage(status.connectedDevice.id, message);
      }
      
      // Mostrar notificação se em segundo plano
      if (this.isInBackground && status.connectedDevice) {
        NotificationService.showNewMessageNotification(
          status.connectedDevice.name,
          message.text,
          status.connectedDevice.id
        );
      }
      
      // Notificar listeners
      this.notifyMessageListeners(message);
    };

    // Listener para conexão
    const handleConnection = (isConnected, device) => {
      console.log('Status de conexão mudou:', { isConnected, device: device?.name });
      
      // Mostrar notificação se em segundo plano
      if (this.isInBackground && device) {
        NotificationService.showConnectionNotification(device.name, isConnected);
      }
      
      // Notificar listeners
      this.notifyConnectionListeners(isConnected, device);
    };

    BluetoothService.addMessageListener(handleMessage);
    BluetoothService.addConnectionListener(handleConnection);
  }

  // Configurar manipulação de mensagens em segundo plano
  setupBackgroundMessageHandling() {
    // Aqui você pode implementar lógica adicional para lidar com mensagens
    // quando o app está em segundo plano, como:
    // - Respostas automáticas
    // - Filtros de mensagem
    // - Logs detalhados
    console.log('Configurando manipulação de mensagens em segundo plano');
  }

  // Adicionar listener para mensagens
  addMessageListener(callback) {
    this.messageListeners.push(callback);
  }

  // Remover listener para mensagens
  removeMessageListener(callback) {
    this.messageListeners = this.messageListeners.filter(
      listener => listener !== callback
    );
  }

  // Notificar listeners sobre mensagens
  notifyMessageListeners(message) {
    this.messageListeners.forEach(listener => {
      try {
        listener(message);
      } catch (error) {
        console.error('Erro no listener de mensagem:', error);
      }
    });
  }

  // Adicionar listener para conexão
  addConnectionListener(callback) {
    this.connectionListeners.push(callback);
  }

  // Remover listener para conexão
  removeConnectionListener(callback) {
    this.connectionListeners = this.connectionListeners.filter(
      listener => listener !== callback
    );
  }

  // Notificar listeners sobre conexão
  notifyConnectionListeners(isConnected, device) {
    this.connectionListeners.forEach(listener => {
      try {
        listener(isConnected, device);
      } catch (error) {
        console.error('Erro no listener de conexão:', error);
      }
    });
  }

  // Obter status do serviço
  getStatus() {
    return {
      isInBackground: this.isInBackground,
      hasConnectionCheck: !!this.connectionCheckInterval,
      messageListeners: this.messageListeners.length,
      connectionListeners: this.connectionListeners.length
    };
  }

  // Forçar verificação de conexão
  async forceConnectionCheck() {
    const status = BluetoothService.getConnectionStatus();
    
    if (status.connectedDevice && !status.isConnected) {
      return await this.attemptReconnection(status.connectedDevice);
    }
    
    return status.isConnected;
  }

  // Limpar recursos
  cleanup() {
    this.stopBackgroundTasks();
    AppState.removeEventListener('change', this.handleAppStateChange);
    this.messageListeners = [];
    this.connectionListeners = [];
  }
}

// Exportar instância singleton
export default new BackgroundService();

