import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

// --- Import Firebase ---
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

export default function VerificationScreen({ navigation, route }) {
  const { theme, t } = useTheme();

  // รับค่า Params จาก Navigation
  const { mode, receiptData } = route.params || {};
  const isEditMode = mode === "edit";

  // --- State ทั้งหมด ---
  const [loading, setLoading] = useState(false);
  const [isReceiptTypeOpen, setReceiptTypeOpen] = useState(false);
  const [selectedReceiptType, setSelectedReceiptType] = useState("");

  const [shopName, setShopName] = useState("");
  const [shopBranch, setShopBranch] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [shopTaxId, setShopTaxId] = useState("");
  const [isVatRegistered, setIsVatRegistered] = useState(true);

  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerTaxId, setCustomerTaxId] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [receiptNo, setReceiptNo] = useState("");
  const [refNo, setRefNo] = useState("");

  const [totalPrice, setTotalPrice] = useState("");
  const [discountTotal, setDiscountTotal] = useState("");
  const [serviceCharge, setServiceCharge] = useState("");
  const [shippingFee, setShippingFee] = useState("");
  const [vatAmount, setVatAmount] = useState("");
  const [netTotal, setNetTotal] = useState("");

  const [date, setDate] = useState(new Date());
  const [isDateSelected, setIsDateSelected] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const [items, setItems] = useState([
    { name: "", qty: "", unit: "", price: "" },
  ]);

  // ✅ 1. รีเซ็ตค่าเมื่อออกจากหน้า
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (!isEditMode) {
          setIsDateSelected(false);
          setDate(new Date());
        }
      };
    }, [isEditMode]),
  );

  // ✅ 2. หยอดข้อมูลให้ครอบคลุม (ปรับปรุงให้ขุดข้อมูลได้ลึกขึ้น)
  useEffect(() => {
    if (receiptData) {
      console.log("Receiving Data:", receiptData);

      // ฟังก์ชันช่วยดึงค่ากรณีข้อมูลซ้อนกัน
      const getValue = (primary, secondary, third) =>
        primary || secondary || third || "";

      setShopName(
        getValue(receiptData.shopName, receiptData.store, receiptData.seller),
      );
      setShopBranch(receiptData.shopBranch || "");
      setShopAddress(
        getValue(receiptData.shopAddress, receiptData.address, ""),
      );
      setShopPhone(getValue(receiptData.shopPhone, receiptData.phone, ""));
      setShopTaxId(
        getValue(
          receiptData.shopTaxId,
          receiptData.taxId,
          receiptData.sellerTaxId,
        ),
      );
      setIsVatRegistered(receiptData.isVatRegistered ?? true);

      setCustomerName(receiptData.customerName || "");
      setCustomerAddress(receiptData.customerAddress || "");
      setCustomerTaxId(receiptData.customerTaxId || "");
      setCustomerPhone(receiptData.customerPhone || "");

      setReceiptNo(getValue(receiptData.receiptNo, receiptData.no, ""));
      setRefNo(getValue(receiptData.refNo, receiptData.reference, ""));

      if (receiptData.category) setSelectedReceiptType(receiptData.category);

      // วันที่
      if (receiptData.date) {
        setIsDateSelected(true);
        const d = receiptData.date.toDate
          ? receiptData.date.toDate()
          : new Date(receiptData.date);
        if (!isNaN(d.getTime())) setDate(d);
      }

      // รายการสินค้า
      if (receiptData.items && Array.isArray(receiptData.items)) {
        setItems(
          receiptData.items.map((item) => ({
            name: item.name || "",
            qty: item.qty ? item.qty.toString() : "",
            unit: item.unit || "",
            price: item.price ? item.price.toString() : "",
          })),
        );
      }

      // ยอดเงิน (พยายามแปลงเป็น String ป้องกัน Error)
      const rawTotal =
        receiptData.total || receiptData.netTotal || receiptData.amount || 0;
      setTotalPrice(rawTotal.toString());
      setVatAmount(
        receiptData.vatAmount?.toString() || receiptData.vat?.toString() || "",
      );
      setNetTotal(rawTotal.toString());
    }
  }, [receiptData]);

  // ✅ 3. คำนวณราคารวมอัตโนมัติ (Trigger ทันทีที่ State เปลี่ยน)
  useEffect(() => {
    const sum = items.reduce((acc, item) => {
      const q = parseFloat(item.qty) || 0;
      const p = parseFloat(item.price) || 0;
      return acc + q * p;
    }, 0);

    if (sum >= 0) {
      // ยอมรับค่า 0 ได้
      setTotalPrice(sum.toFixed(2));
      const sCharge = parseFloat(serviceCharge) || 0;
      const sFee = parseFloat(shippingFee) || 0;
      const dTotal = parseFloat(discountTotal) || 0;
      setNetTotal((sum + sCharge + sFee - dTotal).toFixed(2));
    }
  }, [items, serviceCharge, shippingFee, discountTotal]);

  const showMode = () => {
    setTempDate(date);
    setShowDatePicker(true);
  };
  const onChangeDate = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (selectedDate) {
        setDate(selectedDate);
        setIsDateSelected(true);
      }
    } else if (selectedDate) {
      setTempDate(selectedDate);
    }
  };
  const confirmIOSDate = () => {
    setDate(tempDate);
    setIsDateSelected(true);
    setShowDatePicker(false);
  };

  const handleAddItem = () =>
    setItems([...items, { name: "", qty: "", unit: "", price: "" }]);
  const handleUpdateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };
  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(
      newItems.length > 0
        ? newItems
        : [{ name: "", qty: "", unit: "", price: "" }],
    );
  };

  const handleSave = async () => {
    if (
      !shopName ||
      !selectedReceiptType ||
      selectedReceiptType === "ประเภทใบเสร็จ"
    ) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกข้อมูลสำคัญและเลือกประเภทใบเสร็จ");
      return;
    }
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const dataToSave = {
          uid: user.uid,
          category: selectedReceiptType,
          date: date,
          shopName,
          shopBranch,
          shopAddress,
          shopPhone,
          shopTaxId,
          customerName,
          customerAddress,
          customerTaxId,
          customerPhone,
          receiptNo,
          refNo,
          items,
          total: parseFloat(netTotal.replace(/,/g, "")) || 0,
        };
        if (isEditMode) {
          await updateDoc(doc(db, "receipts", receiptData.id), dataToSave);
          Alert.alert("สำเร็จ", "แก้ไขข้อมูลเรียบร้อยแล้ว", [
            {
              text: "ตกลง",
              onPress: () => navigation.navigate("MainApp", { screen: "Home" }),
            },
          ]);
        } else {
          await addDoc(collection(db, "receipts"), dataToSave);
          Alert.alert("สำเร็จ", "บันทึกเรียบร้อย", [
            {
              text: "ตกลง",
              onPress: () => navigation.navigate("MainApp", { screen: "Home" }),
            },
          ]);
        }
      }
    } catch (e) {
      console.error("Save error:", e);
      Alert.alert("Error", "บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const receiptTypes = [
    "ใบเสร็จรับเงินทั่วไป",
    "ใบกำกับภาษีแบบเต็มรูป",
    "ใบกำกับภาษีอย่างย่อ",
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: theme.border, justifyContent: "center" },
        ]}
      >
        <View style={styles.headerLogo}>
          <Ionicons name="receipt-outline" size={20} color={theme.primary} />
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {" "}
            RecAlpt
          </Text>
          <Text style={[styles.tilde, { color: theme.primary }]}> ~</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Dropdown ประเภทใบเสร็จ */}
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={[
                styles.dropdownHeader,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  borderWidth: 1,
                },
              ]}
              onPress={() => setReceiptTypeOpen(!isReceiptTypeOpen)}
            >
              <Text
                style={{
                  color: selectedReceiptType ? theme.text : theme.textSec,
                }}
              >
                {selectedReceiptType || "ประเภทใบเสร็จ"}
              </Text>
              <Ionicons
                name={isReceiptTypeOpen ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme.text}
              />
            </TouchableOpacity>
            {isReceiptTypeOpen && (
              <View
                style={[
                  styles.dropdownList,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                {receiptTypes.map((type, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedReceiptType(type);
                      setReceiptTypeOpen(false);
                    }}
                  >
                    <Text style={{ color: theme.text }}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <Text style={[styles.sectionHeader, { color: theme.text }]}>
            ข้อมูลร้านค้า / ผู้ขาย
          </Text>
          <View style={styles.card}>
            <InputLabel
              label="ชื่อร้าน / บริษัท"
              value={shopName}
              onChangeText={setShopName}
              theme={theme}
            />
            <InputLabel
              label="ชื่อสาขา (ถ้ามี)"
              value={shopBranch}
              onChangeText={setShopBranch}
              theme={theme}
            />
            <InputLabel
              label="ที่อยู่ร้าน / บริษัท"
              value={shopAddress}
              onChangeText={setShopAddress}
              multiline
              theme={theme}
            />
            <InputLabel
              label="เบอร์โทรศัพท์"
              value={shopPhone}
              onChangeText={setShopPhone}
              theme={theme}
            />
            <InputLabel
              label="เลขประจำตัวผู้เสียภาษี"
              value={shopTaxId}
              onChangeText={setShopTaxId}
              theme={theme}
            />
          </View>

          <Text style={[styles.sectionHeader, { color: theme.text }]}>
            ข้อมูลลูกค้า
          </Text>
          <View style={styles.card}>
            <InputLabel
              label="ชื่อลูกค้า"
              value={customerName}
              onChangeText={setCustomerName}
              theme={theme}
            />
            <InputLabel
              label="ที่อยู่ลูกค้า"
              value={customerAddress}
              onChangeText={setCustomerAddress}
              multiline
              theme={theme}
            />
            <InputLabel
              label="เลขประจำตัวผู้เสียภาษีลูกค้า"
              value={customerTaxId}
              onChangeText={setCustomerTaxId}
              theme={theme}
            />
            <InputLabel
              label="เบอร์โทรศัพท์"
              value={customerPhone}
              onChangeText={setCustomerPhone}
              theme={theme}
            />
          </View>

          <Text style={[styles.sectionHeader, { color: theme.text }]}>
            ข้อมูลเอกสารใบเสร็จ
          </Text>
          <View style={styles.card}>
            <InputLabel
              label="เลขที่ใบเสร็จ"
              value={receiptNo}
              onChangeText={setReceiptNo}
              theme={theme}
            />
            <InputLabel
              label="หมายเลขอ้างอิง"
              value={refNo}
              onChangeText={setRefNo}
              theme={theme}
            />
            <Text
              style={{ fontSize: 12, color: theme.textSec, marginBottom: 5 }}
            >
              วันที่ออกเอกสาร
            </Text>
            <View style={styles.dateRow}>
              <TouchableOpacity style={{ flex: 1 }} onPress={showMode}>
                <DateBox
                  value={isDateSelected ? date.getDate().toString() : "วันที่"}
                  isPlaceholder={!isDateSelected}
                  theme={theme}
                />
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1 }} onPress={showMode}>
                <DateBox
                  value={
                    isDateSelected ? (date.getMonth() + 1).toString() : "เดือน"
                  }
                  isPlaceholder={!isDateSelected}
                  theme={theme}
                />
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1 }} onPress={showMode}>
                <DateBox
                  value={
                    isDateSelected
                      ? (date.getFullYear() + 543).toString()
                      : "ปี"
                  }
                  isPlaceholder={!isDateSelected}
                  theme={theme}
                />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.sectionHeader, { color: theme.text }]}>
            รายการสินค้า / บริการ
          </Text>
          <View style={styles.card}>
            <View style={styles.tableHead}>
              <Text style={[styles.th, { flex: 0.35 }]}>ลำดับ</Text>
              <Text style={[styles.th, { flex: 1.5, textAlign: "center" }]}>
                รายการสินค้า/บริการ
              </Text>
              <Text style={[styles.th, { flex: 0.6 }]}>จำนวน</Text>
              <Text style={[styles.th, { flex: 0.6 }]}>หน่วย</Text>
              <Text style={[styles.th, { flex: 0.9 }]}>ราคา/หน่วย</Text>
              <Text style={[styles.th, { flex: 0.9 }]}>รวม</Text>
            </View>
            {items.map((item, index) => {
              const lineTotal =
                (parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0);
              return (
                <View key={index} style={styles.tableRow}>
                  <TableInput
                    flex={0.35}
                    value={(index + 1).toString()}
                    textAlign="center"
                    editable={false}
                    theme={theme}
                  />
                  <TableInput
                    flex={1.5}
                    value={item.name}
                    onChangeText={(t) => handleUpdateItem(index, "name", t)}
                    theme={theme}
                  />
                  <TableInput
                    flex={0.6}
                    value={item.qty}
                    onChangeText={(t) => handleUpdateItem(index, "qty", t)}
                    textAlign="center"
                    theme={theme}
                  />
                  <TableInput
                    flex={0.6}
                    value={item.unit}
                    onChangeText={(t) => handleUpdateItem(index, "unit", t)}
                    textAlign="center"
                    theme={theme}
                  />
                  <TableInput
                    flex={0.9}
                    value={item.price}
                    onChangeText={(t) => handleUpdateItem(index, "price", t)}
                    textAlign="right"
                    theme={theme}
                  />
                  <View
                    style={{
                      flex: 0.9,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <TableInput
                      flex={1}
                      value={lineTotal > 0 ? lineTotal.toFixed(2) : "0.00"}
                      textAlign="right"
                      editable={false}
                      theme={theme}
                      style={{ fontWeight: "bold" }}
                    />
                    <TouchableOpacity
                      onPress={() => handleRemoveItem(index)}
                      style={{ marginLeft: 5 }}
                    >
                      <Ionicons name="trash-outline" size={16} color="red" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            <TouchableOpacity style={styles.addBtn} onPress={handleAddItem}>
              <Ionicons name="add" size={20} color={theme.textSec} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionHeader, { color: theme.text }]}>
            สรุปยอดรวม
          </Text>
          <View style={styles.card}>
            <SummaryRow
              label="ราคารวม"
              value={totalPrice}
              onChangeText={setTotalPrice}
              theme={theme}
            />
            <SummaryRow
              label="ส่วนลดรวมทั้งหมด"
              value={discountTotal}
              onChangeText={setDiscountTotal}
              theme={theme}
            />
            <SummaryRow
              label="ค่าจัดส่ง"
              value={shippingFee}
              onChangeText={setShippingFee}
              theme={theme}
            />
            <SummaryRow
              label="ภาษี VAT 7%"
              value={vatAmount}
              onChangeText={setVatAmount}
              theme={theme}
            />
            <SummaryRow
              label="รวมสุทธิ"
              value={netTotal}
              onChangeText={setNetTotal}
              theme={theme}
              isBold
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.primary }]}
            onPress={handleSave}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>บันทึกข้อมูล</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {showDatePicker &&
        (Platform.OS === "ios" ? (
          <Modal transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View
                style={[styles.modalContent, { backgroundColor: theme.card }]}
              >
                <View
                  style={[
                    styles.modalHeader,
                    { borderBottomColor: theme.border },
                  ]}
                >
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={{ color: theme.text }}>ยกเลิก</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={confirmIOSDate}>
                    <Text style={{ color: theme.primary, fontWeight: "bold" }}>
                      ตกลง
                    </Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={onChangeDate}
                  textColor={theme.text}
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onChangeDate}
          />
        ))}
    </View>
  );
}

