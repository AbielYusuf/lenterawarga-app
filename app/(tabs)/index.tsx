"use client";
import React, { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Platform,
  StatusBar,
  Animated,
  Image, // 🌟 TAMBAHAN: Import Image untuk merender foto profil
} from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { getToken } from "../../utils/storage";

// ============================================================
// TYPES
// ============================================================
interface Laporan {
  id: number;
  user_id: number;
  category_id: number;
  title: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  created_at?: string;
}

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

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

// 🌟 TAMBAHAN: Helper url statis untuk memanggil gambar avatar kamu dari folder BE
const getAbsoluteAvatarUrl = (imagePath?: string) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  const baseUrl = API_URL.replace("/api", "");
  return `${baseUrl}/src/uploads/${imagePath}`;
};

// Status label & color map
const STATUS_CONFIG: Record<
  string,
  { label: string; dotColor: string; textColor: string; bg: string }
> = {
  approved: {
    label: "Selesai",
    dotColor: "#10b981",
    textColor: "#059669",
    bg: "#d1fae5",
  },
  pending: {
    label: "Proses",
    dotColor: "#f59e0b",
    textColor: "#d97706",
    bg: "#fffbeb",
  },
  rejected: {
    label: "Ditolak",
    dotColor: "#ef4444",
    textColor: "#dc2626",
    bg: "#fee2e2",
  },
};

const getStatusConfig = (status?: string) =>
  STATUS_CONFIG[status ?? "pending"] ?? STATUS_CONFIG.pending;

