import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';

// ⚠️ Thay bằng IPv4 của máy bạn (ví dụ: http://192.168.1.15:3000/api)
const BASE_URL = 'http://192.168.1.122:3000/api'; 

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password || (mode === 'register' && !name)) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === 'login' ? `${BASE_URL}/login` : `${BASE_URL}/register`;
      const payload = mode === 'login' ? { email, password } : { name, email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (mode === 'register') {
          Alert.alert('Thành công', 'Đăng ký thành công! Hãy đăng nhập ngay.');
          setMode('login');
        } else {
          await AsyncStorage.setItem('userToken', data.token);
          await AsyncStorage.setItem('userInfo', JSON.stringify(data.user));
          Alert.alert('Thành công', `Chào mừng ${data.user.name}!`);
          router.replace('/');
        }
      } else {
        Alert.alert('Thất bại', data.message || 'Có lỗi xảy ra!');
      }
    } catch (error) {
      Alert.alert('Lỗi kết nối', 'Không thể kết nối tới Server Node.js!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="headlineMedium" style={styles.title}>
            {mode === 'login' ? '🔐 Đăng Nhập' : '📝 Đăng Ký'}
          </Text>

          {/* Chuyển chế độ Đăng nhập / Đăng ký bằng 2 nút bấm đơn giản */}
          <View style={styles.tabRow}>
            <Button
              mode={mode === 'login' ? 'contained' : 'outlined'}
              onPress={() => setMode('login')}
              style={{ flex: 1, marginRight: 4 }}
            >
              Đăng nhập
            </Button>
            <Button
              mode={mode === 'register' ? 'contained' : 'outlined'}
              onPress={() => setMode('register')}
              style={{ flex: 1, marginLeft: 4 }}
            >
              Đăng ký
            </Button>
          </View>

          {mode === 'register' && (
            <TextInput
              label="Họ và tên"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
            />
          )}

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            mode="outlined"
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            {mode === 'login' ? 'Đăng Nhập' : 'Đăng Ký Tài Khoản'}
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f6f6f6' },
  card: { borderRadius: 16, backgroundColor: '#fff', paddingVertical: 10 },
  title: { textAlign: 'center', fontWeight: 'bold', marginBottom: 20, color: '#6200ee' },
  tabRow: { flexDirection: 'row', marginBottom: 20 },
  input: { marginBottom: 12 },
  button: { marginTop: 10, paddingVertical: 6, backgroundColor: '#6200ee' },
});