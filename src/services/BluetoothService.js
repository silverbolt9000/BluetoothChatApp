import BluetoothClassic from 'react-native-bluetooth-classic';
import { PermissionsAndroid, Platform } from 'react-native';

class BluetoothService {
  constructor() {
    this.isConnected = false;
    this.connectedDevice = null;
    this.messageListeners = [];
    this.connectionListeners = [];
  }

  // Solicitar permissões necessárias
  async requestPermissions() {
    if (Platform.OS === 'android') {
      try {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ];

        const granted = await PermissionsAndroid.requestMultiple(permissions);
        
        const allPermissionsGranted = Object.values(granted).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );

        return allPermissionsGranted;
      } catch (error) {
        console.error('Erro ao solicitar permissões:', error);
        return false;
      }
    }
    return true;
  }

  // Verificar se Bluetooth está habilitado
  async isBluetoothEnabled() {
    try {
      return await BluetoothClassic.isBluetoothEnabled();
    } catch (error) {
      console.error('Erro ao verificar Bluetooth:', error);
      return false;
    }
  }

  // Habilitar Bluetooth
  async enableBluetooth() {
    try {
      return await BluetoothClassic.requestBluetoothEnabled();
    } catch (error) {
      console.error('Erro ao habilitar Bluetooth:', error);
      return false;
    }
  }

  // Descobrir dispositivos disponíveis
  async discoverDevices() {
    try {
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        throw new Error('Permissões necessárias não foram concedidas');
      }

      const isEnabled = await this.isBluetoothEnabled();
      if (!isEnabled) {
        const enabled = await this.enableBluetooth();
        if (!enabled) {
          throw new Error('Bluetooth não pôde ser habilitado');
        }
      }

      // Obter dispositivos pareados
      const pairedDevices = await BluetoothClassic.getBondedDevices();
      
      // Iniciar descoberta de novos dispositivos
      const isDiscovering = await BluetoothClassic.isDiscovering();
      if (!isDiscovering) {
        await BluetoothClassic.startDiscovery();
      }

      return pairedDevices;
    } catch (error) {
      console.error('Erro na descoberta de dispositivos:', error);
      throw error;
    }
  }

  // Parar descoberta de dispositivos
  async stopDiscovery() {
    try {
      await BluetoothClassic.cancelDiscovery();
    } catch (error) {
      console.error('Erro ao parar descoberta:', error);
    }
  }

  // Conectar a um dispositivo
  async connectToDevice(device) {
    try {
      if (this.isConnected) {
        await this.disconnect();
      }

      const connection = await BluetoothClassic.connectToDevice(device.id);
      
      if (connection) {
        this.isConnected = true;
        this.connectedDevice = device;
        
        // Configurar listener para mensagens recebidas
        this.setupMessageListener();
        
        // Notificar listeners sobre conexão
        this.notifyConnectionListeners(true, device);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao conectar ao dispositivo:', error);
      throw error;
    }
  }

  // Desconectar dispositivo
  async disconnect() {
    try {
      if (this.connectedDevice) {
        await BluetoothClassic.disconnectFromDevice(this.connectedDevice.id);
      }
      
      this.isConnected = false;
      this.connectedDevice = null;
      
      // Notificar listeners sobre desconexão
      this.notifyConnectionListeners(false, null);
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
  }

  // Enviar mensagem
  async sendMessage(message) {
    try {
      if (!this.isConnected || !this.connectedDevice) {
        throw new Error('Nenhum dispositivo conectado');
      }

      const messageData = JSON.stringify({
        text: message,
        timestamp: new Date().toISOString(),
        sender: 'me'
      });

      const success = await BluetoothClassic.writeToDevice(
        this.connectedDevice.id,
        messageData
      );

      return success;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  // Configurar listener para mensagens recebidas
  setupMessageListener() {
    if (this.connectedDevice) {
      BluetoothClassic.onDeviceRead(this.connectedDevice.id, (data) => {
        try {
          const messageData = JSON.parse(data.data);
          messageData.sender = 'other';
          this.notifyMessageListeners(messageData);
        } catch (error) {
          console.error('Erro ao processar mensagem recebida:', error);
        }
      });
    }
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

  // Notificar listeners sobre novas mensagens
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

  // Notificar listeners sobre mudanças de conexão
  notifyConnectionListeners(isConnected, device) {
    this.connectionListeners.forEach(listener => {
      try {
        listener(isConnected, device);
      } catch (error) {
        console.error('Erro no listener de conexão:', error);
      }
    });
  }

  // Obter status da conexão
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      connectedDevice: this.connectedDevice
    };
  }
}

// Exportar instância singleton
export default new BluetoothService();

