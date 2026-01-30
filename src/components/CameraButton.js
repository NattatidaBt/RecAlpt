import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import colors from '../constants/colors';

export default function CameraButton({ onPress }) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>📷 ถ่ายรูปใบเสร็จ</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginVertical: 20,
    elevation: 5, // เงาบน Android
    shadowColor: '#000', // เงาบน iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
  },
  text: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});