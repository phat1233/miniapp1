import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Badge, Button, Card, FAB, Text } from 'react-native-paper';
import { Product, useCart } from '../context/CartContext';

// ⚠️ Thay bằng IPv4 của máy tính bạn
const BASE_URL = 'http:/172.20.10.2:3000/api'; 

export default function HomeScreen() {
  const router = useRouter();
  const { addToCart, totalItems } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  // 1. Kiểm tra Đăng nhập & Lấy danh sách sản phẩm từ Server
  const loadData = async () => {
    try {
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (!userInfo) {
        router.replace('/login'); // Nếu chưa đăng nhập thì đẩy ra màn hình Login
        return;
      }
      setUserName(JSON.parse(userInfo).name);

      // Gọi API lấy dữ liệu thực tế từ Node.js
      const res = await fetch(`${BASE_URL}/products`);
      const data = await res.json();
      setProducts(data);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể lấy dữ liệu từ Server!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

const handleLogout = async () => {
  try {
    // 1. Xóa thông tin đăng nhập trong máy
    await AsyncStorage.removeItem('userInfo');
    
    // 2. Xóa sạch toàn bộ lịch sử stack và chuyển hướng về trang đăng nhập
    router.dismissAll();
    router.replace('/login');
  } catch (error) {
    console.error('Lỗi khi đăng xuất:', error);
  }
};

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleMedium">👋 Chào, {userName}</Text>
        <Button mode="text" onPress={handleLogout} textColor="#B00020">
          Đăng xuất
        </Button>
  <View style={{ flexDirection: 'row' }}>
    <Button mode="text" onPress={() => router.push('/orders')}>
      📋 Đơn hàng
    </Button>
  </View>
      </View>

      <Text variant="headlineMedium" style={styles.headerTitle}>
        🍔 Food Delivery
      </Text>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.productCard} mode="elevated">
            <Card.Cover source={{ uri: item.image }} style={styles.cardImage} />
            <Card.Content style={styles.cardContent}>
              <Text variant="titleMedium" numberOfLines={1}>
                {item.name}
              </Text>
              <Text variant="titleSmall" style={styles.priceText}>
                {item.price.toLocaleString('vi-VN')} đ
              </Text>
            </Card.Content>
            <Card.Actions>
              <Button mode="contained-tonal" compact onPress={() => addToCart(item)}>
                + Thêm
              </Button>
            </Card.Actions>
          </Card>
        )}
      />

      <View style={styles.fabContainer}>
        <FAB icon="cart" label="Giỏ hàng" style={styles.fab} onPress={() => router.push('/cart')} />
        {totalItems > 0 && (
          <Badge style={styles.badge} size={24}>
            {totalItems}
          </Badge>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f6f6', paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, alignItems: 'center' },
  headerTitle: { fontWeight: 'bold', paddingHorizontal: 16, marginVertical: 8 },
  list: { paddingHorizontal: 8, paddingBottom: 100 },
  productCard: { flex: 1, margin: 8, borderRadius: 12 },
  cardImage: { height: 120 },
  cardContent: { marginTop: 8 },
  priceText: { color: '#6200ee', fontWeight: 'bold', marginTop: 4 },
  fabContainer: { position: 'absolute', right: 16, bottom: 20 },
  fab: { backgroundColor: '#6200ee' },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#FF3B30' },
});