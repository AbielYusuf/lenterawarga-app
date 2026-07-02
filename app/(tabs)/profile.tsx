"use client";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
  Image,
  StatusBar,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { removeToken, getToken } from "../../utils/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// ============================================================
// UTILS
// ============================================================
const getBackendIP = (): string => {
  if (Platform.OS === "web") return "http://localhost:5000/api";
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const laptopIP = hostUri.split(":")[0];
    return `http://${laptopIP}:5000/api`;
  }
  return "http://localhost:5000/api";
};

const API_URL = getBackendIP();

const getAbsoluteAvatarUrl = (imagePath?: string) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  const baseUrl = API_URL.replace("/api", "");
  return `${baseUrl}/src/uploads/${imagePath}`;
};

// ============================================================
// ROLE CONFIG
// ============================================================
type RoleKey = "superadmin" | "admin" | "user";

const ROLE_CONFIG: Record<RoleKey, { display: string; badge: string; badgeColor: string; badgeText: string }> = {
  superadmin: {
    display: "Super Administrator / Utama",
    badge: "Super Admin",
    badgeColor: "#7c3aed",
    badgeText: "#ede9fe",
  },
  admin: {
    display: "Petugas / Admin Wilayah",
    badge: "Internal Staff",
    badgeColor: "#dc2626",
    badgeText: "#fee2e2",
  },
  user: {
    display: "Masyarakat / Warga",
    badge: "Warga Resmi",
    badgeColor: "#047857",
    badgeText: "#d1fae5",
  },
};

const getRoleConfig = (role: string) =>
  ROLE_CONFIG[(role.toLowerCase() as RoleKey)] ?? ROLE_CONFIG.user;

// ============================================================
// SUB-COMPONENTS
// ============================================================
function SectionLabel({ label }: { label: string }) {
  return (
    <Text
      style={{
        fontSize: 10,
        fontWeight: "800",
        color: "#047857",
        letterSpacing: 0.8,
        textTransform: "uppercase",
        marginBottom: 10,
        marginTop: 4,
      }}
    >
      {label}
    </Text>
  );
}

interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
  isLast?: boolean;
  valueColor?: string;
  showDot?: boolean;
  dotColor?: string;
}

function InfoRow({ icon, label, value, isLast, valueColor = "#064e3b", showDot, dotColor }: InfoRowProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 13,
        paddingHorizontal: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: "#f0fdf4",
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: "#d1fae5",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon as any} size={17} color="#059669" />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 9,
            fontWeight: "700",
            color: "#a7f3d0",
            textTransform: "uppercase",
            letterSpacing: 0.8,
            marginBottom: 3,
          }}
        >
          {label}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          {showDot && (
            <View
              style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dotColor ?? "#10b981" }}
            />
          )}
          <Text style={{ fontSize: 13, fontWeight: "700", color: valueColor }}>
            {value}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={14} color="#d1fae5" />
    </View>
  );
}

