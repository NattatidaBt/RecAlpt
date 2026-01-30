import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

// --- Import Firebase ---
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";

// ข้อมูลจำลองสำหรับการ Extract ข้อมูล
const MOCK_EXTRACTED_DATA = {
  shopName: "ร้านน้องดรีม",
  shopAddress: "25 ม.7 ต.หมากฝรั่ง อ.กยู จ.ต้นหอม",
  shopPhone: "025-080-2016",
  shopTaxId: "2232361322525",
  isVatRegistered: true,
  customerName: "มาร์ค ลี",
  customerAddress: "2 ม.7 ต.พริกหยวก อ.ซีตาร์ จ.แคนาดา",
  customerPhone: "060-228-1999",
  customerTaxId: "-",
  receiptNo: "01270",
  refNo: "0180706060",
  date: new Date("2026-08-25"),
  category: "ใบกำกับภาษีอย่างย่อ",
  items: [
    { name: "แท่งไฟ nct v.2", qty: "2", unit: "แท่ง", price: "2100" },
    { name: "เสื้อ md", qty: "1", unit: "ตัว", price: "690" },
  ],
  total: 5232.3,
};

export default function HomeScreen({ navigation }) {
  const { theme, t } = useTheme();
  const [searchText, setSearchText] = useState("");
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "receipts"),
      where("uid", "==", user.uid),
      orderBy("date", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const receiptsData = [];
        querySnapshot.forEach((doc) => {
          receiptsData.push({ id: doc.id, ...doc.data() });
        });
        setReceipts(receiptsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching receipts:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // --- ฟังก์ชันจัดการกล้อง ---
  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("ต้องการสิทธิ์", "กรุณาอนุญาตให้แอปเข้าถึงกล้องถ่ายรูป");
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      navigation.navigate("Verification", {
        imageUri: result.assets[0].uri,
        type: "image",
        mode: "add",
        receiptData: MOCK_EXTRACTED_DATA,
      });
    }
  };

  // --- ฟังก์ชันจัดการคลังภาพ ---
  const handleGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("ต้องการสิทธิ์", "กรุณาอนุญาตให้แอปเข้าถึงคลังรูปภาพ");
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      navigation.navigate("Verification", {
        imageUri: result.assets[0].uri,
        type: "image",
        mode: "add",
        receiptData: MOCK_EXTRACTED_DATA,
      });
    }
  };

  // --- ฟังก์ชันจัดการ PDF ---
  const handlePDF = async () => {
    try {
      let result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
      if (result.assets && result.assets.length > 0) {
        navigation.navigate("Verification", {
          imageUri: result.assets[0].uri,
          type: "pdf",
          fileName: result.assets[0].name,
          mode: "add",
          receiptData: MOCK_EXTRACTED_DATA,
        });
      }
    } catch (err) {
      console.log("PDF Picker Error:", err);
    }
  };

  // ✅ 1. เพิ่มฟังก์ชันสำหรับแสดงเมนูเมื่อกดปุ่ม FAB
  const handleFabPress = () => {
    Alert.alert(
      t("uploadReceipt"),
      "กรุณาเลือกวิธีการนำเข้าข้อมูล",
      [
        { text: t("camera"), onPress: handleCamera },
        { text: t("gallery"), onPress: handleGallery },
        { text: t("pdf"), onPress: handlePDF },
        { text: t("cancel"), style: "cancel" },
      ],
      { cancelable: true },
    );
  };

  const filteredReceipts = receipts.filter((item) => {
    const text = searchText.toLowerCase();
    const shopName = item.shopName ? item.shopName.toLowerCase() : "";
    const total = item.total ? item.total.toString() : "";
    let dateStr = item.date?.toDate
      ? item.date.toDate().toLocaleDateString("th-TH")
      : "";
    return (
      shopName.includes(text) || total.includes(text) || dateStr.includes(text)
    );
  });

  const displayReceipts =
    searchText === "" ? filteredReceipts.slice(0, 3) : filteredReceipts;

  const getCategoryStyle = (category) => {
    switch (category) {
      case "ใบเสร็จรับเงินทั่วไป":
        return { icon: "receipt-outline", color: "#D81B60", bg: "#FCE4EC" };
      case "ใบกำกับภาษีแบบเต็มรูป":
        return {
          icon: "document-text-outline",
          color: "#1976D2",
          bg: "#E3F2FD",
        };
      case "ใบกำกับภาษีอย่างย่อ":
        return { icon: "ticket-outline", color: "#F57C00", bg: "#FFF3E0" };
      default:
        return { icon: "pricetag-outline", color: "#757575", bg: "#EEEEEE" };
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={{ width: 24 }} />
        <View style={styles.headerLogo}>
          <Ionicons name="receipt-outline" size={20} color={theme.primary} />
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {" "}
            RecAlpt
          </Text>
          <Text style={[styles.tilde, { color: theme.primary }]}> ~</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 20 }}
      >
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <TextInput
            placeholder={t("search")}
            style={[styles.searchInput, { color: theme.text }]}
            placeholderTextColor={theme.textSec}
            value={searchText}
            onChangeText={setSearchText}
          />
          <Ionicons name="search" size={20} color={theme.textSec} />
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {t("uploadReceipt")}
        </Text>
        <View style={styles.actionRow}>
          <ActionButton
            icon="camera-outline"
            label={t("camera")}
            onPress={handleCamera}
            theme={theme}
          />
          <ActionButton
            icon="image-outline"
            label={t("gallery")}
            onPress={handleGallery}
            theme={theme}
          />
          <ActionButton
            icon="document-text-outline"
            label={t("pdf")}
            onPress={handlePDF}
            theme={theme}
          />
        </View>

        <TouchableOpacity
          style={styles.sectionHeaderRow}
          onPress={() =>
            navigation.navigate("ReceiptList", {
              categoryTitle: "รายการใบเสร็จ",
            })
          }
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t("recentReceipts")}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              style={{ color: theme.textSec, fontSize: 12, marginRight: 5 }}
            >
              {t("viewAll")}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={theme.text} />
          </View>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={theme.primary}
            style={{ marginTop: 20 }}
          />
        ) : displayReceipts.length > 0 ? (
          displayReceipts.map((item) => {
            const style = getCategoryStyle(item.category);
            return (
              <ReceiptCard
                key={item.id}
                store={item.shopName || "ไม่ระบุร้านค้า"}
                date={
                  item.date?.toDate
                    ? item.date.toDate().toLocaleDateString("th-TH")
                    : "ไม่ระบุวันที่"
                }
                price={`฿${item.total ? item.total.toFixed(2) : "0.00"}`}
                icon={style.icon}
                iconColor={style.color}
                bgIcon={style.bg}
                onPress={() =>
                  navigation.navigate("ReceiptDetail", { receiptData: item })
                }
                theme={theme}
              />
            );
          })
        ) : (
          <Text
            style={{
              textAlign: "center",
              color: theme.textSec,
              marginVertical: 20,
            }}
          >
            ไม่พบข้อมูลใบเสร็จ
          </Text>
        )}

        <View style={[styles.sectionHeaderRow, { marginTop: 20 }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t("savedReceipts")}
          </Text>
        </View>

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
          label={t("taxInvoiceAbbr") || "ใบกำกับภาษีอย่างย่อ"}
          onPress={() =>
            navigation.navigate("ReceiptList", {
              categoryTitle: "ใบกำกับภาษีอย่างย่อ",
            })
          }
          theme={theme}
        />
      </ScrollView>

      {/* ✅ 2. แก้ไขปุ่ม FAB ให้เรียกใช้ handleFabPress */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={handleFabPress}
      >
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

// ... (ActionButton, ReceiptCard, FolderItem, styles คงเดิม)
const ActionButton = ({ icon, label, onPress, theme }) => (
  <TouchableOpacity
    style={[
      styles.actionBtn,
      {
        backgroundColor: theme.card,
        borderColor: theme.border,
        borderWidth: 1,
      },
    ]}
    onPress={onPress}
  >
    <View style={styles.iconCircle}>
      <Ionicons name={icon} size={28} color={theme.text} />
    </View>
    <Text style={[styles.actionText, { color: theme.text }]}>{label}</Text>
  </TouchableOpacity>
);

const ReceiptCard = ({
  store,
  date,
  price,
  icon,
  iconColor,
  bgIcon,
  onPress,
  theme,
}) => (
  <TouchableOpacity
    style={[
      styles.card,
      { backgroundColor: theme.card, borderBottomColor: theme.border },
    ]}
    onPress={onPress}
  >
    <View style={styles.cardLeft}>
      <View
        style={[
          styles.cardIconBox,
          { backgroundColor: bgIcon || theme.background },
        ]}
      >
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View>
        <Text style={[styles.storeName, { color: theme.text }]}>{store}</Text>
        <Text style={[styles.dateText, { color: theme.textSec }]}>{date}</Text>
      </View>
    </View>
    <Text style={[styles.priceText, { color: theme.text }]}>{price}</Text>
  </TouchableOpacity>
);

const FolderItem = ({ label, onPress, theme }) => (
  <TouchableOpacity
    style={[
      styles.folderCard,
      { backgroundColor: theme.card, borderColor: theme.border },
    ]}
    onPress={onPress}
  >
    <View style={styles.folderLeft}>
      <Ionicons name="folder-outline" size={24} color={theme.text} />
      <Text style={[styles.folderText, { color: theme.text }]}>{label}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={theme.textSec} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: 30,
    borderBottomWidth: 1,
  },
  headerLogo: { flexDirection: "row", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  tilde: { fontSize: 20, fontWeight: "bold" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 20,
    marginTop: 20,
  },
  searchInput: { flex: 1, fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 15 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  actionBtn: {
    width: "30%",
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: "center",
  },
  iconCircle: { marginBottom: 8 },
  actionText: { fontSize: 12, fontWeight: "500" },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    marginBottom: 5,
  },
  cardLeft: { flexDirection: "row", alignItems: "center" },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  storeName: { fontSize: 14, fontWeight: "bold" },
  dateText: { fontSize: 12 },
  priceText: { fontSize: 14, fontWeight: "bold" },
  folderCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
  },
  folderLeft: { flexDirection: "row", alignItems: "center" },
  folderText: { marginLeft: 15, fontSize: 14, fontWeight: "500" },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
});
