import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

// --- Firebase Import ---
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

export default function RegisterScreen({ navigation }) {
  const { theme, t } = useTheme();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // 2. เพิ่ม State สำหรับตรวจสอบสถานะการโหลด
  const [loading, setLoading] = useState(false);

  // --- ฟังก์ชันสมัครสมาชิก ---
  const handleRegister = async () => {
    const cleanEmail = email.trim();

    if (!name || !cleanEmail || !password || !confirmPassword) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("แจ้งเตือน", "รหัสผ่านไม่ตรงกัน");
      return;
    }

    // 3. เริ่มโหลด -> ล็อกปุ่ม
    setLoading(true);

    try {
      // สร้าง User ใน Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password,
      );
      const user = userCredential.user;

      // บันทึกข้อมูลลง Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: cleanEmail,
        createdAt: new Date(),
        role: "user",
      });

      // สั่ง Logout ทันที
      await signOut(auth);

      // แจ้งเตือนสำเร็จ
      Alert.alert("สำเร็จ", "สร้างบัญชีเรียบร้อยแล้ว กรุณาเข้าสู่ระบบใหม่", [
        {
          text: "ตกลง",
          onPress: () => navigation.navigate("Login"),
        },
      ]);
    } catch (error) {
      console.log("Register Error:", error);

      let errorMessage = "เกิดข้อผิดพลาดในการสมัครสมาชิก";
      if (error.code === "auth/email-already-in-use")
        errorMessage = "อีเมลนี้ถูกใช้งานแล้ว";
      if (error.code === "auth/weak-password")
        errorMessage = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
      if (error.code === "auth/invalid-email")
        errorMessage = "รูปแบบอีเมลไม่ถูกต้อง";

      Alert.alert("ล้มเหลว", errorMessage);
    } finally {
      // 4. จบการทำงาน (ไม่ว่าจะสำเร็จหรือล้มเหลว) -> ปลดล็อกปุ่ม
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.innerContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View
            style={[
              styles.logoIconBox,
              { borderColor: theme.primary, backgroundColor: theme.card },
            ]}
          >
            <Ionicons name="receipt-outline" size={30} color={theme.primary} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>
            {t("registerTitle")}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSec }]}>
            {t("registerSubtitle")}
          </Text>
        </View>

        {/* Form Area */}
        <View style={styles.formArea}>
          <InputField
            icon="person-outline"
            placeholder={t("name")}
            theme={theme}
            value={name}
            onChangeText={setName}
          />
          <InputField
            icon="mail-outline"
            placeholder={t("email")}
            keyboardType="email-address"
            theme={theme}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />

          {/* Password Field */}
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

          {/* Confirm Password Field */}
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
              placeholder={t("confirmPassword")}
              placeholderTextColor={theme.textSec}
              secureTextEntry={!isConfirmPasswordVisible}
              style={[styles.input, { color: theme.text }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              onPress={() =>
                setConfirmPasswordVisible(!isConfirmPasswordVisible)
              }
            >
              <Ionicons
                name={
                  isConfirmPasswordVisible ? "eye-outline" : "eye-off-outline"
                }
                size={20}
                color={theme.textSec}
              />
            </TouchableOpacity>
          </View>

          {/* Register Button (ปรับปรุง UI ตอนโหลด) */}
          <TouchableOpacity
            style={[
              styles.registerBtn,
              {
                backgroundColor: theme.primary,
                opacity: loading ? 0.7 : 1, // ทำให้ปุ่มจางลงเมื่อโหลด
              },
            ]}
            onPress={handleRegister}
            disabled={loading} // ห้ามกดซ้ำตอนโหลด
          >
            {loading ? (
              <ActivityIndicator color="#FFF" /> // แสดงตัวหมุน
            ) : (
              <Text style={styles.btnText}>{t("register")}</Text>
            )}
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={{ color: theme.textSec }}>{t("haveAccount")} </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={[styles.loginLink, { color: theme.primary }]}>
                {t("login")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Reusable Input
const InputField = ({
  icon,
  placeholder,
  keyboardType,
  theme,
  value,
  onChangeText,
  autoCapitalize = "sentences",
}) => (
  <View
    style={[
      styles.inputContainer,
      { backgroundColor: theme.card, borderColor: theme.border },
    ]}
  >
    <Ionicons
      name={icon}
      size={20}
      color={theme.textSec}
      style={styles.inputIcon}
    />
    <TextInput
      placeholder={placeholder}
      placeholderTextColor={theme.textSec}
      style={[styles.input, { color: theme.text }]}
      keyboardType={keyboardType}
      value={value}
      onChangeText={onChangeText}
      autoCapitalize={autoCapitalize}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  innerContainer: { padding: 30, flexGrow: 1, justifyContent: "center" },
  backBtn: { position: "absolute", top: 50, left: 20, zIndex: 10 },
  header: { alignItems: "center", marginBottom: 30, marginTop: 40 },
  logoIconBox: {
    padding: 10,
    borderWidth: 1.5,
    borderRadius: 12,
    marginBottom: 15,
  },
  title: { fontSize: 24, fontWeight: "bold" },
  subtitle: { fontSize: 14, marginTop: 5 },

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

  registerBtn: {
    height: 55,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    elevation: 3,
  },
  btnText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },

  footer: { flexDirection: "row", justifyContent: "center", marginTop: 25 },
  loginLink: { fontWeight: "bold" },
});
