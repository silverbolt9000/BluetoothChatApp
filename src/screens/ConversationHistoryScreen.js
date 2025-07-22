import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StatusBar
} from 'react-native';
import { useBluetooth } from '../context/BluetoothContext';
import StorageService from '../services/StorageService';

const ConversationHistoryScreen = ({ navigation }) => {
  const { knownDevices, loadKnownDevices } = useBluetooth();
  const [conversations, setConversations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, [knownDevices]);

  const loadConversations = async () => {
    try {
      const conversationsData = [];
      
      for (const device of knownDevices) {
        const messages = await StorageService.getMessages(device.id);
        const stats = await StorageService.getConversationStats(device.id);
        
        if (messages.length > 0) {
          conversationsData.push({
            device,
            lastMessage: messages[messages.length - 1],
            stats,
            messages
          });
        }
      }
      
      // Ordenar por última mensagem
      conversationsData.sort((a, b) => 
        new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
      );
      
      setConversations(conversationsData);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadKnownDevices();
    await loadConversations();
    setRefreshing(false);
  };

  const handleOpenConversation = (conversation) => {
    navigation.navigate('Chat', { 
      device: conversation.device,
      fromHistory: true 
    });
  };

  const handleDeleteConversation = (conversation) => {
    Alert.alert(
      'Excluir Conversa',
      `Deseja excluir toda a conversa com "${conversation.device.name || conversation.device.id}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.removeKnownDevice(conversation.device.id);
              await loadKnownDevices();
              await loadConversations();
            } catch (error) {
              Alert.alert('Erro', 'Falha ao excluir conversa');
            }
          }
        }
      ]
    );
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffDays === 1) {
      return 'Ontem';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
      });
    }
  };

  const renderConversationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleOpenConversation(item)}
      onLongPress={() => handleDeleteConversation(item)}
    >
      <View style={styles.conversationInfo}>
        <Text style={styles.deviceName}>
          {item.device.name || 'Dispositivo Desconhecido'}
        </Text>
        <Text style={styles.deviceId} numberOfLines={1}>
          {item.device.id}
        </Text>
        <Text style={styles.lastMessage} numberOfLines={2}>
          {item.lastMessage.sender === 'me' ? 'Você: ' : ''}
          {item.lastMessage.text}
        </Text>
      </View>
      
      <View style={styles.conversationMeta}>
        <Text style={styles.timestamp}>
          {formatTime(item.lastMessage.timestamp)}
        </Text>
        <Text style={styles.messageCount}>
          {item.stats.totalMessages} mensagens
        </Text>
        <View style={styles.statsContainer}>
          <Text style={styles.statText}>
            Enviadas: {item.stats.myMessages}
          </Text>
          <Text style={styles.statText}>
            Recebidas: {item.stats.theirMessages}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>
        Nenhuma conversa ainda
      </Text>
      <Text style={styles.emptyStateSubtext}>
        Conecte-se a um dispositivo e comece a conversar para ver o histórico aqui
      </Text>
      <TouchableOpacity
        style={styles.startChatButton}
        onPress={() => navigation.navigate('DeviceDiscovery')}
      >
        <Text style={styles.startChatButtonText}>
          Iniciar Nova Conversa
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Histórico de Conversas</Text>
        
        <TouchableOpacity
          style={styles.newChatButton}
          onPress={() => navigation.navigate('DeviceDiscovery')}
        >
          <Text style={styles.newChatButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.conversationsList}
        data={conversations}
        keyExtractor={(item) => item.device.id}
        renderItem={renderConversationItem}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
          />
        }
        contentContainerStyle={conversations.length === 0 ? styles.emptyContainer : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    backgroundColor: '#007AFF',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backButton: {
    padding: 5
  },
  backButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold'
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center'
  },
  newChatButton: {
    padding: 5
  },
  newChatButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold'
  },
  conversationsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30
  },
  startChatButton: {
    backgroundColor: '#007AFF',
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 15
  },
  startChatButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  conversationItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5
  },
  conversationInfo: {
    flex: 1,
    marginRight: 12
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  deviceId: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 8
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18
  },
  conversationMeta: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minWidth: 80
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4
  },
  messageCount: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 8
  },
  statsContainer: {
    alignItems: 'flex-end'
  },
  statText: {
    fontSize: 10,
    color: '#999',
    marginBottom: 2
  }
});

export default ConversationHistoryScreen;

