import { createContext, useContext, useState } from "react";
// Import ไฟล์คำแปล (ต้องมั่นใจว่าไฟล์นี้อยู่ใน src/constants/translations.js)
import { translations } from "../constants/translations";
// Import สีหลัก
import colors from "../constants/colors";

// 1. สร้าง Context
export const ThemeContext = createContext();

// 2. สร้าง Provider (ตัวคลุมแอปเพื่อส่งข้อมูล)
export const ThemeProvider = ({ children }) => {
  // State สำหรับเก็บสถานะธีม (false = Light Mode, true = Dark Mode)
  const [isDark, setIsDark] = useState(false);

  // State สำหรับเก็บภาษา ('th' หรือ 'en')
  const [language, setLanguage] = useState("th");

  // กำหนดชุดสีตามโหมด (สว่าง/มืด)
  const theme = {
    isDark, // ส่งค่า boolean ไปด้วยเผื่อใช้กับ Switch
    background: isDark ? "#121212" : "#FAFAFA", // สีพื้นหลัง
    card: isDark ? "#1E1E1E" : "#FFFFFF", // สีการ์ด/กล่อง
    text: isDark ? "#FFFFFF" : "#333333", // สีตัวหนังสือหลัก
    textSec: isDark ? "#AAAAAA" : "#888888", // สีตัวหนังสือรอง
    border: isDark ? "#333333" : "#F0F0F0", // สีเส้นขอบ
    primary: colors.primary, // สีหลัก (ชมพู) คงเดิม
    icon: isDark ? "#FFFFFF" : "#333333", // สีไอคอน
  };

  // ฟังก์ชันสำหรับแปลภาษา (รับ key เข้ามา คืนค่าคำแปลกลับไป)
  const t = (key) => {
    // กัน error กรณีหา key ไม่เจอ ให้คืนค่า key กลับไปตรงๆ
    if (!translations[language] || !translations[language][key]) {
      return key;
    }
    return translations[language][key];
  };

  // ส่งค่าทั้งหมดผ่าน Provider
  return (
    <ThemeContext.Provider
      value={{ isDark, setIsDark, language, setLanguage, theme, t }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// 3. สร้าง Hook เพื่อให้หน้าอื่นเรียกใช้ได้ง่ายๆ (import { useTheme } ...)
export const useTheme = () => useContext(ThemeContext);
