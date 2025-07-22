import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';

class NotificationService {
  constructor() {
    this.configure();
  }

  configure() {
    PushNotification.configure({
      // Callback quando notificação é recebida (foreground ou background)
      onNotification: function(notification) {
        console.log('Notificação recebida:', notification);
        
        // Callback obrigatório para iOS
        if (notification.finish) {
          notification.finish(PushNotification.FetchResult.NoData);
        }
      },

      // Callback quando token é gerado (Android)
      onRegister: function(token) {
        console.log('Token de notificação:', token);
      },

      // Permissões para iOS
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      // Solicitar permissões na inicialização (iOS)
      requestPermissions: Platform.OS === 'ios',
    });

    // Criar canal de notificação para Android
    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: 'bluetooth-chat',
          channelName: 'Bluetooth Chat',
          channelDescription: 'Notificações do chat Bluetooth',
          soundName: 'default',
          importance: 4,
          vibrate: true,
        },
        (created) => console.log(`Canal de notificação criado: ${created}`)
      );
    }
  }

  // Mostrar notificação local
  showNotification(title, message, data = {}) {
    PushNotification.localNotification({
      channelId: 'bluetooth-chat',
      title: title,
      message: message,
      playSound: true,
      soundName: 'default',
      vibrate: true,
      vibration: 300,
      userInfo: data,
      actions: ['Responder', 'Visualizar'],
      invokeApp: true,
      priority: 'high',
      visibility: 'public',
      importance: 'high',
    });
  }

  // Notificação para nova mensagem
  showNewMessageNotification(deviceName, messageText, deviceId) {
    const title = `Nova mensagem de ${deviceName || 'Dispositivo Desconhecido'}`;
    const message = messageText.length > 50 
      ? `${messageText.substring(0, 50)}...` 
      : messageText;

    this.showNotification(title, message, {
      type: 'new_message',
      deviceId: deviceId,
      deviceName: deviceName
    });
  }

  // Notificação para conexão estabelecida
  showConnectionNotification(deviceName, connected = true) {
    const title = connected ? 'Dispositivo Conectado' : 'Dispositivo Desconectado';
    const message = `${deviceName || 'Dispositivo Desconhecido'} foi ${connected ? 'conectado' : 'desconectado'}`;

    this.showNotification(title, message, {
      type: connected ? 'device_connected' : 'device_disconnected',
      deviceName: deviceName
    });
  }

  // Limpar todas as notificações
  clearAllNotifications() {
    PushNotification.cancelAllLocalNotifications();
  }

  // Limpar notificações por ID
  clearNotification(id) {
    PushNotification.cancelLocalNotifications({ id: id });
  }

  // Obter notificações agendadas
  getScheduledNotifications(callback) {
    PushNotification.getScheduledLocalNotifications(callback);
  }

  // Verificar permissões
  checkPermissions(callback) {
    PushNotification.checkPermissions(callback);
  }

  // Solicitar permissões (iOS)
  requestPermissions() {
    return PushNotification.requestPermissions();
  }

  // Configurar badge (iOS)
  setBadgeNumber(number) {
    if (Platform.OS === 'ios') {
      PushNotification.setApplicationIconBadgeNumber(number);
    }
  }

  // Obter badge atual (iOS)
  getBadgeNumber(callback) {
    if (Platform.OS === 'ios') {
      PushNotification.getApplicationIconBadgeNumber(callback);
    }
  }

  // Abandonar todas as notificações (iOS)
  abandonPermissions() {
    PushNotification.abandonPermissions();
  }
}

// Exportar instância singleton
export default new NotificationService();

