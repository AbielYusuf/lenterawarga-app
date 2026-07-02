"use client";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Image,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { getToken } from "../../utils/storage";

// ============================================================
// TYPES
// ============================================================
interface LaporanDetail {
  id: number;
  user_id: number;
  user_name: string;
  category_id: number;
  category_name: string;
  title: string;
  description: string;
  image: string;
  location: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
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

const getAbsoluteImageUrl = (imagePath?: string) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  const baseUrl = API_URL.replace("/api", "");
  return `${baseUrl}/src/uploads/${imagePath}`;
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// Status config map
const STATUS_CONFIG = {
  approved: {
    label: "Selesai",
    color: "#059669",
    dotColor: "#10b981",
    bg: "#d1fae5",
    textColor: "#065f46",
  },
  rejected: {
    label: "Ditolak",
    color: "#dc2626",
    dotColor: "#ef4444",
    bg: "#fee2e2",
    textColor: "#7f1d1d",
  },
  pending: {
    label: "Dalam Antrean",
    color: "#d97706",
    dotColor: "#f59e0b",
    bg: "#fffbeb",
    textColor: "#92400e",
  },
};

const getStatusConfig = (status?: string) =>
  STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;

// ============================================================
// MAIN SCREEN
// ============================================================
export default function DetailLaporanScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [isReady, setIsReady] = useState<boolean>(false);
  const [laporan, setLaporan] = useState<LaporanDetail | null>(null);