// ============================================================
// MAIN SCREEN
// ============================================================
export default function ListLaporanScreen() {
  const router = useRouter();
  const [isReady, setIsReady] = useState<boolean>(false);
  const [laporanList, setLaporanList] = useState<Laporan[]>([]);
  const [namaUser, setNamaUser] = useState<string>("warga");
  const [avatarUser, setAvatarUser] = useState<string>(""); // 🌟 TAMBAHAN: State penampung nama file avatar
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [filterActive, setFilterActive] = useState<string>("all");

  // ──────────────────────────────────────────
  // FETCH
  // ──────────────────────────────────────────
  const fetchLaporanData = async () => {
    try {
      const token = await getToken();
      if (!token) {
        router.replace("/login" as any);
        return;
      }
      const res = await fetch(`${API_URL}/laporan`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setLaporanList(Array.isArray(data) ? data : data.data ?? []);
      }
    } catch (error) {
      console.error("❌ Fetch Error:", error);
    } finally {
      setIsReady(true);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const getSavedName = async () => {
      try {
        const savedName = await AsyncStorage.getItem("user_name");
        const savedAvatar = await AsyncStorage.getItem("user_avatar"); // 🌟 TAMBAHAN: Baca cache avatar
        
        if (savedName) setNamaUser(savedName);
        if (savedAvatar) setAvatarUser(savedAvatar); // 🌟 TAMBAHAN: Masukkan ke state
      } catch (e) {
        console.error("Gagal mengambil nama:", e);
      }
    };
    getSavedName();
    fetchLaporanData();
  }, []);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchLaporanData();
  }, []);

  // ──────────────────────────────────────────
  // FILTER
  // ──────────────────────────────────────────
  const filteredData = laporanList.filter((item) => {
    if (filterActive === "all") return true;
    if (filterActive === "proses") return item.status === "pending" || !item.status;
    if (filterActive === "selesai") return item.status === "approved";
    if (filterActive === "ditolak") return item.status === "rejected";
    return true;
  });

  const totalSelesai = laporanList.filter((l) => l.status === "approved").length;
  const totalProses = laporanList.filter((l) => l.status === "pending" || !l.status).length;

  // URL Absolut foto profile
  const avatarUri = getAbsoluteAvatarUrl(avatarUser);

  // ──────────────────────────────────────────
  // LOADING
  // ──────────────────────────────────────────
  if (!isReady) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f0fdf4" }}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={{ marginTop: 10, color: "#6ee7b7", fontSize: 12, fontWeight: "600" }}>
          Memuat data...
        </Text>
      </View>
    );
  }

  const featuredReport = filteredData[0];
  const remainingReports = filteredData.slice(1);

  // ──────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: "#f0fdf4" }}>
      <StatusBar barStyle="light-content" backgroundColor="#065f46" />

      {/* ── HEADER ─────────────────────────── */}
      <View
        style={{
          backgroundColor: "#047857",
          paddingTop: 52,
          paddingHorizontal: 20,
          paddingBottom: 28,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <View
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 130,
            height: 130,
            borderRadius: 65,
            backgroundColor: "rgba(255,255,255,0.07)",
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: -20,
            right: 30,
            width: 70,
            height: 70,
            borderRadius: 35,
            backgroundColor: "rgba(255,255,255,0.05)",
          }}
        />

        {/* Top Row */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: "800", color: "#fff" }}>
              Halo,{" "}
              <Text style={{ color: "#a7f3d0" }}>{namaUser}</Text> 
            </Text>
            <Text style={{ fontSize: 11, color: "#6ee7b7", fontWeight: "500", marginTop: 2 }}>
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
          </View>

          {/* 🌟 DISESUAIKAN: Avatar pojok kanan atas sekarang bisa dipencet ke profile & me-load foto */}
          <TouchableOpacity
            onPress={() => router.push("/profile" as any)}
            activeOpacity={0.8}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: "rgba(255,255,255,0.18)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              borderColor: "rgba(255,255,255,0.3)",
              overflow: "hidden"
            }}
          >
            {avatarUri ? (
              <Image 
                source={{ uri: avatarUri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: "800", color: "#fff" }}>
                {namaUser.charAt(0).toUpperCase()}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          {[
            { label: "Total Aduan", value: laporanList.length, highlight: false },
            { label: "Diproses", value: totalProses, highlight: true },
            { label: "Selesai", value: totalSelesai, highlight: false },
          ].map((stat) => (
            <View
              key={stat.label}
              style={{
                flex: 1,
                backgroundColor: "rgba(255,255,255,0.13)",
                borderRadius: 12,
                padding: 10,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.18)",
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  color: stat.highlight ? "#fcd34d" : "#a7f3d0",
                  fontWeight: "700",
                  marginBottom: 2,
                }}
              >
                {stat.label}
              </Text>
              <Text style={{ fontSize: 24, fontWeight: "800", color: "#fff" }}>
                {stat.value}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── BODY ───────────────────────────── */}
      <FlatList
        data={remainingReports}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#059669"
            colors={["#059669"]}
          />
        }
        ListHeaderComponent={() => (
          <View>
            {/* NEW REPORT BUTTON */}
            <TouchableOpacity
              onPress={() => router.push("/reports/createReport" as any)}
              activeOpacity={0.85}
              style={{
                backgroundColor: "#059669",
                borderRadius: 14,
                paddingVertical: 14,
                marginTop: 16,
                marginBottom: 18,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                shadowColor: "#059669",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <Text style={{ fontSize: 18, color: "#fff" }}>+</Text>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: "800",
                  letterSpacing: 0.8,
                }}
              >
                BUAT LAPORAN BARU
              </Text>
            </TouchableOpacity>

            {/* FILTER PILLS */}
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                marginBottom: 20,
              }}
            >
              {[
                { id: "all", label: "Semua" },
                { id: "proses", label: "Diproses" },
                { id: "selesai", label: "Selesai" },
                { id: "ditolak", label: "Ditolak" },
              ].map((pill) => {
                const active = filterActive === pill.id;
                return (
                  <TouchableOpacity
                    key={pill.id}
                    onPress={() => setFilterActive(pill.id)}
                    activeOpacity={0.75}
                    style={{
                      backgroundColor: active ? "#059669" : "#fff",
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 20,
                      borderWidth: 1.5,
                      borderColor: active ? "#059669" : "#a7f3d0",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: active ? "#fff" : "#047857",
                      }}
                    >
                      {pill.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* FEATURED CARD */}
            <View style={{ marginBottom: 20 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "800",
                    color: "#047857",
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                  }}
                >
                  Sorotan Terbaru
                </Text>
                <Text style={{ fontSize: 11, color: "#6ee7b7", fontWeight: "600" }}>
                  Lihat Semua →
                </Text>
              </View>

              {featuredReport ? (
                <TouchableOpacity
                  onPress={() => router.push(`/reports/${featuredReport.id}` as any)}
                  activeOpacity={0.88}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 18,
                    padding: 18,
                    borderWidth: 1.5,
                    borderColor: "#d1fae5",
                    flexDirection: "row",
                    shadowColor: "#059669",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                    elevation: 3,
                    overflow: "hidden",
                  }}
                >
                  {/* Green accent stripe */}
                  <View
                    style={{
                      width: 4,
                      borderRadius: 4,
                      backgroundColor: "#059669",
                      marginRight: 14,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor:
                            getStatusConfig(featuredReport.status).bg,
                          paddingHorizontal: 10,
                          paddingVertical: 3,
                          borderRadius: 20,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 9,
                            fontWeight: "800",
                            color: getStatusConfig(featuredReport.status).textColor,
                            letterSpacing: 0.8,
                            textTransform: "uppercase",
                          }}
                        >
                          {getStatusConfig(featuredReport.status).label}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 10, color: "#a7f3d0", fontWeight: "600" }}>
                        #{featuredReport.id}
                      </Text>
                    </View>

                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "800",
                        color: "#064e3b",
                        marginBottom: 5,
                        lineHeight: 21,
                      }}
                    >
                      {featuredReport.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#6b7280",
                        lineHeight: 18,
                        marginBottom: 12,
                      }}
                      numberOfLines={2}
                    >
                      {featuredReport.description}
                    </Text>

                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderTopWidth: 1,
                        borderTopColor: "#f0fdf4",
                        paddingTop: 10,
                      }}
                    >
                      <Text style={{ fontSize: 10, color: "#9ca3af", fontWeight: "500" }}>
                        📅 {formatDate(featuredReport.created_at)}
                      </Text>
                      <Text style={{ fontSize: 10, fontWeight: "800", color: "#059669" }}>
                        Periksa Progres →
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ) : (
                <View
                  style={{
                    backgroundColor: "#f0fdf4",
                    borderRadius: 18,
                    padding: 28,
                    alignItems: "center",
                    borderWidth: 1.5,
                    borderColor: "#a7f3d0",
                    borderStyle: "dashed",
                  }}
                >
                  <Text style={{ fontSize: 28, marginBottom: 8 }}>📋</Text>
                  <Text style={{ fontSize: 13, color: "#6ee7b7", fontWeight: "600" }}>
                    Belum ada laporan aktif
                  </Text>
                </View>
              )}
            </View>

            {remainingReports.length > 0 && (
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "800",
                  color: "#047857",
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Daftar Aduan Wilayah
              </Text>
            )}
          </View>
        )}
        // ── FEED ITEM ──────────────────────
        renderItem={({ item }) => {
          const cfg = getStatusConfig(item.status);
          return (
            <TouchableOpacity
              onPress={() => router.push(`/reports/${item.id}` as any)}
              activeOpacity={0.85}
              style={{
                backgroundColor: "#fff",
                borderRadius: 14,
                padding: 14,
                marginBottom: 10,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderWidth: 1,
                borderColor: "#ecfdf5",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
              }}
            >
              {/* Text */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: "#064e3b",
                  }}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text
                  style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}
                  numberOfLines={1}
                >
                  {item.description}
                </Text>
              </View>

              {/* Status */}
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 5, marginLeft: 10 }}
              >
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: cfg.dotColor,
                  }}
                />
                <Text
                  style={{ fontSize: 10, fontWeight: "700", color: cfg.textColor }}
                >
                  {cfg.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={() =>
          isReady ? (
            <View style={{ paddingTop: 40, alignItems: "center" }}>
              <Text style={{ fontSize: 40, marginBottom: 10 }}>🔍</Text>
              <Text style={{ fontSize: 13, color: "#6ee7b7", fontWeight: "600" }}>
                Tidak ada laporan ditemukan
              </Text>
            </View>
          ) : null
        }
      />
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