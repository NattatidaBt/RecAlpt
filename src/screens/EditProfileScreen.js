import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

// --- 1. Import Firebase ---
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "../config/firebase";

export default function EditProfileScreen({ navigation }) {
  const { theme, t } = useTheme();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // --- 2. โหลดข้อมูลเมื่อเปิดหน้า ---
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setName(data.name || "");
            setEmail(data.email || user.email);
            setPhone(data.phone || "");
            setProfileImage(data.profileImage || null);
          }
        }
      } catch (error) {
        console.error("Error fetching user data: ", error);
        Alert.alert("Error", "ไม่สามารถดึงข้อมูลได้");
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  // ✅ 3. ฟังก์ชันเลือกรูปภาพ (ใช้ MediaTypeOptions ของ Expo)
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("ขออภัย", "เราต้องการสิทธิ์ในการเข้าถึงคลังรูปภาพของคุณ");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], // ⭐ แก้ตรงนี้
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  // ✅ 4. ฟังก์ชันอัปโหลดรูปไปยัง Firebase Storage (ใช้ fetch + blob)
  const uploadImageAsync = async (uri) => {
    if (!uri) return null;

    if (!storage) {
      throw new Error(
        "Firebase Storage is not initialized. Please check your firebase.js config.",
      );
    }

    const user = auth.currentUser;
    if (!user) {
      throw new Error("User is not logged in.");
    }

    try {
      console.log("📸 Uploading image uri:", uri);

      // ใช้ fetch แปลง file:// → blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // อ้างอิงไปยังโฟลเดอร์ avatars/ ตามด้วย UID ของผู้ใช้
      const fileRef = ref(storage, `avatars/${user.uid}.jpg`);
      const snapshot = await uploadBytes(fileRef, blob);
      const downloadURL = await getDownloadURL(snapshot.ref);

      console.log("✅ Upload success, downloadURL:", downloadURL);
      return downloadURL;
    } catch (error) {
      console.log("🔥 Upload error code:", error.code);
      console.log("🔥 Upload error message:", error.message);
      console.log("🔥 Full upload error:", error);
      throw error;
    }
  };

  // --- 5. ฟังก์ชันบันทึกข้อมูล ---
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกชื่อ");
      return;
    }

    setUploading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        let imageUrl = profileImage;

        // ⭐ แก้ Logic ให้ดูแค่ว่าเป็น http หรือไม่
        // - ถ้าเป็น http: คือ URL จาก Firebase อยู่แล้ว → ไม่ต้องอัปโหลดใหม่
        // - ถ้าเป็น file:// หรือ path local → อัปโหลด
        if (profileImage && !profileImage.startsWith("http")) {
          imageUrl = await uploadImageAsync(profileImage);
        }

        const docRef = doc(db, "users", user.uid);
        await updateDoc(docRef, {
          name: name,
          phone: phone,
          profileImage: imageUrl || null,
        });

        Alert.alert("สำเร็จ", "บันทึกข้อมูลเรียบร้อยแล้ว", [
          { text: "ตกลง", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error("Error updating profile: ", error);
      Alert.alert(
        "เกิดข้อผิดพลาด",
        error.message || "ไม่สามารถบันทึกข้อมูลได้",
      );
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {t("editProfile")}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Text style={[styles.doneText, { color: theme.primary }]}>
              {t("save")}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {/* Edit Image Section */}
          <View style={styles.imageContainer}>
            <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
              <View style={[styles.avatar, { backgroundColor: theme.card }]}>
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Ionicons name="person" size={60} color={theme.primary} />
                )}
              </View>
              <View
                style={[
                  styles.cameraBtn,
                  {
                    backgroundColor: theme.text,
                    borderColor: theme.background,
                  },
                ]}
              >
                <Ionicons name="camera" size={18} color={theme.card} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Forms */}
          <InputGroup
            label={t("name")}
            value={name}
            onChange={setName}
            theme={theme}
          />
          <InputGroup
            label={t("email")}
            value={email}
            onChange={setEmail}
            keyboardType="email-address"
            theme={theme}
            editable={false}
          />
          <InputGroup
            label={t("phone")}
            value={phone}
            onChange={setPhone}
            keyboardType="phone-pad"
            theme={theme}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const InputGroup = ({
  label,
  value,
  onChange,
  keyboardType,
  theme,
  editable = true,
}) => (
  <View style={styles.inputGroup}>
    <Text style={[styles.label, { color: theme.textSec }]}>{label}</Text>
    <TextInput
      style={[
        styles.input,
        {
          borderColor: theme.border,
          backgroundColor: editable ? theme.card : theme.background,
          color: editable ? theme.text : theme.textSec,
        },
      ]}
      value={value}
      onChangeText={onChange}
      keyboardType={keyboardType}
      placeholderTextColor={theme.textSec}
      editable={editable}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  doneText: { fontSize: 16, fontWeight: "bold" },
  imageContainer: { alignSelf: "center", marginVertical: 30 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  cameraBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16 },
});
