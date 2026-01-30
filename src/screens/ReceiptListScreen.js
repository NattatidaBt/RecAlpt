import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
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

// ✅ 1. ฟังก์ชันดึงสไตล์ (Icon, Color, BG) ตามประเภทใบเสร็จ เพื่อให้สีตรงกับหน้าหลัก
const getCategoryStyle = (category) => {
  switch (category) {
    case "ใบเสร็จรับเงินทั่วไป":
      return { icon: "receipt-outline", color: "#D81B60", bg: "#FCE4EC" };
    case "ใบกำกับภาษีแบบเต็มรูป":
      return { icon: "document-text-outline", color: "#1976D2", bg: "#E3F2FD" };
    case "ใบกำกับภาษีอย่างย่อ":
      return { icon: "ticket-outline", color: "#F57C00", bg: "#FFF3E0" };
    default:
      return { icon: "pricetag-outline", color: "#757575", bg: "#EEEEEE" };
  }
};

export default function ReceiptListScreen({ route, navigation }) {
  const { theme } = useTheme();

  // รับชื่อหมวดหมู่ (ถ้าไม่มีให้ Default เป็น "รายการใบเสร็จ")
  const { categoryTitle } = route.params || { categoryTitle: "รายการใบเสร็จ" };

  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- ดึงข้อมูลตามหมวดหมู่ ---
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    let q;

    // ✅ 2. ปรับปรุง Logic การ Query ให้รองรับการเรียงยอดจากมากไปน้อย
    if (categoryTitle === "รายการใบเสร็จ") {
      // ดึงทั้งหมด: เรียงตามวันที่ล่าสุด
      q = query(
        collection(db, "receipts"),
        where("uid", "==", user.uid),
        orderBy("date", "desc"),
      );
    } else if (categoryTitle === "Top Spends") {
      // ✅ กรณีใบเสร็จยอดสูงสุด: เรียงตาม total จากมากไปน้อย (desc)
      q = query(
        collection(db, "receipts"),
        where("uid", "==", user.uid),
        orderBy("total", "desc"),
      );
    } else {
      // ดึงแบบ Filter ตามหมวดหมู่: เรียงตามวันที่ล่าสุด
      q = query(
        collection(db, "receipts"),
        where("uid", "==", user.uid),
        where("category", "==", categoryTitle),
        orderBy("date", "desc"),
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const data = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        setReceipts(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching list:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [categoryTitle]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <Text
          style={[styles.headerTitle, { color: theme.text }]}
          numberOfLines={1}
        >
          {/* ปรับชื่อ Title ถ้าเป็นหน้านอดสูงสุด */}
          {categoryTitle === "Top Spends" ? "ใบเสร็จยอดสูงสุด" : categoryTitle}
        </Text>

        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={theme.primary}
          style={{ marginTop: 50 }}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20 }}
        >
          {receipts.length > 0 ? (
            receipts.map((item) => {
              const catStyle = getCategoryStyle(item.category);

              return (
                <ReceiptItem
                  key={item.id}
                  store={item.shopName || "ไม่ระบุร้าน"}
                  date={
                    item.date?.toDate
                      ? item.date.toDate().toLocaleDateString("th-TH")
                      : "-"
                  }
                  // ✅ แสดงผลตัวเลขแบบมีคอมม่าคั่นหลักพัน
                  price={`฿${item.total ? item.total.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}`}
                  icon={catStyle.icon}
                  iconColor={catStyle.color}
                  bgIcon={catStyle.bg}
                  onPress={() =>
                    navigation.navigate("ReceiptDetail", { receiptData: item })
                  }
                  theme={theme}
                />
              );
            })
          ) : (
            <View style={{ alignItems: "center", marginTop: 50 }}>
              <Ionicons
                name="file-tray-outline"
                size={60}
                color={theme.textSec}
              />
              <Text style={{ color: theme.textSec, marginTop: 10 }}>
                ไม่มีรายการข้อมูล
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// Component ย่อย
const ReceiptItem = ({
  store,
  date,
  price,
  icon,
  bgIcon,
  iconColor,
  onPress,
  theme,
}) => (
  <TouchableOpacity
    style={[
      styles.card,
      { backgroundColor: theme.card, borderColor: theme.border },
    ]}
    onPress={onPress}
  >
    <View style={styles.cardLeft}>
      <View style={[styles.iconBox, { backgroundColor: bgIcon }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View>
        <Text style={[styles.storeName, { color: theme.text }]}>{store}</Text>
        <Text style={[styles.dateText, { color: theme.textSec }]}>{date}</Text>
      </View>
    </View>
    <View style={{ alignItems: "flex-end" }}>
      <Text style={[styles.priceText, { color: theme.text }]}>{price}</Text>
      <Ionicons
        name="chevron-forward"
        size={16}
        color={theme.textSec}
        style={{ marginTop: 4 }}
      />
    </View>
  </TouchableOpacity>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    maxWidth: "70%",
    textAlign: "center",
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  cardLeft: { flexDirection: "row", alignItems: "center" },
  iconBox: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  storeName: { fontSize: 14, fontWeight: "bold" },
  dateText: { fontSize: 12, marginTop: 2 },
  priceText: { fontSize: 14, fontWeight: "bold" },
});
