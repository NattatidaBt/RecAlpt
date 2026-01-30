import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
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

const screenWidth = Dimensions.get("window").width;

export default function StatsScreen({ navigation }) {
  const { theme, t } = useTheme();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAmount: 0,
    count: 0,
    average: 0,
    topCategory: "-",
  });
  const [topReceipts, setTopReceipts] = useState([]);
  const [chartData, setChartData] = useState({
    labels: ["-", "-", "-", "-", "-", "-"],
    datasets: [{ data: [0, 0, 0, 0, 0, 0] }],
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "receipts"),
      where("uid", "==", user.uid),
      orderBy("date", "asc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let totalSum = 0;
        let itemCount = 0;
        const categoryMap = {};
        const allItems = [];

        const months = [
          "ม.ค.",
          "ก.พ.",
          "มี.ค.",
          "เม.ย.",
          "พ.ค.",
          "มิ.ย.",
          "ก.ค.",
          "ส.ค.",
          "ก.ย.",
          "ต.ค.",
          "พ.ย.",
          "ธ.ค.",
        ];
        const currentMonthIndex = new Date().getMonth();
        const last6MonthsLabels = [];
        const last6MonthsValues = [0, 0, 0, 0, 0, 0];

        for (let i = 5; i >= 0; i--) {
          let mIndex = currentMonthIndex - i;
          if (mIndex < 0) mIndex += 12;
          last6MonthsLabels.push(months[mIndex]);
        }

        snapshot.forEach((doc) => {
          const data = doc.data();
          const price = parseFloat(data.total) || 0;
          totalSum += price;
          itemCount++;
          const cat = data.category || "อื่นๆ";
          categoryMap[cat] = (categoryMap[cat] || 0) + price;

          // ✅ เก็บ ID และข้อมูลทั้งหมดลงไปเพื่อให้หน้า Detail ทำงานได้ครบถ้วน
          allItems.push({ id: doc.id, ...data });

          if (data.date && data.date.toDate) {
            const dateObj = data.date.toDate();
            const monthIdx = dateObj.getMonth();
            const labelIndex = last6MonthsLabels.indexOf(months[monthIdx]);
            if (labelIndex !== -1) {
              last6MonthsValues[labelIndex] += price;
            }
          }
        });

        let maxCat = "-";
        let maxCatVal = 0;
        for (const [key, value] of Object.entries(categoryMap)) {
          if (value > maxCatVal) {
            maxCatVal = value;
            maxCat = key;
          }
        }

        const sortedByPrice = [...allItems]
          .sort((a, b) => b.total - a.total)
          .slice(0, 3);

        setStats({
          totalAmount: totalSum,
          count: itemCount,
          average: itemCount > 0 ? totalSum / itemCount : 0,
          topCategory: maxCat,
        });
        setTopReceipts(sortedByPrice);
        setChartData({
          labels: last6MonthsLabels,
          datasets: [
            {
              data: last6MonthsValues,
              color: (opacity = 1) => theme.primary,
              strokeWidth: 3,
            },
          ],
        });
        setLoading(false);
      },
      (error) => {
        console.error("Stats Error:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const handleCardPress = (title) => {
    // ✅ แก้ไขให้รองรับชื่อหน้าจอสรุปยอด
    const target =
      title === "รายรับ-รายจ่าย" || title === "รายการทั้งหมด"
        ? "รายการใบเสร็จ"
        : title;
    navigation.navigate("ReceiptList", { categoryTitle: target });
  };

  const formatCurrency = (amount) => {
    return `฿${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;
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

      {loading ? (
        <ActivityIndicator
          size="large"
          color={theme.primary}
          style={{ marginTop: 50 }}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 50, paddingHorizontal: 20 }}
        >
          <Text style={[styles.pageTitle, { color: theme.text }]}>
            {t("dashboard")}
          </Text>

          <View style={styles.gridContainer}>
            <StatCard
              icon="wallet-outline"
              title={t("totalAmount")}
              value={formatCurrency(stats.totalAmount)}
              iconLib="Ionicons"
              onPress={() => handleCardPress("รายรับ-รายจ่าย")}
              theme={theme}
            />
            <StatCard
              icon="receipt-outline"
              title={t("receiptCount")}
              value={stats.count.toString()}
              iconLib="Ionicons"
              onPress={() => handleCardPress("รายการทั้งหมด")}
              theme={theme}
            />
            <StatCard
              icon="trending-up"
              title={t("average")}
              value={formatCurrency(stats.average)}
              iconLib="Ionicons"
              onPress={() => {}}
              theme={theme}
            />
            <StatCard
              icon="comment-processing-outline"
              title={t("topCategory")}
              value={stats.topCategory}
              iconLib="MaterialCommunityIcons"
              onPress={() => handleCardPress(stats.topCategory)}
              theme={theme}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.chartCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
            activeOpacity={0.9}
          >
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t("monthlyExpense")} (6 เดือนล่าสุด)
            </Text>
            <LineChart
              data={chartData}
              width={screenWidth - 60}
              height={180}
              bezier
              chartConfig={{
                backgroundColor: theme.card,
                backgroundGradientFrom: theme.card,
                backgroundGradientTo: theme.card,
                decimalPlaces: 0,
                color: (opacity = 1) => theme.primary,
                labelColor: (opacity = 1) => theme.textSec,
                propsForDots: {
                  r: "4",
                  strokeWidth: "2",
                  stroke: theme.primary,
                },
              }}
              style={{ marginTop: 10, alignSelf: "center" }}
            />
          </TouchableOpacity>

          <View
            style={[
              styles.listSection,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            {/* ✅ จุดแก้ไขสำคัญ: เปลี่ยนพารามิเตอร์เป็น "Top Spends" ให้ตรงกับ ReceiptListScreen */}
            <TouchableOpacity
              style={[styles.listHeader, { borderBottomColor: theme.border }]}
              onPress={() =>
                navigation.navigate("ReceiptList", {
                  categoryTitle: "Top Spends",
                })
              }
            >
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {t("topReceipts")}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={{ fontSize: 12, color: theme.textSec, marginRight: 5 }}
                >
                  {t("viewAll")}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={theme.text} />
              </View>
            </TouchableOpacity>

            {topReceipts.length > 0 ? (
              topReceipts.map((item) => (
                <ReceiptItem
                  key={item.id}
                  icon="receipt-outline"
                  store={item.shopName || "ไม่ระบุร้าน"}
                  price={formatCurrency(item.total)}
                  bgIcon={theme.background}
                  iconColor={theme.primary}
                  onPress={() =>
                    navigation.navigate("ReceiptDetail", { receiptData: item })
                  }
                  theme={theme}
                />
              ))
            ) : (
              <Text
                style={{
                  textAlign: "center",
                  padding: 20,
                  color: theme.textSec,
                }}
              >
                ไม่มีข้อมูล
              </Text>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// Sub-Components (StatCard, ReceiptItem และ styles คงเดิม)
const StatCard = ({ icon, title, value, iconLib, onPress, theme }) => (
  <TouchableOpacity
    style={[
      styles.card,
      { backgroundColor: theme.card, borderColor: theme.border },
    ]}
    onPress={onPress}
  >
    <View style={styles.iconBox}>
      {iconLib === "MaterialCommunityIcons" ? (
        <MaterialCommunityIcons name={icon} size={20} color={theme.primary} />
      ) : (
        <Ionicons name={icon} size={20} color={theme.primary} />
      )}
      <Text style={[styles.cardTitle, { color: theme.textSec }]}>{title}</Text>
    </View>
    <Text style={[styles.cardValue, { color: theme.text }]}>{value}</Text>
  </TouchableOpacity>
);

const ReceiptItem = ({
  icon,
  store,
  price,
  bgIcon,
  iconColor,
  onPress,
  theme,
}) => (
  <TouchableOpacity
    style={[styles.listItem, { borderBottomColor: theme.border }]}
    onPress={onPress}
  >
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <View style={[styles.listIconBox, { backgroundColor: bgIcon }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={[styles.storeName, { color: theme.text }]}>{store}</Text>
    </View>
    <Text style={[styles.priceText, { color: theme.text }]}>{price}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    marginTop: 30,
    borderBottomWidth: 1,
    paddingHorizontal: 20,
  },
  headerLogo: { flexDirection: "row", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  tilde: { fontSize: 20, fontWeight: "bold" },
  pageTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 10,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  card: {
    width: "48%",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    marginBottom: 12,
  },
  iconBox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  cardTitle: { fontSize: 12 },
  cardValue: { fontSize: 16, fontWeight: "bold" },
  chartCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  listSection: {
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    padding: 5,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
  },
  listIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  storeName: { fontSize: 14, fontWeight: "bold" },
  priceText: { fontSize: 14, fontWeight: "bold" },
});
