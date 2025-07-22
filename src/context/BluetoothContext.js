import React, { createContext, useContext, useReducer, useEffect } from 'react';
import BluetoothService from '../services/BluetoothService';
import StorageService from '../services/StorageService';
import BackgroundService from '../services/BackgroundService';
import NotificationService from '../services/NotificationService';

// Estado inicial
const initialState = {
  // Status da conexão
  isConnected: false,
  connectedDevice: null,
  
  // Dispositivos
  availableDevices: [],
  knownDevices: [],
  isDiscovering: false,
  
  // Mensagens
  messages: [],
  
  // Status do Bluetooth
  isBluetoothEnabled: false,
  hasPermissions: false,
  
  // UI
  isLoading: false,
  error: null
};

// Tipos de ação
const actionTypes = {
  SET_BLUETOOTH_STATUS: 'SET_BLUETOOTH_STATUS',
  SET_PERMISSIONS: 'SET_PERMISSIONS',
  SET_DISCOVERING: 'SET_DISCOVERING',
  SET_AVAILABLE_DEVICES: 'SET_AVAILABLE_DEVICES',
  SET_KNOWN_DEVICES: 'SET_KNOWN_DEVICES',
  SET_CONNECTION_STATUS: 'SET_CONNECTION_STATUS',
  SET_MESSAGES: 'SET_MESSAGES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
function bluetoothReducer(state, action) {
  switch (action.type) {
    case actionTypes.SET_BLUETOOTH_STATUS:
      return {
        ...state,
        isBluetoothEnabled: action.payload
      };
      
    case actionTypes.SET_PERMISSIONS:
      return {
        ...state,
        hasPermissions: action.payload
      };
      
    case actionTypes.SET_DISCOVERING:
      return {
        ...state,
        isDiscovering: action.payload
      };
      
    case actionTypes.SET_AVAILABLE_DEVICES:
      return {
        ...state,
        availableDevices: action.payload
      };
      
    case actionTypes.SET_KNOWN_DEVICES:
      return {
        ...state,
        knownDevices: action.payload
      };
      
    case actionTypes.SET_CONNECTION_STATUS:
      return {
        ...state,
        isConnected: action.payload.isConnected,
        connectedDevice: action.payload.device
      };
      
    case actionTypes.SET_MESSAGES:
      return {
        ...state,
        messages: action.payload
      };
      
    case actionTypes.ADD_MESSAGE:
      return {
        ...state,
        messages: [...state.messages, action.payload]
      };
      
    case actionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
      
    case actionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
      
    case actionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
      
    default:
      return state;
  }
}

// Contexto
const BluetoothContext = createContext();

// Provider
export function BluetoothProvider({ children }) {
  const [state, dispatch] = useReducer(bluetoothReducer, initialState);

  // Inicializar serviços
  useEffect(() => {
    initializeServices();
  }, []);

  // Configurar listeners
  useEffect(() => {
    // Listener para mensagens
    const handleMessage = (message) => {
      dispatch({ type: actionTypes.ADD_MESSAGE, payload: message });
      
      // Salvar mensagem no armazenamento
      if (state.connectedDevice) {
        StorageService.saveMessage(state.connectedDevice.id, message);
      }
    };

    // Listener para conexão
    const handleConnection = (isConnected, device) => {
      dispatch({ 
        type: actionTypes.SET_CONNECTION_STATUS, 
        payload: { isConnected, device } 
      });
      
      if (isConnected && device) {
        // Carregar mensagens do dispositivo conectado
        loadMessages(device.id);
        
        // Salvar dispositivo como conhecido
        StorageService.saveKnownDevice(device);
        loadKnownDevices();
      }
    };

    BluetoothService.addMessageListener(handleMessage);
    BluetoothService.addConnectionListener(handleConnection);

    return () => {
      BluetoothService.removeMessageListener(handleMessage);
      BluetoothService.removeConnectionListener(handleConnection);
    };
  }, [state.connectedDevice]);

  // Inicializar serviços
  const initializeServices = async () => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      
      // Verificar permissões
      const hasPermissions = await BluetoothService.requestPermissions();
      dispatch({ type: actionTypes.SET_PERMISSIONS, payload: hasPermissions });
      
      // Verificar status do Bluetooth
      const isEnabled = await BluetoothService.isBluetoothEnabled();
      dispatch({ type: actionTypes.SET_BLUETOOTH_STATUS, payload: isEnabled });
      
      // Carregar dispositivos conhecidos
      await loadKnownDevices();
      
      // Inicializar serviços de segundo plano e notificações
      console.log('Inicializando serviços de segundo plano...');
      
      // Solicitar permissões de notificação
      await NotificationService.requestPermissions();
      
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    }
  };

  // Carregar dispositivos conhecidos
  const loadKnownDevices = async () => {
    try {
      const devices = await StorageService.getKnownDevices();
      dispatch({ type: actionTypes.SET_KNOWN_DEVICES, payload: devices });
    } catch (error) {
      console.error('Erro ao carregar dispositivos conhecidos:', error);
    }
  };

  // Carregar mensagens
  const loadMessages = async (deviceId) => {
    try {
      const messages = await StorageService.getMessages(deviceId);
      dispatch({ type: actionTypes.SET_MESSAGES, payload: messages });
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  // Descobrir dispositivos
  const discoverDevices = async () => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      dispatch({ type: actionTypes.SET_DISCOVERING, payload: true });
      
      const devices = await BluetoothService.discoverDevices();
      dispatch({ type: actionTypes.SET_AVAILABLE_DEVICES, payload: devices });
      
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      dispatch({ type: actionTypes.SET_DISCOVERING, payload: false });
    }
  };

  // Parar descoberta
  const stopDiscovery = async () => {
    try {
      await BluetoothService.stopDiscovery();
      dispatch({ type: actionTypes.SET_DISCOVERING, payload: false });
    } catch (error) {
      console.error('Erro ao parar descoberta:', error);
    }
  };

  // Conectar a dispositivo
  const connectToDevice = async (device) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      
      const success = await BluetoothService.connectToDevice(device);
      
      if (success) {
        // O listener de conexão irá atualizar o estado
        dispatch({ type: actionTypes.CLEAR_ERROR });
      } else {
        throw new Error('Falha ao conectar ao dispositivo');
      }
      
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    }
  };

  // Desconectar
  const disconnect = async () => {
    try {
      await BluetoothService.disconnect();
      dispatch({ type: actionTypes.SET_MESSAGES, payload: [] });
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
  };

  // Enviar mensagem
  const sendMessage = async (text) => {
    try {
      if (!state.isConnected || !state.connectedDevice) {
        throw new Error('Nenhum dispositivo conectado');
      }

      const success = await BluetoothService.sendMessage(text);
      
      if (success) {
        const message = {
          text,
          timestamp: new Date().toISOString(),
          sender: 'me'
        };
        
        dispatch({ type: actionTypes.ADD_MESSAGE, payload: message });
        
        // Salvar mensagem
        await StorageService.saveMessage(state.connectedDevice.id, message);
      } else {
        throw new Error('Falha ao enviar mensagem');
      }
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  // Limpar erro
  const clearError = () => {
    dispatch({ type: actionTypes.CLEAR_ERROR });
  };

  // Habilitar Bluetooth
  const enableBluetooth = async () => {
    try {
      const enabled = await BluetoothService.enableBluetooth();
      dispatch({ type: actionTypes.SET_BLUETOOTH_STATUS, payload: enabled });
      return enabled;
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      return false;
    }
  };

  const value = {
    // Estado
    ...state,
    
    // Ações
    discoverDevices,
    stopDiscovery,
    connectToDevice,
    disconnect,
    sendMessage,
    clearError,
    enableBluetooth,
    loadMessages,
    loadKnownDevices
  };

  return (
    <BluetoothContext.Provider value={value}>
      {children}
    </BluetoothContext.Provider>
  );
}

// Hook personalizado
export function useBluetooth() {
  const context = useContext(BluetoothContext);
  if (!context) {
    throw new Error('useBluetooth deve ser usado dentro de BluetoothProvider');
  }
  return context;
}

export default BluetoothContext;

