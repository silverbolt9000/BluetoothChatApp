import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { useBluetooth } from '../context/BluetoothContext';

const DeviceDiscoveryScreen = ({ navigation }) => {
  const {
    availableDevices,
    knownDevices,
    isDiscovering,
    isLoading,
    error,
    hasPermissions,
    isBluetoothEnabled,
    discoverDevices,
    stopDiscovery,
    connectToDevice,
    enableBluetooth,
    clearError
  } = useBluetooth();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (error) {
      Alert.alert('Erro', error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [error]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await handleDiscoverDevices();
    setRefreshing(false);
  };

  const handleDiscoverDevices = async () => {
    if (!hasPermissions) {
      Alert.alert(
        'Permissões Necessárias',
        'Este aplicativo precisa de permissões de Bluetooth e localização para funcionar.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!isBluetoothEnabled) {
      Alert.alert(
        'Bluetooth Desabilitado',
        'Por favor, habilite o Bluetooth para continuar.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Habilitar', onPress: enableBluetooth }
        ]
      );
      return;
    }

    await discoverDevices();
  };

  const handleConnectToDevice = async (device) => {
    Alert.alert(
      'Conectar Dispositivo',
      `Deseja conectar ao dispositivo "${device.name || device.id}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Conectar',
          onPress: async () => {
            try {
              await connectToDevice(device);
              navigation.navigate('Chat', { device });
            } catch (error) {
              Alert.alert('Erro', 'Falha ao conectar ao dispositivo');
            }
          }
        }
      ]
    );
  };

  const renderDeviceItem = ({ item, section }) => (
    <TouchableOpacity
      style={[
        styles.deviceItem,
        section === 'known' && styles.knownDeviceItem
      ]}
      onPress={() => handleConnectToDevice(item)}
    >
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>
          {item.name || 'Dispositivo Desconhecido'}
        </Text>
        <Text style={styles.deviceId}>{item.id}</Text>
        {section === 'known' && (
          <Text style={styles.deviceStatus}>Dispositivo Conhecido</Text>
        )}
      </View>
      <View style={styles.deviceActions}>
        <View style={[
          styles.statusIndicator,
          item.bonded ? styles.pairedIndicator : styles.unpairedIndicator
        ]} />
        <Text style={styles.connectButton}>Conectar</Text>
      </View>
    </TouchableOpacity>
  );

  const renderKnownDevices = () => {
    if (knownDevices.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dispositivos Conhecidos</Text>
        <FlatList
          data={knownDevices}
          keyExtractor={(item) => `known_${item.id}`}
          renderItem={({ item }) => renderDeviceItem({ item, section: 'known' })}
          scrollEnabled={false}
        />
      </View>
    );
  };

  const renderAvailableDevices = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Dispositivos Disponíveis</Text>
        {isDiscovering && (
          <ActivityIndicator size="small" color="#007AFF" />
        )}
      </View>
      
      {availableDevices.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {isDiscovering 
              ? 'Procurando dispositivos...' 
              : 'Nenhum dispositivo encontrado'
            }
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Certifique-se de que o Bluetooth está habilitado e outros dispositivos estão visíveis
          </Text>
        </View>
      ) : (
        <FlatList
          data={availableDevices}
          keyExtractor={(item) => `available_${item.id}`}
          renderItem={({ item }) => renderDeviceItem({ item, section: 'available' })}
          scrollEnabled={false}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bluetooth Chat</Text>
        <Text style={styles.headerSubtitle}>Encontre dispositivos para conversar</Text>
      </View>

      <FlatList
        style={styles.content}
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={() => (
          <View>
            {renderKnownDevices()}
            {renderAvailableDevices()}
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
          />
        }
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.discoverButton,
            isDiscovering && styles.discoverButtonActive
          ]}
          onPress={isDiscovering ? stopDiscovery : handleDiscoverDevices}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.discoverButtonText}>
              {isDiscovering ? 'Parar Busca' : 'Buscar Dispositivos'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)'
  },
  content: {
    flex: 1,
    paddingHorizontal: 20
  },
  section: {
    marginTop: 20
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  deviceItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5
  },
  knownDeviceItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#34C759'
  },
  deviceInfo: {
    flex: 1
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
    fontFamily: 'monospace'
  },
  deviceStatus: {
    fontSize: 12,
    color: '#34C759',
    marginTop: 4,
    fontWeight: '500'
  },
  deviceActions: {
    alignItems: 'center'
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8
  },
  pairedIndicator: {
    backgroundColor: '#34C759'
  },
  unpairedIndicator: {
    backgroundColor: '#FF9500'
  },
  connectButton: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600'
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center'
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20
  },
  footer: {
    padding: 20,
    paddingBottom: 30
  },
  discoverButton: {
    backgroundColor: '#007AFF',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center'
  },
  discoverButtonActive: {
    backgroundColor: '#FF3B30'
  },
  discoverButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default DeviceDiscoveryScreen;

