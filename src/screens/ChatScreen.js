import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useBluetooth } from '../context/BluetoothContext';

const ChatScreen = ({ navigation, route }) => {
  const {
    messages,
    isConnected,
    connectedDevice,
    sendMessage,
    disconnect,
    error,
    clearError
  } = useBluetooth();

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef(null);

  const device = route.params?.device || connectedDevice;

  useEffect(() => {
    if (error) {
      Alert.alert('Erro', error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [error]);

  useEffect(() => {
    if (!isConnected) {
      Alert.alert(
        'Conexão Perdida',
        'A conexão com o dispositivo foi perdida.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    }
  }, [isConnected]);

  // Scroll para a última mensagem quando novas mensagens chegam
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      await sendMessage(messageText);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao enviar mensagem');
    } finally {
      setIsSending(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Desconectar',
      'Deseja desconectar deste dispositivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desconectar',
          style: 'destructive',
          onPress: async () => {
            await disconnect();
            navigation.goBack();
          }
        }
      ]
    );
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMessage = ({ item, index }) => {
    const isMyMessage = item.sender === 'me';
    const showTime = index === 0 || 
      (messages[index - 1] && 
       new Date(item.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime() > 60000);

    return (
      <View style={styles.messageContainer}>
        {showTime && (
          <Text style={styles.messageTime}>
            {formatTime(item.timestamp)}
          </Text>
        )}
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessage : styles.otherMessage
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText
            ]}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>
        Nenhuma mensagem ainda
      </Text>
      <Text style={styles.emptyStateSubtext}>
        Envie uma mensagem para começar a conversa
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {device?.name || 'Dispositivo Desconhecido'}
          </Text>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusDot,
                isConnected ? styles.connectedDot : styles.disconnectedDot
              ]}
            />
            <Text style={styles.statusText}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.disconnectButton}
          onPress={handleDisconnect}
        >
          <Text style={styles.disconnectButtonText}>Desconectar</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        style={styles.messagesList}
        data={messages}
        keyExtractor={(item, index) => `${item.timestamp}_${index}`}
        renderItem={renderMessage}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={messages.length === 0 ? styles.emptyContainer : null}
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Digite sua mensagem..."
          placeholderTextColor="#999"
          multiline
          maxLength={500}
          editable={isConnected}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || isSending || !isConnected) && styles.sendButtonDisabled
          ]}
          onPress={handleSendMessage}
          disabled={!inputText.trim() || isSending || !isConnected}
        >
          <Text style={styles.sendButtonText}>
            {isSending ? '...' : 'Enviar'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  headerInfo: {
    flex: 1,
    alignItems: 'center'
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6
  },
  connectedDot: {
    backgroundColor: '#34C759'
  },
  disconnectedDot: {
    backgroundColor: '#FF3B30'
  },
  statusText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12
  },
  disconnectButton: {
    padding: 5
  },
  disconnectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500'
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 20
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
    textAlign: 'center'
  },
  messageContainer: {
    marginVertical: 4
  },
  messageTime: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginVertical: 10
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    marginVertical: 2
  },
  myMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4
  },
  otherMessage: {
    backgroundColor: 'white',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20
  },
  myMessageText: {
    color: 'white'
  },
  otherMessageText: {
    color: '#333'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 10
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc'
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default ChatScreen;

