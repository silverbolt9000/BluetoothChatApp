import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageService {
  constructor() {
    this.MESSAGES_KEY = '@bluetooth_chat_messages';
    this.DEVICES_KEY = '@bluetooth_chat_devices';
  }

  // Salvar mensagem no histórico
  async saveMessage(deviceId, message) {
    try {
      const existingMessages = await this.getMessages(deviceId);
      const updatedMessages = [...existingMessages, {
        ...message,
        id: Date.now().toString(),
        timestamp: message.timestamp || new Date().toISOString()
      }];

      const key = `${this.MESSAGES_KEY}_${deviceId}`;
      await AsyncStorage.setItem(key, JSON.stringify(updatedMessages));
      
      return updatedMessages;
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
      throw error;
    }
  }

  // Obter mensagens de um dispositivo
  async getMessages(deviceId) {
    try {
      const key = `${this.MESSAGES_KEY}_${deviceId}`;
      const messagesJson = await AsyncStorage.getItem(key);
      
      if (messagesJson) {
        return JSON.parse(messagesJson);
      }
      
      return [];
    } catch (error) {
      console.error('Erro ao obter mensagens:', error);
      return [];
    }
  }

  // Limpar mensagens de um dispositivo
  async clearMessages(deviceId) {
    try {
      const key = `${this.MESSAGES_KEY}_${deviceId}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Erro ao limpar mensagens:', error);
      throw error;
    }
  }

  // Salvar dispositivo conhecido
  async saveKnownDevice(device) {
    try {
      const knownDevices = await this.getKnownDevices();
      
      // Verificar se dispositivo já existe
      const existingIndex = knownDevices.findIndex(d => d.id === device.id);
      
      if (existingIndex >= 0) {
        // Atualizar dispositivo existente
        knownDevices[existingIndex] = {
          ...knownDevices[existingIndex],
          ...device,
          lastSeen: new Date().toISOString()
        };
      } else {
        // Adicionar novo dispositivo
        knownDevices.push({
          ...device,
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString()
        });
      }

      await AsyncStorage.setItem(this.DEVICES_KEY, JSON.stringify(knownDevices));
      return knownDevices;
    } catch (error) {
      console.error('Erro ao salvar dispositivo:', error);
      throw error;
    }
  }

  // Obter dispositivos conhecidos
  async getKnownDevices() {
    try {
      const devicesJson = await AsyncStorage.getItem(this.DEVICES_KEY);
      
      if (devicesJson) {
        return JSON.parse(devicesJson);
      }
      
      return [];
    } catch (error) {
      console.error('Erro ao obter dispositivos conhecidos:', error);
      return [];
    }
  }

  // Remover dispositivo conhecido
  async removeKnownDevice(deviceId) {
    try {
      const knownDevices = await this.getKnownDevices();
      const filteredDevices = knownDevices.filter(d => d.id !== deviceId);
      
      await AsyncStorage.setItem(this.DEVICES_KEY, JSON.stringify(filteredDevices));
      
      // Também remover mensagens do dispositivo
      await this.clearMessages(deviceId);
      
      return filteredDevices;
    } catch (error) {
      console.error('Erro ao remover dispositivo:', error);
      throw error;
    }
  }

  // Obter estatísticas de conversa
  async getConversationStats(deviceId) {
    try {
      const messages = await this.getMessages(deviceId);
      
      const stats = {
        totalMessages: messages.length,
        myMessages: messages.filter(m => m.sender === 'me').length,
        theirMessages: messages.filter(m => m.sender === 'other').length,
        firstMessage: messages.length > 0 ? messages[0].timestamp : null,
        lastMessage: messages.length > 0 ? messages[messages.length - 1].timestamp : null
      };
      
      return stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        totalMessages: 0,
        myMessages: 0,
        theirMessages: 0,
        firstMessage: null,
        lastMessage: null
      };
    }
  }

  // Exportar dados para backup
  async exportData() {
    try {
      const knownDevices = await this.getKnownDevices();
      const exportData = {
        devices: knownDevices,
        conversations: {}
      };

      // Obter mensagens para cada dispositivo
      for (const device of knownDevices) {
        const messages = await this.getMessages(device.id);
        exportData.conversations[device.id] = messages;
      }

      return exportData;
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      throw error;
    }
  }

  // Importar dados de backup
  async importData(data) {
    try {
      if (data.devices) {
        await AsyncStorage.setItem(this.DEVICES_KEY, JSON.stringify(data.devices));
      }

      if (data.conversations) {
        for (const [deviceId, messages] of Object.entries(data.conversations)) {
          const key = `${this.MESSAGES_KEY}_${deviceId}`;
          await AsyncStorage.setItem(key, JSON.stringify(messages));
        }
      }

      return true;
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      throw error;
    }
  }

  // Limpar todos os dados
  async clearAllData() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const chatKeys = keys.filter(key => 
        key.startsWith(this.MESSAGES_KEY) || key === this.DEVICES_KEY
      );
      
      await AsyncStorage.multiRemove(chatKeys);
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      throw error;
    }
  }
}

// Exportar instância singleton
export default new StorageService();