  // ──────────────────────────────────────────
  // FETCH
  // ──────────────────────────────────────────
  const fetchDetailData = async () => {
    try {
      const token = await getToken();
      if (!token) {
        router.replace("/login" as any);
        return;
      }
      const res = await fetch(`${API_URL}/laporan/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setLaporan(data.data || data);
      } else {
        if (Platform.OS === "web") window.alert("Laporan tidak ditemukan.");
        else Alert.alert("Error", "Laporan tidak ditemukan.");
        router.back();
      }
    } catch (error) {
      console.error("❌ Fetch Detail Error:", error);
    } finally {
      setIsReady(true);
    }
  };

  useEffect(() => {
    if (id) fetchDetailData();
  }, [id]);

  // ──────────────────────────────────────────
  // DELETE
  // ──────────────────────────────────────────
  const handleDeleteReport = () => {
    const prosesHapus = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/laporan/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          if (Platform.OS === "web") window.alert("Laporan berhasil dihapus.");
          else Alert.alert("Sukses", "Laporan berhasil dihapus.");
          router.replace("/");
        }
      } catch (e) {
        console.error(e);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("Hapus laporan ini secara permanen?")) prosesHapus();
    } else {
      Alert.alert("Hapus Laporan?", "Tindakan ini permanen dan tidak bisa dibatalkan.", [
        { text: "Batal", style: "cancel" },
        { text: "Hapus", style: "destructive", onPress: prosesHapus },
      ]);
    }
  };

  // ──────────────────────────────────────────
  // LOADING
  // ──────────────────────────────────────────
  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f0fdf4",
        }}
      >
        <ActivityIndicator size="large" color="#059669" />
        <Text style={{ marginTop: 10, color: "#6ee7b7", fontSize: 12, fontWeight: "600" }}>
          Memuat detail...
        </Text>
      </View>
    );
  }

  if (!laporan) return null;

  const cfg = getStatusConfig(laporan.status);
  const imageSourceUri = getAbsoluteImageUrl(laporan.image);

  // ──────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: "#f0fdf4" }}>
      <StatusBar barStyle="light-content" backgroundColor="#065f46" />

      {/* ── TOP NAV ─────────────────────────── */}
      <View
        style={{
          backgroundColor: "#047857",
          paddingTop: 52,
          paddingHorizontal: 18,
          paddingBottom: 16,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: "rgba(255,255,255,0.15)",
            borderWidth: 1.5,
            borderColor: "rgba(255,255,255,0.25)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>

        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 13, fontWeight: "800", color: "#fff" }}>
            Detail Kasus Pengaduan
          </Text>
          <Text style={{ fontSize: 10, color: "#6ee7b7", fontWeight: "600" }}>
            #{laporan.id}
          </Text>
        </View>

        {laporan.status === "pending" ? (
          <TouchableOpacity
            onPress={handleDeleteReport}
            activeOpacity={0.8}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: "rgba(239,68,68,0.18)",
              borderWidth: 1.5,
              borderColor: "rgba(239,68,68,0.35)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="trash-outline" size={16} color="#fca5a5" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>

      {/* Wave divider */}
      <View style={{ backgroundColor: "#047857", height: 0 }}>
        <Text style={{ display: "none" }}>{/* wave handled via padding */}</Text>
      </View>

      {/* ── SCROLL BODY ─────────────────────── */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO IMAGE */}
        <View
          style={{
            width: "100%",
            height: 200,
            borderRadius: 18,
            overflow: "hidden",
            borderWidth: 1.5,
            borderColor: "#a7f3d0",
            marginBottom: 16,
            backgroundColor: "#d1fae5",
          }}
        >
          {imageSourceUri ? (
            <Image
              source={{ uri: imageSourceUri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Ionicons name="image-outline" size={32} color="#6ee7b7" />
              <Text style={{ fontSize: 12, color: "#6ee7b7", fontWeight: "600" }}>
                Foto bukti tidak tersedia
              </Text>
            </View>
          )}
          {/* Photo label badge */}
          <View
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              backgroundColor: "rgba(6,95,70,0.82)",
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 4,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Ionicons name="camera-outline" size={11} color="#6ee7b7" />
            <Text style={{ fontSize: 9, fontWeight: "700", color: "#a7f3d0" }}>
              Foto Bukti
            </Text>
          </View>
        </View>

        {/* BADGE ROW */}
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          <View
            style={{
              backgroundColor: "#064e3b",
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 20,
            }}
          >
            <Text style={{ fontSize: 9, fontWeight: "800", color: "#a7f3d0", letterSpacing: 0.8, textTransform: "uppercase" }}>
              {laporan.category_name}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: cfg.bg,
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 20,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: cfg.dotColor }} />
            <Text style={{ fontSize: 9, fontWeight: "800", color: cfg.textColor, letterSpacing: 0.8, textTransform: "uppercase" }}>
              {cfg.label}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: "#d1fae5",
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 20,
            }}
          >
            <Text style={{ fontSize: 9, fontWeight: "700", color: "#065f46" }}>
              #{laporan.id}
            </Text>
          </View>
        </View>

        {/* TITLE & DESCRIPTION */}
        <Text
          style={{
            fontSize: 20,
            fontWeight: "800",
            color: "#064e3b",
            lineHeight: 27,
            marginBottom: 8,
          }}
        >
          {laporan.title}
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: "#4b5563",
            lineHeight: 21,
            fontWeight: "500",
            marginBottom: 20,
          }}
        >
          {laporan.description}
        </Text>

        {/* META INFO CARD */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: "#d1fae5",
            marginBottom: 14,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "800",
              color: "#047857",
              letterSpacing: 0.8,
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Informasi Detail Laporan
          </Text>

          {/* Row 1: Pelapor & Tanggal */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingBottom: 14,
              marginBottom: 14,
              borderBottomWidth: 1,
              borderBottomColor: "#f0fdf4",
            }}
          >
            <View>
              <Text style={{ fontSize: 9, fontWeight: "700", color: "#a7f3d0", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>
                Nama Pelapor
              </Text>
              <Text style={{ fontSize: 13, fontWeight: "800", color: "#064e3b" }}>
                {laporan.user_name || "Warga Anonim"}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 9, fontWeight: "700", color: "#a7f3d0", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>
                Tanggal Laporan
              </Text>
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#064e3b" }}>
                {formatDate(laporan.created_at)}
              </Text>
            </View>
          </View>

          {/* Row 2: Lokasi */}
          <View>
            <Text style={{ fontSize: 9, fontWeight: "700", color: "#a7f3d0", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>
              Lokasi Wilayah Kejadian
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
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
                <Ionicons name="location" size={15} color="#ef4444" />
              </View>
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#064e3b", flex: 1 }}>
                {laporan.location || "Tidak Ditentukan"}
              </Text>
            </View>
          </View>
        </View>

        {/* TIMELINE TRACKER */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: "#d1fae5",
            marginBottom: 14,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "800",
              color: "#047857",
              letterSpacing: 0.8,
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            Status Peninjauan
          </Text>

          {/* Step 1: Submitted — always done */}
          <TimelineStep
            icon="checkmark"
            iconColor="#fff"
            dotBg="#059669"
            title="Aduan Berhasil Dikirim"
            subtitle="Masuk antrean verifikasi sistem."
            timestamp={formatDateTime(laporan.created_at)}
            isLast={false}
            connectorColor="#d1fae5"
          />

          {/* Step 2: Review — active if pending */}
          <TimelineStep
            icon={laporan.status !== "pending" ? "checkmark" : undefined}
            iconColor="#fff"
            dotBg={laporan.status !== "pending" ? cfg.color : undefined}
            activeDot={laporan.status === "pending"}
            activeDotColor="#f59e0b"
            title={
              laporan.status === "pending"
                ? "Menunggu Tindakan Petugas"
                : cfg.label
            }
            titleColor={laporan.status !== "pending" ? cfg.color : "#d97706"}
            subtitle={
              laporan.status === "pending"
                ? "Sedang ditinjau oleh petugas wilayah."
                : "Laporan telah ditindaklanjuti."
            }
            isLast={laporan.status !== "pending"}
            connectorColor="#f3f4f6"
          />

          {/* Step 3: Final decision — locked if pending */}
          {laporan.status === "pending" && (
            <TimelineStep
              icon={undefined}
              locked
              title="Keputusan Akhir"
              subtitle="Menunggu hasil tinjauan petugas."
              isLast
            />
          )}
        </View>

        {/* QUICK ACTIONS */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              flex: 1,
              backgroundColor: "#fff",
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: "#d1fae5",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                backgroundColor: "#d1fae5",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="share-outline" size={16} color="#059669" />
            </View>
            <View>
              <Text style={{ fontSize: 11, fontWeight: "800", color: "#064e3b" }}>Bagikan</Text>
              <Text style={{ fontSize: 9, color: "#9ca3af" }}>Salin tautan</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              flex: 1,
              backgroundColor: "#fff",
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: "#d1fae5",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                backgroundColor: "#eff6ff",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="chatbubble-outline" size={16} color="#3b82f6" />
            </View>
            <View>
              <Text style={{ fontSize: 11, fontWeight: "800", color: "#064e3b" }}>Komentar</Text>
              <Text style={{ fontSize: 9, color: "#9ca3af" }}>Tambah catatan</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// ============================================================
// TIMELINE STEP COMPONENT
// ============================================================
interface TimelineStepProps {
  icon?: string;
  iconColor?: string;
  dotBg?: string;
  activeDot?: boolean;
  activeDotColor?: string;
  locked?: boolean;
  title: string;
  titleColor?: string;
  subtitle: string;
  timestamp?: string;
  isLast: boolean;
  connectorColor?: string;
}

function TimelineStep({
  icon,
  iconColor = "#fff",
  dotBg,
  activeDot,
  activeDotColor,
  locked,
  title,
  titleColor = "#064e3b",
  subtitle,
  timestamp,
  isLast,
  connectorColor = "#e2e8f0",
}: TimelineStepProps) {
  return (
    <View style={{ flexDirection: "row", gap: 12, marginBottom: isLast ? 0 : 4 }}>
      {/* Dot + connector */}
      <View style={{ alignItems: "center", width: 20 }}>
        {/* Dot */}
        {locked ? (
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: "#f1f5f9",
              borderWidth: 2,
              borderColor: "#e2e8f0",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="lock-closed-outline" size={10} color="#cbd5e1" />
          </View>
        ) : activeDot ? (
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: "#fffbeb",
              borderWidth: 2,
              borderColor: activeDotColor ?? "#f59e0b",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: activeDotColor ?? "#f59e0b",
              }}
            />
          </View>
        ) : (
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: dotBg ?? "#059669",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon && <Ionicons name={icon as any} size={11} color={iconColor} />}
          </View>
        )}
        {/* Connector line */}
        {!isLast && (
          <View
            style={{
              width: 2,
              flex: 1,
              backgroundColor: connectorColor,
              marginVertical: 3,
              minHeight: 32,
            }}
          />
        )}
      </View>

      {/* Text */}
      <View style={{ flex: 1, paddingBottom: isLast ? 0 : 16 }}>
        <Text style={{ fontSize: 12, fontWeight: "800", color: titleColor, marginBottom: 2 }}>
          {title}
        </Text>
        <Text style={{ fontSize: 11, color: "#6b7280" }}>{subtitle}</Text>
        {timestamp && (
          <Text style={{ fontSize: 10, color: "#a7f3d0", fontWeight: "600", marginTop: 3 }}>
            {timestamp}
          </Text>
        )}
      </View>
    </View>
  );
}