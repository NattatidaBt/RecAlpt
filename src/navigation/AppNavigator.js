import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Platform } from "react-native";

// Import หน้าจอทั้งหมด
import EditProfileScreen from "../screens/EditProfileScreen"; // ✅ 1. เพิ่มการ Import หน้านี้
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import ReceiptDetailScreen from "../screens/ReceiptDetailScreen";
import ReceiptListScreen from "../screens/ReceiptListScreen";
import RegisterScreen from "../screens/RegisterScreen";
import SettingsScreen from "../screens/SettingsScreen";
import StatsScreen from "../screens/StatsScreen";
import VerificationScreen from "../screens/VerificationScreen";
import WelcomeScreen from "../screens/WelcomeScreen";

// Import Context
import { useTheme } from "../context/ThemeContext";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// เมนูด้านล่าง (4 ปุ่ม)
function MainTabNavigator() {
  const { theme, t } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSec,
        tabBarStyle: {
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
          backgroundColor: theme.card,
          borderTopColor: theme.border,
        },
        tabBarLabelStyle: {
          fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
          fontSize: 12,
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;
          if (focused) {
            if (route.name === "Home") iconName = "home";
            else if (route.name === "Form") iconName = "document-text";
            else if (route.name === "Stats") iconName = "bar-chart";
            else if (route.name === "Settings") iconName = "settings";
          } else {
            if (route.name === "Home") iconName = "home-outline";
            else if (route.name === "Form") iconName = "document-text-outline";
            else if (route.name === "Stats") iconName = "bar-chart-outline";
            else if (route.name === "Settings") iconName = "settings-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: t("home") }}
      />

      <Tab.Screen
        name="Form"
        component={VerificationScreen}
        options={{ tabBarLabel: t("form") }}
      />

      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{ tabBarLabel: t("stats") }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: t("settings") }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isDark } = useTheme();

  const navigationTheme = isDark ? DarkTheme : DefaultTheme;

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />

        <Stack.Screen name="MainApp" component={MainTabNavigator} />

        <Stack.Screen name="ReceiptDetail" component={ReceiptDetailScreen} />

        {/* ✅ 2. เพิ่มหน้า EditProfile ลงใน Stack เพื่อให้ navigate มาได้ */}
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />

        <Stack.Screen name="Verification" component={VerificationScreen} />

        <Stack.Screen name="ReceiptList" component={ReceiptListScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
