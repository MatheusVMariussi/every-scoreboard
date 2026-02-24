import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { translate } from '../i18n';

export const STORAGE_KEYS = {
  TRUCO_DATA: '@truco_data',
  CACHETA_DATA: '@cacheta_data',
  FODINHA_DATA: '@fodinha_data',
  SETTINGS: '@settings_data',
  TUTORIAL_TRUCO: '@tutorial_truco',
  TUTORIAL_CACHETA: '@tutorial_cacheta',
  TUTORIAL_FODINHA: '@tutorial_fodinha',
};

export const saveData = async (key: string, value: unknown) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error('Erro ao salvar:', e);
    Alert.alert(translate('common.storage_error_title'), translate('common.storage_save_error'));
  }
};

export const getData = async (key: string): Promise<unknown> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue == null ? null : (JSON.parse(jsonValue) as unknown);
  } catch (e) {
    console.error('Erro ao carregar:', e);
    Alert.alert(translate('common.storage_error_title'), translate('common.storage_load_error'));
    return null;
  }
};

export const clearAllData = async () => {
  try {
    await AsyncStorage.clear();
  } catch (e) {
    console.error('Erro ao resetar tudo:', e);
    Alert.alert(translate('common.storage_error_title'), translate('common.storage_clear_error'));
  }
};
