import AsyncStorage from '@react-native-async-storage/async-storage';

// Menyimpan token saat berhasil login
export const storeToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('@user_token', token);
  } catch (e) {
    console.error('Gagal menyimpan token di device:', e);
  }
};

// Mengambil token untuk otorisasi header API
export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('@user_token');
  } catch (e) {
    console.error('Gagal mengambil token dari device:', e);
    return null;
  }
};

// Menghapus token saat user klik logout
export const removeToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('@user_token');
  } catch (e) {
    console.error('Gagal menghapus token sesi:', e);
  }
};