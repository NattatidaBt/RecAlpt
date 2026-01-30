import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

// --- Import Firebase ---
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

export default function SettingsScreen({ navigation }) {
  const { isDark, setIsDark, language, setLanguage, theme, t } = useTheme();
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);

  // --- 3. State สำหรับเก็บข้อมูลผู้ใช้จริง (เพิ่ม profileImage) ---
  const [userData, setUserData] = useState({
    name: "กำลังโหลด...",
    email: "...",
    profileImage: null, // ✅ เพิ่มฟิลด์รูปภาพ
  });

  // --- 4. ฟังก์ชันดึงข้อมูลจาก Firebase ---
  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        // ค่าเริ่มต้นจาก Auth
        let profile = {
          name: user.displayName || "ผู้ใช้งาน",
          email: user.email,
          profileImage: null,
        };

        try {
          // ดึงข้อมูลเพิ่มเติมจาก Firestore
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.name) profile.name = data.name;
            if (data.email) profile.email = data.email;
            if (data.profileImage) profile.profileImage = data.profileImage; // ✅ ดึง URL รูปภาพจาก DB
          }
        } catch (error) {
          console.log("Error fetching profile:", error);
        }

        setUserData(profile);
      }
    };

    // โหลดข้อมูลใหม่ทุกครั้งที่หน้าจอนี้กลับมาได้รับความสนใจ (Focus)
    const unsubscribe = navigation.addListener("focus", fetchProfile);
    return unsubscribe;
  }, [navigation]);

  // เปลี่ยนภาษา
  const handleChangeLanguage = () => {
    Alert.alert(t("selectLanguage"), "", [
      { text: "English", onPress: () => setLanguage("en") },
      { text: "ไทย", onPress: () => setLanguage("th") },
      { text: t("cancel"), style: "cancel" },
    ]);
  };

  // เปลี่ยนธีม
  const handleChangeTheme = () => {
    Alert.alert(t("selectTheme"), "", [
      { text: t("light"), onPress: () => setIsDark(false) },
      { text: t("dark"), onPress: () => setIsDark(true) },
      { text: t("cancel"), style: "cancel" },
    ]);
  };

  // ออกจากระบบ
  const handleLogout = () => {
    Alert.alert(t("logout"), "คุณต้องการออกจากระบบใช่หรือไม่?", [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("logout"),
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            navigation.reset({ index: 0, routes: [{ name: "Login" }] });
          } catch (error) {
            console.error("Logout Error:", error);
            Alert.alert("Error", "ไม่สามารถออกจากระบบได้");
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.card, borderBottomColor: theme.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {t("settings")}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={[styles.profileSection, { backgroundColor: theme.card }]}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: isDark ? "#333" : "#FCE4EC" },
            ]}
          >
            {/* ✅ แสดงรูปภาพจริงถ้ามี ถ้าไม่มีให้แสดงไอคอนคนปกติ */}
            {userData.profileImage ? (
              <Image
                source={{ uri: userData.profileImage }}
                style={styles.avatarImage}
              />
            ) : (
              <Ionicons name="person" size={40} color={theme.primary} />
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: theme.text }]}>
              {userData.name}
            </Text>
            <Text style={[styles.email, { color: theme.textSec }]}>
              {userData.email}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <Ionicons name="pencil" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionHeader, { color: theme.textSec }]}>
          {t("account")}
        </Text>
        <SettingItem
          icon="person-outline"
          title={t("editProfile")}
          onPress={() => navigation.navigate("EditProfile")}
          theme={theme}
        />
        <SettingItem
          icon="lock-closed-outline"
          title={t("changePassword")}
          onPress={() => Alert.alert("Info", "ฟีเจอร์นี้กำลังพัฒนา")}
          theme={theme}
        />
        <SwitchItem
          icon="notifications-outline"
          title={t("notification")}
          value={isNotificationEnabled}
          onValueChange={setIsNotificationEnabled}
          theme={theme}
        />

        <Text style={[styles.sectionHeader, { color: theme.textSec }]}>
          {t("general")}
        </Text>
        <SettingItem
          icon="language-outline"
          title={t("language")}
          value={language === "th" ? "ไทย" : "English"}
          onPress={handleChangeLanguage}
          theme={theme}
        />
        <SettingItem
          icon="moon-outline"
          title={t("theme")}
          value={isDark ? t("dark") : t("light")}
          onPress={handleChangeTheme}
          theme={theme}
        />
        <SettingItem
          icon="help-circle-outline"
          title={t("help")}
          onPress={() => {}}
          theme={theme}
        />

        <TouchableOpacity
          style={[
            styles.logoutBtn,
            {
              backgroundColor: theme.card,
              borderColor: isDark ? theme.border : "#FFCDD2",
            },
          ]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>{t("logout")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// Component ย่อย: รายการตั้งค่า
const SettingItem = ({ icon, title, value, onPress, theme }) => (
  <TouchableOpacity
    style={[
      styles.item,
      { backgroundColor: theme.card, borderBottomColor: theme.border },
    ]}
    onPress={onPress}
  >
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={20} color={theme.text} />
      </View>
      <Text style={[styles.itemTitle, { color: theme.text }]}>{title}</Text>
    </View>
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {value && (
        <Text style={[styles.itemValue, { color: theme.textSec }]}>
          {value}
        </Text>
      )}
      <Ionicons name="chevron-forward" size={18} color={theme.border} />
    </View>
  </TouchableOpacity>
);

// Component ย่อย: สวิตช์
const SwitchItem = ({ icon, title, value, onValueChange, theme }) => (
  <View
    style={[
      styles.item,
      { backgroundColor: theme.card, borderBottomColor: theme.border },
    ]}
  >
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={20} color={theme.text} />
      </View>
      <Text style={[styles.itemTitle, { color: theme.text }]}>{title}</Text>
    </View>
    <Switch
      trackColor={{ false: "#767577", true: theme.primary }}
      thumbColor={value ? "#fff" : "#f4f3f4"}
      onValueChange={onValueChange}
      value={value}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 20,
    paddingTop: 50,
    alignItems: "center",
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    marginBottom: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    overflow: "hidden",
  }, // ✅ เพิ่ม overflow
  avatarImage: { width: "100%", height: "100%" }, // ✅ จัดการขนาดรูป
  profileInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: "bold" },
  email: { fontSize: 13 },
  editBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeader: {
    marginLeft: 20,
    marginBottom: 10,
    marginTop: 10,
    fontSize: 13,
    fontWeight: "bold",
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
  },
  iconBox: { width: 30, alignItems: "center", marginRight: 10 },
  itemTitle: { fontSize: 15 },
  itemValue: { fontSize: 14, marginRight: 10 },
  logoutBtn: {
    margin: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  logoutText: { color: "#D32F2F", fontWeight: "bold" },
});
