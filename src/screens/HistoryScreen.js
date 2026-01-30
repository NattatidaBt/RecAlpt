import { Ionicons } from "@expo/vector-icons";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function HistoryScreen({ navigation }) {
  const { theme, t } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.header, { color: theme.text }]}>
        {t("savedReceipts")}
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        <FolderItem
          label="ใบเสร็จรับเงินทั่วไป"
          onPress={() =>
            navigation.navigate("ReceiptList", {
              categoryTitle: "ใบเสร็จรับเงินทั่วไป",
            })
          }
          theme={theme}
        />
        <FolderItem
          label="ใบกำกับภาษีแบบเต็มรูป"
          onPress={() =>
            navigation.navigate("ReceiptList", {
              categoryTitle: "ใบกำกับภาษีแบบเต็มรูป",
            })
          }
          theme={theme}
        />
        <FolderItem
          label="ใบกำกับภาษีอย่างย่อ"
          onPress={() =>
            navigation.navigate("ReceiptList", {
              categoryTitle: "ใบกำกับภาษีอย่างย่อ",
            })
          }
          theme={theme}
        />
      </ScrollView>

      {/* --- แก้ไขตรงนี้: เชื่อมปุ่มบวกให้ไปหน้าเพิ่มข้อมูล --- */}
      <TouchableOpacity
        style={[styles.addBtn, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate("AddReceipt")}
      >
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const FolderItem = ({ label, onPress, theme }) => (
  <TouchableOpacity
    style={[
      styles.folder,
      { backgroundColor: theme.card, borderColor: theme.border },
    ]}
    onPress={onPress}
  >
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Ionicons
        name="folder-open-outline"
        size={26}
        color={theme.text}
        style={{ marginRight: 15 }}
      />
      <Text style={[styles.folderText, { color: theme.text }]}>{label}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50 },
  header: { fontSize: 20, fontWeight: "bold", marginBottom: 25 },
  folder: {
    padding: 25,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 15,
    elevation: 1,
  },
  folderText: { fontSize: 16, fontWeight: "500" },
  addBtn: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
});
