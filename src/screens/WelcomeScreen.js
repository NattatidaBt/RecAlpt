import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

// --- 1. Import Firebase ---
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";

export default function WelcomeScreen({ navigation }) {
  const { theme } = useTheme();

  useEffect(() => {
    // 2. ตรวจสอบสถานะล็อกอิน
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // ตั้งเวลาหน่วงไว้เล็กน้อย (เช่น 2 วินาที) เพื่อให้เห็นโลโก้ก่อน
      const timer = setTimeout(() => {
        if (user) {
          // ถ้ามี User ล็อกอินอยู่แล้ว -> ไปหน้าหลักเลย
          navigation.replace("MainApp");
        } else {
          // ถ้ายังไม่มี -> ไปหน้า Login
          navigation.replace("Login");
        }
      }, 2000); // ปรับเวลาตามความเหมาะสม (2000ms = 2 วินาที)

      return () => clearTimeout(timer);
    });

    // คืนค่าฟังก์ชันเพื่อหยุดการทำงานเมื่อออกจากหน้านี้
    return () => unsubscribe();
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.logoContainer}>
        {/* จำลองโลโก้ด้วย Icon และกรอบสี่เหลี่ยม */}
        <View
          style={[
            styles.iconBox,
            { backgroundColor: theme.card, borderColor: theme.primary },
          ]}
        >
          <Ionicons name="receipt-outline" size={60} color={theme.primary} />
        </View>

        <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
          <Text style={[styles.title, { color: theme.text }]}>RecAlpt</Text>
          <Text style={{ fontSize: 30, color: theme.primary, marginBottom: 5 }}>
            {" "}
            ~
          </Text>
        </View>

        <Text style={[styles.subtitle, { color: theme.textSec }]}>
          OCR + LLM • Automated Receipt Sorting
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  logoContainer: { alignItems: "center" },
  iconBox: {
    width: 100,
    height: 100,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
  },
  title: { fontSize: 36, fontWeight: "bold" },
  subtitle: { marginTop: 10, fontSize: 12 },
});
