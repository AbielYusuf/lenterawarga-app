"use client";
import React, { useState } from "react";
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
import Constants from "expo-constants";

const getBackendIP = (): string => {
  if (Platform.OS === "web") {
    return "http://localhost:5000/api";
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const laptopIP = hostUri.split(":")[0];
    return `http://${laptopIP}:5000/api`;
  }
  
  return process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";
};

const API_URL = getBackendIP();

export default function RegisterScreen() {
  const router = useRouter();
  
  // 💡 State Input Form (Sekarang sudah ditambah username)
  const [name, setName] = useState<string>("");
  const [username, setUsername] = useState<string>(""); // 🌟 State baru
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

const handleRegister = async () => {
    // 1. Validasi Input Kosong
    if (!name || !username || !email || !password || !confirmPassword) {
      if (Platform.OS === "web") {
        window.alert("Verifikasi Input: Semua kolom pendaftaran wajib diisi!");
      } else {
        Alert.alert("Verifikasi Input", "Semua kolom pendaftaran wajib diisi!");
      }
      return;
    }

    if (password !== confirmPassword) {
      if (Platform.OS === "web") {
        window.alert("Verifikasi Input: Konfirmasi kata sandi tidak cocok!");
      } else {
        Alert.alert("Verifikasi Input", "Konfirmasi kata sandi tidak cocok! Periksa kembali.");
      }
      return;
    }

    if (password.length < 6) {
      if (Platform.OS === "web") {
        window.alert("Verifikasi Input: Kata sandi minimal harus 6 karakter.");
      } else {
        Alert.alert("Verifikasi Input", "Kata sandi minimal harus 6 karakter.");
      }
      return;
    }

    try {
      setIsLoading(true);
      console.log(`📡 Menembak Register API ke alamat: ${API_URL}/auth/register`);

      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          username, 
          email, 
          password,
          role: "user" 
        })
      });

      const data = await res.json();

      if (res.ok) {
        // 🌐 JIKA SEDANG TESTING DI WEB BROWSER
        if (Platform.OS === "web") {
          window.alert("Pendaftaran Sukses! 🎉\n\nAkun warga Anda berhasil dibuat. Silakan masuk menggunakan email dan sandi tersebut.");
          router.replace("/login" as any);
          return;
        }

        // 📱 JIKA SEDANG TESTING DI HP / EMULATOR NATIVE
        Alert.alert(
          "Pendaftaran Sukses! 🎉", 
          "Akun warga Anda berhasil dibuat. Silakan masuk menggunakan email dan sandi tersebut.",
          [{ text: "Masuk Sekarang", onPress: () => router.replace("/login" as any) }]
        );
      } else {
        if (Platform.OS === "web") {
          window.alert(`Pendaftaran Gagal: ${data.message || "Gagal membuat akun baru."}`);
        } else {
          Alert.alert("Pendaftaran Gagal", data.message || "Gagal membuat akun baru.");
        }
      }
    } catch (error) {
      console.error("Register network error:", error);
      if (Platform.OS === "web") {
        window.alert("Masalah Koneksi: Gagal menghubungi server backend.");
      } else {
        Alert.alert("Masalah Koneksi", "Gagal menghubungi server backend.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        
        {/* HEADER HERO */}
        <View className="w-full h-[22%] relative bg-slate-900 justify-end">
          <Image 
            source={require("../assets/images/gotongroyongsmph.jpg")} 
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
          <View className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90" />
          
          <View className="p-6 space-y-0.5 z-10">
            <Text className="text-xl font-black text-white tracking-tight">
              Bergabung Bersama <Text className="text-[#10B981]">Kami</Text>
            </Text>
            <Text className="text-[11px] text-slate-300 font-medium">
              Buat akun warga untuk mulai mengawal pembangunan daerah.
            </Text>
          </View>
        </View>

        {/* FORM CONTENT AREA */}
        <View className="flex-1 bg-white px-6 pt-5 pb-6 justify-between">
          <View className="space-y-4">
            
            {/* INPUT: NAMA LENGKAP */}
            <View className="space-y-1">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap</Text>
              <TextInput
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#10B981] text-slate-800 rounded-xl px-4 py-2.5 text-sm transition-all"
                placeholder="Contoh: Ahmad Subardjo"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* 🌟 INPUT BARU: USERNAME */}
            <View className="space-y-1">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Pengguna (Username)</Text>
              <TextInput
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#10B981] text-slate-800 rounded-xl px-4 py-2.5 text-sm transition-all"
                placeholder="Contoh: ahmad_subardjo"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />
            </View>

            {/* INPUT: EMAIL */}
            <View className="space-y-1">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alamat Email Resmi</Text>
              <TextInput
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#10B981] text-slate-800 rounded-xl px-4 py-2.5 text-sm transition-all"
                placeholder="warga@email.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* INPUT: KATA SANDI */}
            <View className="space-y-1">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kata Sandi Baru</Text>
              <TextInput
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#10B981] text-slate-800 rounded-xl px-4 py-2.5 text-sm transition-all"
                placeholder="Minimal 6 karakter..."
                placeholderTextColor="#94A3B8"
                secureTextEntry
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* INPUT: KONFIRMASI KATA SANDI */}
            <View className="space-y-1">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ulangi Kata Sandi</Text>
              <TextInput
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#10B981] text-slate-800 rounded-xl px-4 py-2.5 text-sm transition-all"
                placeholder="Masukkan kembali kata sandi..."
                placeholderTextColor="#94A3B8"
                secureTextEntry
                autoCapitalize="none"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            {/* ACTION BUTTON REGISTER */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isLoading}
              className="w-full bg-[#10B981] active:bg-emerald-600 py-3 rounded-xl items-center justify-center mt-2 shadow-sm shadow-emerald-500/10"
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-white text-xs font-black uppercase tracking-wider">Daftar Akun Baru</Text>
              )}
            </TouchableOpacity>

          </View>

          {/* FOOTER */}
          <View className="pt-5 border-t border-slate-100 flex-row justify-center items-center gap-1.5">
            <Text className="text-xs text-slate-400 font-medium">Sudah memiliki akun?</Text>
            <TouchableOpacity onPress={() => router.replace("/login" as any)}>
              <Text className="text-xs text-[#10B981] font-black hover:underline">Masuk di sini</Text>
            </TouchableOpacity>
          </View>

        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}