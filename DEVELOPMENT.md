# Guia de Desenvolvimento - Bluetooth Chat App

Este documento fornece informações detalhadas sobre a arquitetura, implementação e desenvolvimento do Bluetooth Chat App.

## 🏗️ Arquitetura Detalhada

### Padrão de Arquitetura

O aplicativo segue uma arquitetura baseada em **Context + Services**, onde:

- **Context**: Gerencia o estado global da aplicação
- **Services**: Encapsulam lógicas específicas (Bluetooth, Storage, etc.)
- **Screens**: Componentes de interface que consomem o contexto
- **Navigation**: Sistema de navegação entre telas

### Fluxo de Dados

```
User Interaction → Screen → Context → Service → External API/Storage
                                  ↓
                            State Update → Screen Re-render
```

## 📱 Implementação dos Serviços

### BluetoothService

**Responsabilidades:**
- Gerenciamento de conexões Bluetooth
- Descoberta de dispositivos
- Envio/recebimento de mensagens
- Controle de permissões

**Métodos Principais:**

```javascript
// Descobrir dispositivos
async discoverDevices()

// Conectar a um dispositivo
async connectToDevice(device)

// Enviar mensagem
async sendMessage(message)

// Configurar listeners
addMessageListener(callback)
addConnectionListener(callback)
```

**Protocolo de Mensagens:**

As mensagens são enviadas como JSON:

```json
{
  "text": "Conteúdo da mensagem",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "sender": "me|other"
}
```

### StorageService

**Responsabilidades:**
- Armazenamento local de mensagens
- Gerenciamento de dispositivos conhecidos
- Exportação/importação de dados
- Estatísticas de conversas

**Estrutura de Dados:**

```javascript
// Mensagem
{
  id: "timestamp_unique",
  text: "Conteúdo",
  timestamp: "ISO_DATE",
  sender: "me|other"
}

// Dispositivo
{
  id: "bluetooth_address",
  name: "Nome do dispositivo",
  firstSeen: "ISO_DATE",
  lastSeen: "ISO_DATE"
}
```

### NotificationService

**Responsabilidades:**
- Configuração de notificações locais
- Criação de canais de notificação (Android)
- Gerenciamento de badges (iOS)

**Tipos de Notificação:**

1. **Nova Mensagem**: Quando uma mensagem é recebida em background
2. **Conexão**: Quando um dispositivo conecta/desconecta
3. **Sistema**: Alertas de erro ou status

### BackgroundService

**Responsabilidades:**
- Monitoramento do estado da aplicação
- Tentativas de reconexão automática
- Gerenciamento de tarefas em background

**Ciclo de Vida:**

```
App Active → Background → Inactive → Active
     ↓           ↓           ↓         ↓
  Normal    Start BG     Stop BG   Clear
  Mode      Tasks       Tasks     Notifications
```

## 🎨 Interface de Usuário

### Design System

**Cores Principais:**
- Primary: `#007AFF` (Azul iOS)
- Success: `#34C759` (Verde)
- Danger: `#FF3B30` (Vermelho)
- Warning: `#FF9500` (Laranja)
- Background: `#f5f5f5` (Cinza claro)

**Tipografia:**
- Títulos: 18-28px, weight 600-bold
- Subtítulos: 14-16px, weight 500
- Corpo: 14-16px, weight 400
- Captions: 12px, weight 400

### Componentes Reutilizáveis

**DeviceItem:**
```javascript
// Representa um dispositivo na lista
<DeviceItem 
  device={device}
  onPress={handleConnect}
  showStatus={true}
/>
```

**MessageBubble:**
```javascript
// Bolha de mensagem no chat
<MessageBubble 
  message={message}
  isOwn={message.sender === 'me'}
  showTime={shouldShowTime}
/>
```

## 🔧 Configuração de Desenvolvimento

### Ambiente Local

1. **Node.js**: Versão 18+ recomendada
2. **React Native CLI**: `npm install -g react-native-cli`
3. **Android Studio**: Para emulação e debugging
4. **Flipper**: Para debugging avançado

### Scripts Úteis

```json
{
  "scripts": {
    "start": "react-native start",
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "test": "jest",
    "lint": "eslint .",
    "clean": "cd android && ./gradlew clean && cd .."
  }
}
```

### Debugging

**React Native Debugger:**
```bash
# Instalar
npm install -g react-native-debugger

# Usar
react-native-debugger
```

**Flipper Plugins Recomendados:**
- React DevTools
- Network Inspector
- AsyncStorage Inspector
- Crash Reporter

## 🧪 Estratégias de Teste

### Testes Unitários

**Serviços:**
```javascript
// Exemplo de teste para StorageService
describe('StorageService', () => {
  test('should save message correctly', async () => {
    const message = { text: 'Test', sender: 'me' };
    const result = await StorageService.saveMessage('device1', message);
    expect(result).toContain(message);
  });
});
```