// --- Sub-Components (InputLabel, DateBox, TableInput, SummaryRow คงเดิม)
const InputLabel = ({
  label,
  value,
  onChangeText,
  theme,
  multiline,
  keyboardType,
}) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={{ fontSize: 12, color: theme.textSec, marginBottom: 5 }}>
      {label}
    </Text>
    <TextInput
      style={[
        styles.input,
        {
          borderColor: theme.border,
          color: theme.text,
          backgroundColor: theme.card,
        },
        multiline && { height: 60 },
      ]}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      keyboardType={keyboardType}
    />
  </View>
);

const DateBox = ({ value, isPlaceholder, theme }) => (
  <View
    style={[
      styles.dateBox,
      { borderColor: theme.border, backgroundColor: theme.card },
    ]}
  >
    <Text
      style={{
        color: isPlaceholder ? theme.textSec : theme.text,
        fontSize: 13,
        fontWeight: "500",
      }}
    >
      {value}
    </Text>
    <Ionicons
      name="chevron-down"
      size={12}
      color={theme.textSec}
      style={{ marginLeft: 5 }}
    />
  </View>
);

const TableInput = ({
  flex,
  value,
  onChangeText,
  textAlign,
  theme,
  editable = true,
  style,
}) => (
  <TextInput
    style={[
      styles.td,
      {
        flex,
        borderColor: theme.border,
        color: theme.text,
        backgroundColor: editable ? theme.card : theme.background,
        textAlign: textAlign || "left",
      },
      style,
    ]}
    value={value}
    onChangeText={onChangeText}
    editable={editable}
  />
);

