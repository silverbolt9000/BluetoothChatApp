# Bluetooth Chat App

Um aplicativo Android de mensagens via Bluetooth desenvolvido em React Native que permite comunicação ponto a ponto sem necessidade de internet.

## 📱 Funcionalidades

- **Comunicação Bluetooth**: Conecte-se a outros dispositivos via Bluetooth clássico
- **Chat em Tempo Real**: Troque mensagens instantaneamente entre dispositivos conectados
- **Histórico de Conversas**: Mantenha um registro completo de todas as conversas
- **Funcionamento em Segundo Plano**: Receba notificações mesmo com o app em background
- **Interface Intuitiva**: Design moderno e fácil de usar
- **Gerenciamento de Dispositivos**: Descubra, conecte e gerencie dispositivos conhecidos
- **Armazenamento Local**: Todas as mensagens são salvas localmente no dispositivo

## 🚀 Tecnologias Utilizadas

- **React Native 0.80.1**: Framework principal para desenvolvimento mobile
- **React Navigation**: Sistema de navegação entre telas
- **AsyncStorage**: Armazenamento local de dados
- **react-native-bluetooth-classic**: Comunicação Bluetooth
- **react-native-push-notification**: Sistema de notificações
- **Context API**: Gerenciamento de estado global

## 📋 Pré-requisitos

- Node.js 18+ 
- React Native CLI
- Android Studio
- JDK 11+
- Dispositivo Android com Bluetooth (API 21+)

## 🛠️ Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/silverbolt9000/BluetoothChatApp
cd BluetoothChatApp
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o ambiente Android
```bash
# Instale as dependências do Android
cd android
./gradlew clean
cd ..
```

### 4. Execute o aplicativo
```bash
# Para dispositivo físico
npx react-native run-android

# Para emulador (limitado - Bluetooth não funciona em emuladores)
npx react-native run-android
```

## 📱 Como Usar

### Primeira Execução

1. **Permissões**: Na primeira execução, o app solicitará permissões de Bluetooth e localização
2. **Bluetooth**: Certifique-se de que o Bluetooth está habilitado no dispositivo
3. **Descoberta**: Use a aba "Descobrir" para encontrar outros dispositivos

### Conectando a um Dispositivo

1. Toque em "Buscar Dispositivos" na tela principal
2. Selecione um dispositivo da lista de dispositivos disponíveis
3. Confirme a conexão quando solicitado
4. Comece a conversar!

### Navegação

- **Descobrir**: Encontre e conecte-se a novos dispositivos
- **Histórico**: Visualize conversas anteriores
- **Configurações**: Gerencie dados e configurações do app

## 🏗️ Arquitetura do Projeto

```
src/
├── context/
│   └── BluetoothContext.js     # Gerenciamento de estado global
├── screens/
│   ├── DeviceDiscoveryScreen.js    # Tela de descoberta de dispositivos
│   ├── ChatScreen.js               # Tela de chat
│   ├── ConversationHistoryScreen.js # Histórico de conversas
│   └── SettingsScreen.js           # Configurações
└── services/
    ├── BluetoothService.js         # Serviço de comunicação Bluetooth
    ├── StorageService.js           # Armazenamento local
    ├── NotificationService.js      # Sistema de notificações
    └── BackgroundService.js        # Serviço em segundo plano
```

### Componentes Principais

#### BluetoothService
Gerencia todas as operações Bluetooth:
- Descoberta de dispositivos
- Conexão e desconexão
- Envio e recebimento de mensagens
- Gerenciamento de permissões

#### StorageService
Responsável pelo armazenamento local:
- Salvamento de mensagens
- Histórico de conversas
- Gerenciamento de dispositivos conhecidos
- Exportação/importação de dados

#### BackgroundService
Mantém o app funcionando em segundo plano:
- Monitoramento de conexão
- Tentativas de reconexão automática
- Gerenciamento do ciclo de vida do app

#### NotificationService
Sistema de notificações:
- Notificações de novas mensagens
- Alertas de conexão/desconexão
- Configuração de canais de notificação

## 🔧 Configuração Avançada

### Permissões Android

O app requer as seguintes permissões no `AndroidManifest.xml`:

```xml
<!-- Bluetooth -->
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />

<!-- Android 12+ -->
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />

<!-- Notificações -->
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
```

### Configurações de Build

Para builds de produção, adicione ao `android/app/build.gradle`:

```gradle
android {
    ...
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}
```

## 🐛 Solução de Problemas

### Problemas Comuns

**Bluetooth não conecta**
- Verifique se ambos os dispositivos têm Bluetooth habilitado
- Certifique-se de que os dispositivos estão próximos (< 10 metros)
- Tente reiniciar o Bluetooth em ambos os dispositivos

**Permissões negadas**
- Vá em Configurações > Apps > Bluetooth Chat > Permissões
- Habilite todas as permissões necessárias
- Reinicie o aplicativo

**Notificações não aparecem**
- Verifique se as notificações estão habilitadas para o app
- Certifique-se de que o modo "Não perturbe" não está ativo

### Logs de Debug

Para habilitar logs detalhados:

```bash
# Android
adb logcat | grep BluetoothChat
```

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👥 Autores

- Radamés Terhorst

## 🙏 Agradecimentos

- Comunidade React Native
- Desenvolvedores das bibliotecas utilizadas
- Testadores e contribuidores

## 📞 Suporte

Para suporte e dúvidas:
- Abra uma issue no GitHub
- Consulte a documentação técnica
- Verifique os problemas conhecidos

---

**Nota**: Este aplicativo foi desenvolvido para fins educacionais e demonstração de comunicação Bluetooth em React Native. Para uso em produção, considere implementar medidas adicionais de segurança e criptografia.