**Context:**
```javascript
// Teste do BluetoothContext
describe('BluetoothContext', () => {
  test('should update connection status', () => {
    const { result } = renderHook(() => useBluetooth());
    // Test implementation
  });
});
```

### Testes de Integração

**Fluxo de Conexão:**
1. Descobrir dispositivos
2. Conectar a um dispositivo
3. Enviar mensagem
4. Verificar recebimento
5. Desconectar

### Testes Manuais

**Checklist de Funcionalidades:**
- [ ] Descoberta de dispositivos
- [ ] Conexão Bluetooth
- [ ] Envio de mensagens
- [ ] Recebimento de mensagens
- [ ] Notificações em background
- [ ] Histórico de conversas
- [ ] Reconexão automática

## 🚀 Build e Deploy

### Build de Desenvolvimento

```bash
# Debug APK
cd android
./gradlew assembleDebug
```

### Build de Produção

```bash
# Release APK
cd android
./gradlew assembleRelease
```

### Configurações de Release

**Proguard (android/app/proguard-rules.pro):**
```
-keep class com.facebook.react.** { *; }
-keep class com.swmansion.** { *; }
-keep class io.github.douglasjunior.** { *; }
```

**Signing Config:**
```gradle
android {
    signingConfigs {
        release {
            storeFile file('my-release-key.keystore')
            storePassword 'password'
            keyAlias 'my-key-alias'
            keyPassword 'password'
        }
    }
}
```

## 🔒 Considerações de Segurança

### Bluetooth Security

**Pareamento Seguro:**
- Use sempre pareamento autenticado
- Implemente verificação de dispositivos conhecidos
- Considere criptografia adicional para dados sensíveis

**Validação de Dados:**
```javascript
// Validar mensagens recebidas
function validateMessage(data) {
  try {
    const message = JSON.parse(data);
    return message.text && message.timestamp && message.sender;
  } catch {
    return false;
  }
}
```

### Armazenamento Local

**Criptografia de Dados:**
```javascript
// Exemplo de criptografia simples
import CryptoJS from 'crypto-js';

function encryptMessage(message, key) {
  return CryptoJS.AES.encrypt(JSON.stringify(message), key).toString();
}
```

## 📊 Performance

### Otimizações Implementadas

1. **Lazy Loading**: Componentes carregados sob demanda
2. **Memoização**: React.memo para componentes pesados
3. **Debouncing**: Para busca de dispositivos
4. **Pagination**: Para histórico de mensagens longas

### Monitoramento

**Métricas Importantes:**
- Tempo de descoberta de dispositivos
- Latência de mensagens
- Uso de memória
- Duração da bateria

**Ferramentas:**
- Flipper Performance Monitor
- React Native Performance Monitor
- Android Profiler

## 🔄 Versionamento

### Semantic Versioning

- **MAJOR**: Mudanças incompatíveis na API
- **MINOR**: Novas funcionalidades compatíveis
- **PATCH**: Correções de bugs

### Changelog

Manter um arquivo `CHANGELOG.md` com:
- Novas funcionalidades
- Correções de bugs
- Mudanças importantes
- Migrações necessárias

## 🤝 Contribuição

### Padrões de Código

**ESLint Configuration:**
```json
{
  "extends": ["@react-native-community"],
  "rules": {
    "indent": ["error", 2],
    "quotes": ["error", "single"],
    "semi": ["error", "always"]
  }
}
```

**Prettier Configuration:**
```json
{
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": true
}
```

### Git Workflow

1. **Feature Branch**: `feature/nome-da-feature`
2. **Bug Fix**: `bugfix/descricao-do-bug`
3. **Hotfix**: `hotfix/correcao-urgente`

### Commit Messages

```
feat: adiciona descoberta automática de dispositivos
fix: corrige problema de reconexão em background
docs: atualiza documentação da API
style: ajusta formatação do código
refactor: reorganiza estrutura de serviços
test: adiciona testes para StorageService
```

## 📚 Recursos Adicionais

### Documentação Externa

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [Bluetooth Classic Library](https://github.com/kenjdavidson/react-native-bluetooth-classic)

### Comunidade

- [React Native Community](https://github.com/react-native-community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/react-native)
- [Discord React Native](https://discord.gg/react-native)

### Ferramentas Recomendadas

- **IDE**: VS Code com extensões React Native
- **Debugging**: Flipper, React Native Debugger
- **Testing**: Jest, Detox
- **CI/CD**: GitHub Actions, Bitrise

---

Este guia deve ser atualizado conforme o projeto evolui. Para dúvidas específicas sobre implementação, consulte o código-fonte ou abra uma issue no repositório.

