"use client";
import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants"; // 💡 1. Import Constants untuk deteksi IP otomatis
import { getToken, storeToken } from "../utils/storage"; 

// ====================================================================
// 👑 TRICK INOVASI: Deteksi IP Laptop secara Otomatis via Expo Connection
// ====================================================================
const getBackendIP = (): string => {
  // 👑 JIKA SEDANG TESTING DI WEB BROWSER, LANGSUNG TEMBAK LOCALHOST
  if (Platform.OS === "web") {
    return "http://localhost:5000/api";
  }

  // Jika sedang testing di HP / Emulator, gunakan trik sedot IP otomatis kemarin
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const laptopIP = hostUri.split(":")[0];
    return `http://${laptopIP}:5000/api`;
  }
  
  return "http://localhost:5000/api";
};

const API_URL = getBackendIP();

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);

  // ==========================================
  // 🛡️ AUTOMATIC SESSION BYPASS (ASYNC STORAGE)
  // ==========================================
  useEffect(() => {
    const checkExistingToken = async () => {
      try {
        const token = await getToken();
        if (token) {
          // Jika token terdeteksi, lompati halaman login, langsung lempar ke list aduan utama
          router.replace("/");
        }
      } catch (error) {
        console.error("Gagal membaca sesi awal:", error);
      } finally {
        setIsCheckingSession(false);
      }
    };
    checkExistingToken();
  }, []);

  // ==========================================
  // 🔥 HANDLER LOGIN API AUTHENTICATION
  // ==========================================
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Verifikasi Input", "Mohon isi alamat email dan kata sandi Anda!");
      return;
    }

    try {
      setIsLoading(true);
      
      // Console log ini berguna saat pengujian/debug di terminal Expo untuk memastikan tujuan IP beneran berubah otomatis
      console.log(`📡 Menembak Auth API ke alamat: ${API_URL}/auth/login`);

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

        if (res.ok) {
          const token = data.token || data.accessToken;
          await storeToken(token);
  
          const userId = data.user?.id || "";
          await AsyncStorage.setItem("user_id", String(userId));

          const namaWarga = data.user?.name || "Warga";
          const roleUser = data.user?.role || "user";
          
          await AsyncStorage.setItem("user_name", namaWarga);
          await AsyncStorage.setItem("user_role", roleUser);
          
          router.replace("/");
          
      } else {
        Alert.alert("Otorisasi Gagal", data.message || "Email atau kata sandi salah.");
      }
    } catch (error) {
      console.error("Login network error:", error);
      Alert.alert(
        "Masalah Koneksi", 
        "Gagal menghubungi server backend.\n\nPastikan server nodemon backend di laptop Anda sudah menyala dan tersambung ke jaringan Wi-Fi yang sama!"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Tampilkan layar loading kosong sementara ketika aplikasi mengecek status token di Async Storage
  if (isCheckingSession) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="small" color="#10B981" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        
        {/* 📸 HEADER HERO: Sesuai referensi visual mockup pilihanmu */}
        <View className="w-full h-[32%] relative bg-slate-900 justify-end">
          <Image 
            // 📂 Foto gotong royong kebanggaanmu di assets/images/
            source={require("../assets/images/gotongroyongsmph.jpg")} 
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
          {/* Efek gradasi hitam transparan bawah agar teks menyatu elegan */}
          <View className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90" />
          
          <View className="p-6 space-y-1 z-10">
            <Text className="text-2xl font-black text-white tracking-tight">
              Lentera<Text className="text-[#10B981]">Warga</Text>
            </Text>
            <Text className="text-xs text-slate-300 font-medium">
              Sistem Informasi Pengaduan & Aspirasi Masyarakat Digital
            </Text>
          </View>
        </View>

        {/* 📄 FORM CONTENT AREA */}
        <View className="flex-1 bg-white px-6 pt-8 pb-6 justify-between">
          <View className="space-y-6">
            <View>
              <Text className="text-xl font-black text-slate-900 tracking-tight">Masuk Akun</Text>
              <Text className="text-xs text-slate-400 font-medium mt-0.5">Silakan masukkan kredensial terdaftar untuk melapor.</Text>
            </View>

            <View className="space-y-4">
              {/* INPUT: EMAIL */}
              <View className="space-y-1.5">
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alamat Email Resmi</Text>
                <TextInput
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#10B981] text-slate-800 rounded-xl px-4 py-3 text-sm transition-all"
                  placeholder="Masukkan email Anda..."
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              {/* INPUT: PASSWORD */}
              <View className="space-y-1.5">
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kata Sandi</Text>
                <TextInput
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#10B981] text-slate-800 rounded-xl px-4 py-3 text-sm transition-all"
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              {/* ACTION BUTTON LOGIN */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={isLoading}
                className="w-full bg-[#0F172A] active:bg-slate-800 py-3.5 rounded-xl items-center justify-center mt-3 shadow-md shadow-slate-900/10"
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="text-white text-xs font-black uppercase tracking-wider">Masuk Aplikasi</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

        {/* FOOTER INFORMASI DI APP/LOGIN.TSX */}
        <View className="pt-6 border-t border-slate-100 flex-row justify-center items-center gap-1.5">
          <Text className="text-xs text-slate-400 font-medium">Belum memiliki akun warga resmi?</Text>
          <TouchableOpacity onPress={() => router.replace("/register" as any)}>
            <Text className="text-xs text-[#10B981] font-black hover:underline">Daftar Sekarang</Text>
          </TouchableOpacity>
        </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}