// ============================================================
// MAIN SCREEN
// ============================================================
export default function ProfileScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading]       = useState<boolean>(true);
  const [namaUser, setNamaUser]         = useState<string>("Warga");
  const [roleUser, setRoleUser]         = useState<string>("user");
  const [avatarUser, setAvatarUser]     = useState<string>("");
  const [notifEnabled, setNotifEnabled] = useState<boolean>(true);
  // ──────────────────────────────────────────
  // FETCH PROFILE
  // ──────────────────────────────────────────
  const fetchLiveProfile = async () => {
    try {
      const token  = await getToken();
      const userId = await AsyncStorage.getItem("user_id");

      if (!token) {
        router.replace("/login" as any);
        return;
      }
      if (!userId) {
        setIsLoading(false);
        return;
      }

      const res  = await fetch(`${API_URL}/users/${userId}`, {
        method:  "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (res.ok) {
        setNamaUser(data.name   || "Warga");
        setRoleUser(data.role   || "user");
        setAvatarUser(data.avatar || "");
      }
    } catch (error) {
      console.error("Gagal fetch profil:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLiveProfile(); }, []);

  // ──────────────────────────────────────────
  // LOGOUT
  // ──────────────────────────────────────────
  const prosesLogoutClean = async () => {
    await removeToken();
    await AsyncStorage.clear();
    router.replace("/login" as any);
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Yakin ingin keluar dari LenteraWarga?")) prosesLogoutClean();
      return;
    }
    Alert.alert("Konfirmasi Keluar", "Apakah Anda yakin ingin keluar dari akun?", [
      { text: "Batal", style: "cancel" },
      { text: "Keluar", style: "destructive", onPress: prosesLogoutClean },
    ]);
  };

  // ──────────────────────────────────────────
  // DERIVED STATE
  // ──────────────────────────────────────────
  const avatarInitial = namaUser.charAt(0).toUpperCase();
  const avatarUri     = getAbsoluteAvatarUrl(avatarUser);
  const roleCfg       = getRoleConfig(roleUser);

  // ──────────────────────────────────────────
  // LOADING
  // ──────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f0fdf4" }}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={{ marginTop: 10, color: "#6ee7b7", fontSize: 12, fontWeight: "600" }}>
          Memuat profil...
        </Text>
      </View>
    );
  }

  // ──────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: "#f0fdf4" }}>
      <StatusBar barStyle="light-content" backgroundColor="#065f46" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO HEADER ─────────────────────── */}
        <View
          style={{
            backgroundColor: "#047857",
            paddingTop: 52,
            paddingBottom: 40,
            alignItems: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative circles */}
          <View
            style={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 110,
              height: 110,
              borderRadius: 55,
              backgroundColor: "rgba(255,255,255,0.06)",
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: -20,
              left: -20,
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "rgba(255,255,255,0.05)",
            }}
          />

          {/* Settings button */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              position: "absolute",
              top: 56,
              right: 18,
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: "rgba(255,255,255,0.14)",
              borderWidth: 1.5,
              borderColor: "rgba(255,255,255,0.22)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="settings-outline" size={17} color="#a7f3d0" />
          </TouchableOpacity>

          {/* Avatar */}
          <View style={{ position: "relative", marginBottom: 14 }}>
            <View
              style={{
                width: 90,
                height: 90,
                borderRadius: 45,
                backgroundColor: "#059669",
                borderWidth: 4,
                borderColor: "rgba(255,255,255,0.3)",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={{ width: 90, height: 90, borderRadius: 45 }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={{ fontSize: 34, fontWeight: "800", color: "#fff" }}>
                  {avatarInitial}
                </Text>
              )}
            </View>
            {/* Verified badge */}
            <View
              style={{
                position: "absolute",
                bottom: 2,
                right: 2,
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: "#fff",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: "#059669",
              }}
            >
              <Ionicons name="checkmark" size={11} color="#059669" />
            </View>
          </View>

          {/* Name */}
          <Text style={{ fontSize: 20, fontWeight: "800", color: "#fff", marginBottom: 8 }}>
            {namaUser}
          </Text>

          {/* Role badge */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              backgroundColor: "rgba(255,255,255,0.14)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.22)",
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 5,
            }}
          >
            <Ionicons name="shield-checkmark-outline" size={12} color="#6ee7b7" />
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                color: "#a7f3d0",
                letterSpacing: 0.8,
                textTransform: "uppercase",
              }}
            >
              {roleCfg.badge}
            </Text>
          </View>
        </View>

        {/* Wave */}
        <View style={{ backgroundColor: "#047857", height: 0 }} />

        <View style={{ paddingHorizontal: 18, paddingTop: 16 }}>
          {/* ── INFO AKUN ───────────────────────── */}
          <SectionLabel label="Informasi Akun" />
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#d1fae5",
              overflow: "hidden",
              marginBottom: 14,
            }}
          >
            <InfoRow
              icon="person-outline"
              label="Nama Lengkap"
              value={namaUser}
            />
            <InfoRow
              icon="shield-checkmark-outline"
              label="Hak Akses Sistem"
              value={roleCfg.display}
            />
            <InfoRow
              icon="checkmark-circle-outline"
              label="Status Verifikasi"
              value="Terverifikasi / Aktif"
              isLast
              showDot
              dotColor="#10b981"
            />
          </View>

          {/* ── PENGATURAN ──────────────────────── */}
          <SectionLabel label="Pengaturan" />
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#d1fae5",
              overflow: "hidden",
              marginBottom: 18,
            }}
          >
            {/* Notifikasi with Switch */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingVertical: 13,
                paddingHorizontal: 16,
                borderBottomWidth: 1,
                borderBottomColor: "#f0fdf4",
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: "#eff6ff",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="notifications-outline" size={17} color="#3b82f6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#064e3b" }}>
                  Notifikasi
                </Text>
                <Text style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>
                  Update status laporan aktif
                </Text>
              </View>
              <Switch
                value={notifEnabled}
                onValueChange={setNotifEnabled}
                trackColor={{ false: "#d1d5db", true: "#a7f3d0" }}
                thumbColor={notifEnabled ? "#059669" : "#f3f4f6"}
                ios_backgroundColor="#d1d5db"
              />
            </View>

            {/* Ubah Password */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingVertical: 13,
                paddingHorizontal: 16,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: "#d1fae5",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="lock-closed-outline" size={17} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#064e3b" }}>
                  Ubah Password
                </Text>
                <Text style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>
                  Keamanan akun warga
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="#d1fae5" />
            </TouchableOpacity>
          </View>

          {/* ── LOGOUT ──────────────────────────── */}
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.85}
            style={{
              backgroundColor: "#fff",
              borderRadius: 14,
              paddingVertical: 14,
              paddingHorizontal: 18,
              borderWidth: 1.5,
              borderColor: "#fecaca",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginBottom: 24,
            }}
          >
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                backgroundColor: "#fee2e2",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="log-out-outline" size={16} color="#ef4444" />
            </View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "800",
                color: "#dc2626",
                letterSpacing: 0.8,
                textTransform: "uppercase",
              }}
            >
              Keluar Sistem Aplikasi
            </Text>
          </TouchableOpacity>

          {/* APP VERSION */}
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#6ee7b7", marginBottom: 2 }}>
              LenteraWarga Mobile App
            </Text>
            <Text style={{ fontSize: 10, color: "#a7f3d0", fontWeight: "500" }}>
              Versi Ujian UKK 1.0.0 • Depok, Indonesia
            </Text>
          </View>
        </View>
      </ScrollView>

            {/* ── BOTTOM NAV ─────────────────────── */}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: "#fff",
                borderTopWidth: 1,
                borderTopColor: "#d1fae5",
                flexDirection: "row",
                paddingBottom: Platform.OS === "ios" ? 24 : 10,
                paddingTop: 10,
              }}
            >
              {[
                { icon: "🏠", label: "Beranda", active: true },
                { icon: "👤", label: "Profil", active: false },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.label}
                  activeOpacity={0.7}
                  // 🌟 DISESUAIKAN: Menghidupkan tombol pindah halaman saat tab dipencet
                  onPress={() => {
                    if (tab.label === "Profil") {
                      router.push("/profile" as any);
                    } else if (tab.label === "Beranda") {
                      router.push("/" as any);
                    }
                  }}
                  style={{ flex: 1, alignItems: "center", gap: 3 }}
                >
                  {/* 🌟 DISESUAIKAN: Jika tombol Profil ditekan dan avatar ada di database, ubah emoji jadi foto profil bulat mini */}
                  {tab.label === "Profil" && avatarUri ? (
                    <Image 
                      source={{ uri: avatarUri }}
                      style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: "#059669" }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={{ fontSize: 20 }}>{tab.icon}</Text>
                  )}
                  
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: tab.active ? "700" : "600",
                      color: tab.active ? "#059669" : "#9ca3af",
                    }}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
    </View>
  );
}