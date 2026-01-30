import axios from 'axios';

// แก้ไข IP เป็น 192.168.1.46 (ตามผล ipconfig ของคุณ)
// หมายเหตุ: เช็คเลขพอร์ตหลัง : ด้วยนะครับ 
// - ถ้า Backend เป็น Node.js มักใช้ :3000 
// - ถ้า Backend เป็น Django มักใช้ :8000
const API_URL = 'http://192.168.1.46:3000/api'; 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;