const SummaryRow = ({ label, value, onChangeText, theme, isBold }) => (
  <View style={styles.summaryRow}>
    <Text
      style={{
        flex: 1,
        color: theme.text,
        fontSize: 14,
        fontWeight: isBold ? "bold" : "normal",
      }}
    >
      {label}
    </Text>
    <TextInput
      style={[
        styles.summaryInput,
        {
          borderColor: theme.border,
          color: theme.text,
          backgroundColor: theme.card,
        },
      ]}
      value={value}
      onChangeText={onChangeText}
      keyboardType="decimal-pad"
      placeholder="0.00"
    />
    <Text style={{ marginLeft: 10, color: theme.text, fontSize: 12 }}>บาท</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginTop: 30,
    borderBottomWidth: 1,
  },
  headerLogo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  tilde: { fontSize: 20, fontWeight: "bold" },
  dropdownContainer: { margin: 20, zIndex: 10 },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    borderRadius: 10,
  },
  dropdownList: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    borderRadius: 10,
    borderWidth: 1,
    elevation: 5,
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  sectionHeader: {
    marginLeft: 20,
    marginBottom: 10,
    fontWeight: "bold",
    fontSize: 14,
  },
  card: { marginHorizontal: 20, marginBottom: 20 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10 },
  dateRow: { flexDirection: "row", gap: 10 },
  dateBox: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    height: 45,
  },
  tableHead: { flexDirection: "row", gap: 4, marginBottom: 5 },
  th: { fontSize: 10, textAlign: "center", color: "#888", fontWeight: "bold" },
  tableRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 5,
    alignItems: "center",
  },
  td: { borderWidth: 1, borderRadius: 5, padding: 5, fontSize: 11, height: 35 },
  addBtn: {
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: "dashed",
    borderColor: "#ccc",
  },
  summaryRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  summaryInput: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 5,
    width: 120,
    textAlign: "right",
  },
  saveButton: {
    margin: 20,
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
  },
  saveButtonText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "100%",
    paddingBottom: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
  },
});
