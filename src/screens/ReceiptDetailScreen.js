import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

// --- Import Firebase (สำหรับลบข้อมูลจริง) ---
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../config/firebase";

export default function ReceiptDetailScreen({ navigation, route }) {
  const { theme, t } = useTheme();

  // 1. รับข้อมูลจากหน้าก่อนหน้า (ถ้ามี)
  const { receiptData } = route.params || {};

  // 2. ข้อมูลจำลอง (Mock Data)
  const mockData = {
    id: "MOCK-001",
    shopName: "ร้านน้องดรีม",
    shopAddress: "25 ม.7 ต.หมากฝรั่ง อ.กยู จ.ต้นหอม",
    phone: "025-080-2016",
    taxId: "2232361322525",
    customerName: "มาร์ค ลี",
    customerAddress: "2 ม.7 ต.พริกหยวก อ.ซีตาร์ จ.แคนาดา",
    customerPhone: "060-228-1999",
    customerTaxId: "-",
    receiptNo: "01270",
    refNo: "0180706060",
    date: new Date("2026-08-25"),
    category: "ใบกำกับภาษีอย่างย่อ",
    items: [
      { name: "แท่งไฟ nct v.2", qty: 2, unit: "แท่ง", price: 2100 },
      { name: "เสื้อ md", qty: 1, unit: "ตัว", price: 690 },
    ],
    total: 5232.3,
  };

  // 3. เลือกข้อมูลที่จะแสดง
  const finalData = receiptData || mockData;
  const isMock = !receiptData; // ตัวเช็คว่าเป็นข้อมูลจำลองหรือไม่

  // ฟังก์ชันแปลงวันที่
  const formattedDate =
    finalData.date && finalData.date.toDate
      ? finalData.date.toDate().toLocaleDateString("th-TH")
      : finalData.date instanceof Date
        ? finalData.date.toLocaleDateString("th-TH")
        : "25/08/2569";

  // คำนวณ VAT
  const vatAmount = (finalData.total * 7) / 107;
  const priceBeforeVat = finalData.total - vatAmount;

  // --- ฟังก์ชันการทำงาน ---
  const handleCopy = async () => {
    await Clipboard.setStringAsync(finalData.receiptNo || finalData.id);
    Alert.alert(t("done"), "คัดลอกเลขที่ใบเสร็จเรียบร้อยแล้ว");
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `ใบเสร็จ ${finalData.shopName} ยอดรวม ${finalData.total.toFixed(
          2,
        )} บาท (Ref: ${finalData.refNo || "-"})`,
      });
      if (result.action === Share.sharedAction) {
        // Shared
      }
    } catch (error) {
      Alert.alert(error.message);
    }
  };

  const handleExport = async () => {
    const itemsHtml = (finalData.items || [])
      .map(
        (item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${item.name}</td>
        <td>${item.qty}</td>
        <td>${item.price}</td>
        <td>${(item.qty * item.price).toFixed(2)}</td>
      </tr>
    `,
      )
      .join("");

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 20px; }
            h1 { text-align: center; color: #D81B60; }
            .section { margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .label { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            th { background-color: #f2f2f2; }
            .total { margin-top: 20px; text-align: right; font-size: 18px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>${finalData.category || "ใบเสร็จรับเงิน"} (RecAlpt)</h1>
          <div class="section">
            <div class="row"><span class="label">ร้านค้า:</span> <span>${
              finalData.shopName
            }</span></div>
            <div class="row"><span class="label">ที่อยู่:</span> <span>${
              finalData.shopAddress || "-"
            }</span></div>
            <div class="row"><span class="label">โทร:</span> <span>${
              finalData.phone || "-"
            }</span></div>
            <div class="row"><span class="label">เลขผู้เสียภาษี:</span> <span>${
              finalData.taxId || "-"
            }</span></div>
          </div>
          <div class="section">
            <div class="row"><span class="label">เลขที่ใบเสร็จ:</span> <span>${
              finalData.receiptNo || "-"
            }</span></div>
            <div class="row"><span class="label">วันที่:</span> <span>${formattedDate}</span></div>
          </div>
          <table>
            <tr><th>ลำดับ</th><th>รายการ</th><th>จำนวน</th><th>ราคา/หน่วย</th><th>รวม</th></tr>
            ${itemsHtml}
          </table>
          <div class="total">รวมสุทธิ: ${finalData.total.toFixed(2)} บาท</div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
      });
    } catch (_error) {
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถสร้างไฟล์ PDF ได้");
    }
  };

  // --- จุดที่แก้ไข: เปลี่ยนจาก Alert เป็น Navigate ---
  const handleEdit = () => {
    if (isMock) {
      Alert.alert("แจ้งเตือน", "ข้อมูลตัวอย่างไม่สามารถแก้ไขได้");
    } else {
      // ส่งข้อมูลกลับไปหน้า Verification เพื่อแก้ไข
      navigation.navigate("Verification", {
        mode: "edit",
        receiptData: finalData,
      });
    }
  };

  const handleDelete = () => {
    if (isMock) {
      Alert.alert("ลบข้อมูล", "นี่เป็นข้อมูลตัวอย่าง ไม่ได้ถูกบันทึกจริง", [
        { text: "ตกลง", onPress: () => navigation.goBack() },
      ]);
      return;
    }

    Alert.alert(
      t("delete"),
      "คุณแน่ใจหรือไม่ว่าต้องการลบใบเสร็จนี้? การกระทำนี้ไม่สามารถย้อนกลับได้",
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "receipts", finalData.id));
              navigation.goBack();
            } catch (err) {
              console.log(err);
              Alert.alert("Error", "ลบข้อมูลไม่สำเร็จ");
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* --- Header Bar --- */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitleText, { color: theme.text }]}>
          {t("receiptDetail")}
        </Text>

        <TouchableOpacity onPress={() => navigation.popToTop()}>
          <Text
            style={{ color: theme.primary, fontWeight: "bold", fontSize: 16 }}
          >
            {t("done")}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Row */}
        <View style={styles.titleRow}>
          <Text style={[styles.pageTitle, { color: theme.text }]}>
            {finalData.category || "รายละเอียดใบเสร็จ"}
          </Text>
          <View style={styles.titleIcons}>
            <TouchableOpacity style={{ marginRight: 15 }} onPress={handleEdit}>
              <Ionicons name="create-outline" size={24} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete}>
              <Ionicons name="trash-outline" size={24} color="#D32F2F" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          {/* 1. ข้อมูลผู้ขาย */}
          <View style={styles.section}>
            <InfoRow
              label="ชื่อร้าน / บริษัท :"
              value={finalData.shopName}
              theme={theme}
            />
            <InfoRow
              label="ที่อยู่ร้าน / บริษัท :"
              value={finalData.shopAddress || "-"}
              theme={theme}
            />
            <InfoRow
              label="เบอร์โทรศัพท์ :"
              value={finalData.phone || finalData.shopPhone || "-"}
              theme={theme}
            />
            <InfoRow
              label="เลขประจำตัวผู้เสียภาษี :"
              value={finalData.taxId || finalData.shopTaxId || "-"}
              theme={theme}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* 2. ข้อมูลลูกค้า */}
          <View style={styles.section}>
            <InfoRow
              label="ชื่อลูกค้า / บริษัทลูกค้า :"
              value={finalData.customerName || "-"}
              theme={theme}
            />
            <InfoRow
              label="ที่อยู่ลูกค้า :"
              value={finalData.customerAddress || "-"}
              theme={theme}
            />
            <InfoRow
              label="เบอร์โทรศัพท์ :"
              value={finalData.customerPhone || "-"}
              theme={theme}
            />
            <InfoRow
              label="เลขประจำตัวผู้เสียภาษีลูกค้า :"
              value={finalData.customerTaxId || "-"}
              theme={theme}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* 3. ข้อมูลใบเสร็จ */}
          <View style={styles.section}>
            <InfoRow
              label="เลขที่ใบเสร็จ :"
              value={finalData.receiptNo || "-"}
              theme={theme}
            />
            <InfoRow
              label="หมายเลขอ้างอิง :"
              value={finalData.refNo || "-"}
              theme={theme}
            />
            <InfoRow label="วันที่ออก :" value={formattedDate} theme={theme} />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* 4. รายการสินค้า (Dynamic Table) */}
          <Text style={[styles.sectionHeader, { color: theme.text }]}>
            {t("itemsInfo")}
          </Text>
          <View style={styles.tableHead}>
            <Text style={[styles.th, { flex: 0.5, color: theme.textSec }]}>
              ลำดับ
            </Text>
            <Text style={[styles.th, { flex: 2, color: theme.textSec }]}>
              รายการสินค้า/บริการ
            </Text>
            <Text style={[styles.th, { flex: 0.8, color: theme.textSec }]}>
              จำนวน
            </Text>
            <Text style={[styles.th, { flex: 0.8, color: theme.textSec }]}>
              หน่วย
            </Text>
            <Text style={[styles.th, { flex: 1, color: theme.textSec }]}>
              ราคา/หน่วย
            </Text>
            <Text style={[styles.th, { flex: 1, color: theme.textSec }]}>
              รวม
            </Text>
          </View>

          {/* Loop items */}
          {finalData.items && finalData.items.length > 0 ? (
            finalData.items.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <TableBox
                  flex={0.5}
                  text={(index + 1).toString()}
                  theme={theme}
                />
                <TableBox flex={2} text={item.name} theme={theme} />
                <TableBox flex={0.8} text={item.qty.toString()} theme={theme} />
                <TableBox flex={0.8} text={item.unit || "-"} theme={theme} />
                <TableBox flex={1} text={item.price.toString()} theme={theme} />
                <TableBox
                  flex={1}
                  text={(item.qty * item.price).toFixed(2)}
                  theme={theme}
                />
              </View>
            ))
          ) : (
            <Text
              style={{
                textAlign: "center",
                color: theme.textSec,
                marginVertical: 10,
              }}
            >
              ไม่มีรายการสินค้า
            </Text>
          )}

          {/* 5. Summary Box */}
          <View style={[styles.summaryBox, { backgroundColor: theme.border }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.text }]}>
                ราคารวม (ก่อน VAT) :
              </Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                {priceBeforeVat.toFixed(2)} บาท
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.text }]}>
                ภาษีมูลค่าเพิ่ม VAT 7% :
              </Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                {vatAmount.toFixed(2)} บาท
              </Text>
            </View>
            <View style={[styles.summaryRow, { marginTop: 5 }]}>
              <Text
                style={[
                  styles.summaryLabel,
                  { fontWeight: "bold", color: theme.text },
                ]}
              >
                {t("netTotal")} :
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  { fontWeight: "bold", color: theme.text },
                ]}
              >
                {finalData.total.toFixed(2)} บาท
              </Text>
            </View>
          </View>
        </View>

        {/* Footer Actions */}
        <View style={styles.footerActions}>
          <TouchableOpacity
            style={[styles.iconBtn, { borderColor: theme.border }]}
            onPress={handleCopy}
          >
            <Ionicons name="copy-outline" size={24} color={theme.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconBtn, { borderColor: theme.border }]}
            onPress={handleShare}
          >
            <Ionicons
              name="share-social-outline"
              size={24}
              color={theme.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.exportBtn,
              { backgroundColor: theme.primary + "33" },
            ]}
            onPress={handleExport}
          >
            <Ionicons
              name="download-outline"
              size={20}
              color={theme.primary}
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.exportText, { color: theme.primary }]}>
              {t("export")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// --- Component ย่อย ---
const InfoRow = ({ label, value, theme }) => (
  <View style={{ flexDirection: "row", marginBottom: 6 }}>
    <Text style={[styles.infoLabel, { color: theme.text }]}>{label}</Text>
    <Text style={[styles.infoValue, { color: theme.textSec }]}> {value}</Text>
  </View>
);

const TableBox = ({ flex, text, theme }) => (
  <View style={[styles.tdBox, { flex, borderColor: theme.border }]}>
    <Text style={[styles.tdText, { color: theme.text }]} numberOfLines={1}>
      {text}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
  },
  headerTitleText: { fontSize: 18, fontWeight: "bold" },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  pageTitle: { fontSize: 18, fontWeight: "bold" },
  titleIcons: { flexDirection: "row" },
  card: {
    margin: 20,
    marginTop: 5,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  section: { marginBottom: 10 },
  divider: { height: 1, marginVertical: 10 },
  infoLabel: { fontSize: 13, fontWeight: "bold", width: 140 },
  infoValue: { fontSize: 13, flex: 1 },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 5,
  },
  tableHead: { flexDirection: "row", gap: 5, marginBottom: 5 },
  th: { fontSize: 10, textAlign: "center" },
  tableRow: { flexDirection: "row", gap: 5, marginBottom: 5 },
  tdBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 5,
    justifyContent: "center",
    height: 35,
  },
  tdText: { fontSize: 11, textAlign: "center" },
  summaryBox: { borderRadius: 10, padding: 15, marginTop: 15 },
  summaryRow: {
    flexDirection: "row",
    marginBottom: 5,
    justifyContent: "space-between",
  },
  summaryLabel: { fontSize: 13 },
  summaryValue: { fontSize: 13 },
  footerActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 20,
  },
  iconBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  exportBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  exportText: { fontWeight: "bold", fontSize: 16 },
});
