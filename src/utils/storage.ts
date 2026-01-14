import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  TRUCO_DATA: '@truco_data',
  CACHETA_DATA: '@cacheta_data',
  FODINHA_DATA: '@fodinha_data',
  SETTINGS: '@settings_data',
};

export const saveData = async (key: string, value: any) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error('Erro ao salvar:', e);
  }
};

export const getData = async (key: string) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Erro ao carregar:', e);
  }
};

export const clearAllData = async () => {
  try {
    await AsyncStorage.clear();
  } catch (e) {
    console.error('Erro ao resetar tudo:', e);
  }
};