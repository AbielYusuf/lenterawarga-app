"use client";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
  Image,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Constants from "expo-constants";
import { getToken } from "../../utils/storage";

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

// ============================================================
// DATA
// ============================================================
const LIST_KATEGORI = [
  { id: 1, label: "Infrastruktur", icon: "construct-outline" },
  { id: 2, label: "Keamanan",      icon: "shield-outline" },
  { id: 3, label: "Kebersihan",    icon: "trash-outline" },
  { id: 4, label: "Sosial",        icon: "people-outline" },
];

// ============================================================
// FIELD LABEL COMPONENT
// ============================================================
function FieldLabel({ step, label }: { step: number; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 8 }}>
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 6,
          backgroundColor: "#059669",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 9, fontWeight: "800", color: "#fff" }}>{step}</Text>
      </View>
      <Text
        style={{
          fontSize: 10,
          fontWeight: "800",
          color: "#047857",
          letterSpacing: 0.8,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// Shared input style
const inputStyle = {
  backgroundColor: "#fff",
  borderWidth: 1.5,
  borderColor: "#d1fae5",
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 13,
  fontSize: 13,
  fontWeight: "500" as const,
  color: "#064e3b",
};

// ============================================================
// MAIN SCREEN
// ============================================================
export default function CreateReportScreen() {
  const router = useRouter();

  const [title, setTitle]                     = useState<string>("");
  const [description, setDescription]         = useState<string>("");
  const [location, setLocation]               = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [imageUri, setImageUri]               = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting]       = useState<boolean>(false);

  // ──────────────────────────────────────────
  // IMAGE PICKER
  // ──────────────────────────────────────────
  const handlePickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      const msg = "Aplikasi butuh akses galeri untuk unggah foto bukti.";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("Izin Ditolak", msg);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  // ──────────────────────────────────────────
  // SUBMIT
  // ──────────────────────────────────────────
  const handleSubmitReport = async () => {
    if (!title.trim() || !description.trim() || !location.trim() || !selectedCategory) {
      const msg = "Harap isi semua kolom dan pilih kategori laporan!";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("Form Belum Lengkap", msg);
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) {
        router.replace("/login" as any);
        return;
      }

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("location", location);
      formData.append("category_id", String(selectedCategory));

      if (imageUri) {
        if (Platform.OS === "web") {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          formData.append("image", blob, "aduan-mobile.png");
        } else {
          const filename = imageUri.split("/").pop() || "photo.jpg";
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : "image/jpeg";
          formData.append("image", { uri: imageUri, name: filename, type } as any);
        }
      }

      const res = await fetch(`${API_URL}/laporan`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        if (Platform.OS === "web") window.alert("Aduan berhasil dikirim!");
        else Alert.alert("Sukses 🎉", "Aduan Anda berhasil dikirim ke sistem!");
        router.replace("/");
      } else {
        throw new Error(data.message || "Gagal menyimpan laporan.");
      }
    } catch (error: any) {
      console.error("❌ Submit Error:", error);
      if (Platform.OS === "web") window.alert(error.message || "Terjadi kesalahan koneksi.");
      else Alert.alert("Gagal Mengirim", error.message || "Terjadi kesalahan koneksi.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          paddingBottom: 18,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
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

        <View>
          <Text style={{ fontSize: 16, fontWeight: "800", color: "#fff", lineHeight: 21 }}>
            Buat{" "}
            <Text style={{ color: "#a7f3d0" }}>Aduan Warga</Text>
          </Text>
          <Text style={{ fontSize: 10, color: "#6ee7b7", fontWeight: "600", marginTop: 1 }}>
            Depok, Indonesia
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View
        style={{
          backgroundColor: "#047857",
          paddingHorizontal: 18,
          paddingBottom: 0,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingBottom: 0 }}>
          {[true, !!selectedCategory, !!(title && description && location)].map((done, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 3,
                backgroundColor: done ? "#a7f3d0" : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
          <Text style={{ fontSize: 10, color: "#6ee7b7", fontWeight: "700", marginLeft: 4 }}>
            1/3
          </Text>
        </View>
      </View>

      {/* Wave */}
      <View style={{ backgroundColor: "#047857", height: 0 }} />

      {/* ── FORM BODY ───────────────────────── */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─ 1. JUDUL ─ */}
        <View style={{ marginBottom: 18 }}>
          <FieldLabel step={1} label="Judul Singkat Pengaduan" />
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Contoh: Jalan Raya Rusak / Tiang Listrik Ambruk"
            placeholderTextColor="#9ca3af"
            style={inputStyle}
          />
        </View>

        {/* ─ 2. KATEGORI ─ */}
        <View style={{ marginBottom: 18 }}>
          <FieldLabel step={2} label="Kategori Bidang" />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {LIST_KATEGORI.map((kat) => {
              const active = selectedCategory === kat.id;
              return (
                <TouchableOpacity
                  key={kat.id}
                  onPress={() => setSelectedCategory(kat.id)}
                  activeOpacity={0.75}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    backgroundColor: active ? "#059669" : "#fff",
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: 20,
                    borderWidth: 1.5,
                    borderColor: active ? "#059669" : "#d1fae5",
                  }}
                >
                  <Ionicons
                    name={kat.icon as any}
                    size={13}
                    color={active ? "#fff" : "#059669"}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: active ? "#fff" : "#047857",
                    }}
                  >
                    {kat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ─ 3. LOKASI ─ */}
        <View style={{ marginBottom: 18 }}>
          <FieldLabel step={3} label="Lokasi Spesifik Wilayah" />
          <View style={{ position: "relative" }}>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="Contoh: RT 03/RW 04, Jl. Margonda Raya"
              placeholderTextColor="#9ca3af"
              style={{ ...inputStyle, paddingRight: 44 }}
            />
            <View
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                marginTop: -13,
                width: 26,
                height: 26,
                borderRadius: 7,
                backgroundColor: "#fee2e2",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="location" size={13} color="#ef4444" />
            </View>
          </View>
        </View>

        {/* ─ 4. DESKRIPSI ─ */}
        <View style={{ marginBottom: 18 }}>
          <FieldLabel step={4} label="Deskripsi Kronologi Kejadian" />
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Tuliskan secara lengkap rincian kejadian agar petugas mudah melakukan investigasi..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={5}
            style={{
              ...inputStyle,
              height: 120,
              textAlignVertical: "top",
              lineHeight: 21,
            }}
          />
          <View style={{ alignItems: "flex-end", marginTop: 4 }}>
            <Text style={{ fontSize: 10, color: "#a7f3d0", fontWeight: "600" }}>
              {description.length} / 500
            </Text>
          </View>
        </View>

        {/* ─ 5. FOTO BUKTI ─ */}
        <View style={{ marginBottom: 18 }}>
          <FieldLabel step={5} label="Lampiran Foto Bukti Fisik" />
          {imageUri ? (
            <View
              style={{
                width: "100%",
                height: 170,
                borderRadius: 14,
                overflow: "hidden",
                borderWidth: 1.5,
                borderColor: "#a7f3d0",
              }}
            >
              <Image
                source={{ uri: imageUri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
              {/* Uploaded badge */}
              <View
                style={{
                  position: "absolute",
                  bottom: 10,
                  left: 10,
                  backgroundColor: "rgba(6,95,70,0.82)",
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Ionicons name="checkmark-circle" size={11} color="#6ee7b7" />
                <Text style={{ fontSize: 9, fontWeight: "700", color: "#a7f3d0" }}>
                  Foto berhasil diunggah
                </Text>
              </View>
              {/* Remove btn */}
              <TouchableOpacity
                onPress={() => setImageUri(null)}
                activeOpacity={0.8}
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  backgroundColor: "rgba(220,38,38,0.85)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="trash" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handlePickImage}
              activeOpacity={0.8}
              style={{
                width: "100%",
                height: 120,
                borderRadius: 14,
                borderWidth: 2,
                borderColor: "#a7f3d0",
                borderStyle: "dashed",
                backgroundColor: "#f0fdf4",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: "#d1fae5",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="camera-outline" size={22} color="#059669" />
              </View>
              <Text style={{ fontSize: 11, color: "#6ee7b7", fontWeight: "700" }}>
                Tekan untuk unggah dari galeri
              </Text>
              <Text style={{ fontSize: 10, color: "#a7f3d0", fontWeight: "500" }}>
                JPG, PNG, maks. 5MB
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* TIP BOX */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: "#d1fae5",
            flexDirection: "row",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              backgroundColor: "#d1fae5",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: 1,
            }}
          >
            <Ionicons name="information-circle-outline" size={16} color="#059669" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: "800", color: "#064e3b", marginBottom: 3 }}>
              Tips Laporan Efektif
            </Text>
            <Text style={{ fontSize: 11, color: "#6b7280", lineHeight: 17 }}>
              Sertakan foto bukti dan lokasi spesifik agar petugas dapat menindaklanjuti lebih cepat.
            </Text>
          </View>
        </View>

        {/* ─ SUBMIT BUTTON ─ */}
        <TouchableOpacity
          onPress={handleSubmitReport}
          disabled={isSubmitting}
          activeOpacity={0.85}
          style={{
            backgroundColor: isSubmitting ? "#6ee7b7" : "#059669",
            borderRadius: 14,
            paddingVertical: 15,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            shadowColor: "#059669",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 14,
            elevation: 6,
          }}
        >
          {isSubmitting ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={{ color: "#fff", fontSize: 13, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" }}>
                Mengirim...
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="paper-plane-outline" size={16} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 13, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" }}>
                Kirim Aduan Sekarang
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}