import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

// --- เพิ่มการนำเข้า Firebase ---
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";

export default function LoginScreen({ navigation }) {
  const { theme, t } = useTheme();
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // --- 1. ฟังก์ชันล็อกอินด้วย Email (ใช้งานจริง) ---
  const handleLogin = async () => {
    // ตรวจสอบว่ากรอกข้อมูลครบไหม
    if (!email || !password) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    try {
      // ส่งข้อมูลไปตรวจสอบกับ Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      console.log("Login Success:", userCredential.user.uid);

      // ล็อกอินผ่าน -> ไปหน้าหลัก
      navigation.replace("MainApp");
    } catch (error) {
      console.error(error);
      // แสดงข้อความเมื่อล็อกอินพลาด
      let errorMessage = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
      if (error.code === "auth/invalid-email")
        errorMessage = "รูปแบบอีเมลไม่ถูกต้อง";
      if (error.code === "auth/user-not-found")
        errorMessage = "ไม่พบผู้ใช้งานนี้";
      if (error.code === "auth/wrong-password") errorMessage = "รหัสผ่านผิด";

      Alert.alert("เข้าสู่ระบบไม่สำเร็จ", errorMessage);
    }
  };

  // --- 2. ฟังก์ชัน Google (จำลองไว้ก่อน) ---
  const handleGoogleLogin = () => {
    Alert.alert("Coming Soon", "ระบบล็อกอินด้วย Google จะเปิดใช้งานเร็วๆ นี้");
  };

  // --- 3. ฟังก์ชัน Facebook (จำลองไว้ก่อน) ---
  const handleFacebookLogin = () => {
    Alert.alert(
      "Coming Soon",
      "ระบบล็อกอินด้วย Facebook จะเปิดใช้งานเร็วๆ นี้",
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.innerContainer}>
        {/* Header Logo */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View
              style={[
                styles.logoIconBox,
                { backgroundColor: theme.card, borderColor: theme.primary },
              ]}
            >
              <Ionicons
                name="receipt-outline"
                size={30}
                color={theme.primary}
              />
            </View>
            <View>
              <Text style={[styles.appName, { color: theme.text }]}>
                RecAlpt
              </Text>
              <Text style={[styles.tilde, { color: theme.primary }]}>~</Text>
            </View>
          </View>
        </View>

        {/* Form Area */}
        <View style={styles.formArea}>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Ionicons
              name="person-outline"
              size={20}
              color={theme.textSec}
              style={styles.inputIcon}
            />
            <TextInput
              placeholder={t("email")}
              placeholderTextColor={theme.textSec}
              style={[styles.input, { color: theme.text }]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none" // เพิ่มเพื่อให้ไม่ตัวใหญ่ตัวแรกอัตโนมัติ
            />
          </View>

          <View
            style={[
              styles.inputContainer,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={theme.textSec}
              style={styles.inputIcon}
            />
            <TextInput
              placeholder={t("password")}
              placeholderTextColor={theme.textSec}
              secureTextEntry={!isPasswordVisible}
              style={[styles.input, { color: theme.text }]}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              onPress={() => setPasswordVisible(!isPasswordVisible)}
            >
              <Ionicons
                name={isPasswordVisible ? "eye-outline" : "eye-off-outline"}
                size={20}
                color={theme.textSec}
              />
            </TouchableOpacity>
          </View>

          {/* Login Button (แก้ไขให้เรียกใช้ handleLogin) */}
          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: theme.primary }]}
            onPress={handleLogin}
          >
            <Text style={styles.loginText}>{t("login")}</Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text style={[styles.forgotPass, { color: theme.textSec }]}>
              {t("forgotPassword")}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.orText, { color: theme.textSec }]}>
            {t("or")}
          </Text>

          {/* Social Buttons (แก้ไขให้มี Alert แจ้งเตือน) */}
          <TouchableOpacity
            style={[styles.socialBtn, { borderColor: theme.border }]}
            onPress={handleGoogleLogin}
          >
            <Image
              source={{
                uri: "https://cdn-icons-png.flaticon.com/512/300/300221.png",
              }}
              style={styles.socialIcon}
            />
            <Text style={[styles.socialText, { color: theme.text }]}>
              {t("loginWithGoogle")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.socialBtn, { borderColor: theme.border }]}
            onPress={handleFacebookLogin}
          >
            <Image
              source={{
                uri: "https://cdn-icons-png.flaticon.com/512/5968/5968764.png",
              }}
              style={styles.socialIcon}
            />
            <Text style={[styles.socialText, { color: theme.text }]}>
              {t("loginWithFacebook")}
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={{ color: theme.textSec }}>{t("noAccount")} </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={[styles.registerLink, { color: theme.primary }]}>
                {t("register")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  innerContainer: { flex: 1, padding: 30, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 40 },
  logoRow: { flexDirection: "row", alignItems: "center" },
  logoIconBox: {
    padding: 8,
    borderWidth: 1.5,
    borderRadius: 12,
    marginRight: 12,
  },
  appName: { fontSize: 28, fontWeight: "bold", lineHeight: 32 },
  tilde: {
    fontSize: 30,
    position: "absolute",
    bottom: -15,
    right: 0,
    fontWeight: "bold",
  },
  formArea: { width: "100%" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 55,
    marginBottom: 15,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16 },
  loginBtn: {
    height: 55,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    elevation: 5,
  },
  loginText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
  forgotPass: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
    fontWeight: "500",
  },
  orText: { textAlign: "center", marginVertical: 20, fontSize: 14 },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 25,
    height: 50,
    marginBottom: 15,
  },
  socialIcon: { width: 22, height: 22, marginRight: 10 },
  socialText: { fontWeight: "600", fontSize: 15 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  registerLink: { fontWeight: "bold" },
});
