import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  Switch
} from 'react-native';
import { useBluetooth } from '../context/BluetoothContext';
import StorageService from '../services/StorageService';

const SettingsScreen = ({ navigation }) => {
  const { knownDevices, loadKnownDevices } = useBluetooth();
  const [isExporting, setIsExporting] = useState(false);
  const [autoConnect, setAutoConnect] = useState(false);
  const [keepScreenOn, setKeepScreenOn] = useState(false);

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const exportData = await StorageService.exportData();
      
      // Em um app real, você salvaria isso em um arquivo ou compartilharia
      Alert.alert(
        'Dados Exportados',
        `Dados de ${exportData.devices.length} dispositivos e suas conversas foram preparados para exportação.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Aqui você poderia implementar compartilhamento de arquivo
              console.log('Dados exportados:', JSON.stringify(exportData, null, 2));
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Erro', 'Falha ao exportar dados');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Limpar Todos os Dados',
      'Esta ação irá excluir permanentemente todas as conversas e dispositivos conhecidos. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir Tudo',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.clearAllData();
              await loadKnownDevices();
              Alert.alert('Sucesso', 'Todos os dados foram excluídos');
            } catch (error) {
              Alert.alert('Erro', 'Falha ao excluir dados');
            }
          }
        }
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'Sobre o App',
      'Bluetooth Chat App\n\nVersão: 1.0.0\n\nUm aplicativo de mensagens via Bluetooth que permite comunicação ponto a ponto sem internet.\n\nDesenvolvido com React Native.',
      [{ text: 'OK' }]
    );
  };

  const renderSettingItem = (title, subtitle, onPress, rightComponent) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent && <View style={styles.settingAction}>{rightComponent}</View>}
    </TouchableOpacity>
  );

  const renderSection = (title, children) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
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
        
        <Text style={styles.headerTitle}>Configurações</Text>
        
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {renderSection('Dados', (
          <View>
            {renderSettingItem(
              'Exportar Dados',
              'Salvar conversas e dispositivos conhecidos',
              handleExportData,
              isExporting && <Text style={styles.loadingText}>Exportando...</Text>
            )}
            
            {renderSettingItem(
              'Histórico de Conversas',
              `${knownDevices.length} dispositivos conhecidos`,
              () => navigation.navigate('ConversationHistory')
            )}
            
            {renderSettingItem(
              'Limpar Todos os Dados',
              'Excluir permanentemente todas as conversas',
              handleClearAllData,
              <Text style={styles.dangerText}>Excluir</Text>
            )}
          </View>
        ))}

        {renderSection('Conexão', (
          <View>
            {renderSettingItem(
              'Conexão Automática',
              'Conectar automaticamente ao último dispositivo',
              () => setAutoConnect(!autoConnect),
              <Switch
                value={autoConnect}
                onValueChange={setAutoConnect}
                trackColor={{ false: '#ccc', true: '#007AFF' }}
                thumbColor={autoConnect ? '#fff' : '#f4f3f4'}
              />
            )}
            
            {renderSettingItem(
              'Manter Tela Ligada',
              'Evitar que a tela desligue durante conversas',
              () => setKeepScreenOn(!keepScreenOn),
              <Switch
                value={keepScreenOn}
                onValueChange={setKeepScreenOn}
                trackColor={{ false: '#ccc', true: '#007AFF' }}
                thumbColor={keepScreenOn ? '#fff' : '#f4f3f4'}
              />
            )}
          </View>
        ))}

        {renderSection('Informações', (
          <View>
            {renderSettingItem(
              'Sobre o App',
              'Versão e informações do desenvolvedor',
              handleAbout
            )}
            
            {renderSettingItem(
              'Ajuda',
              'Como usar o aplicativo',
              () => {
                Alert.alert(
                  'Ajuda',
                  '1. Certifique-se de que o Bluetooth está habilitado\n\n2. Toque em "Buscar Dispositivos" para encontrar outros dispositivos\n\n3. Toque em um dispositivo para conectar\n\n4. Comece a conversar!\n\nDica: Mantenha os dispositivos próximos para melhor conexão.',
                  [{ text: 'OK' }]
                );
              }
            )}
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Bluetooth Chat App v1.0.0
          </Text>
          <Text style={styles.footerSubtext}>
            Comunicação ponto a ponto sem internet
          </Text>
        </View>
      </ScrollView>
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
  placeholder: {
    width: 34
  },
  content: {
    flex: 1,
    paddingHorizontal: 20
  },
  section: {
    marginTop: 30
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  settingItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  settingInfo: {
    flex: 1
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666'
  },
  settingAction: {
    marginLeft: 12
  },
  loadingText: {
    fontSize: 14,
    color: '#007AFF'
  },
  dangerText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500'
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingBottom: 60
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  footerSubtext: {
    fontSize: 14,
    color: '#666'
  }
});

export default SettingsScreen;

