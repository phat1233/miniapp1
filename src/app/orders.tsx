import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { Badge, Button, Card, Text } from 'react-native-paper';
import { io } from 'socket.io-client';

// ⚠️ Thay bằng địa chỉ IP máy tính của bạn
const SOCKET_URL = 'http://172.20.10.2:3000';
const BASE_URL = `${SOCKET_URL}/api`;

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Hàm tải danh sách đơn hàng & kiểm tra đăng nhập
  const fetchUserOrders = async () => {
    try {
      const userInfoStr = await AsyncStorage.getItem('userInfo');
      const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;

      if (!userInfo) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để xem đơn hàng!');
        router.replace('/login');
        return;
      }

      const response = await fetch(`${BASE_URL}/orders/user/${userInfo.id}`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách đơn hàng:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dùng useFocusEffect để mỗi khi vuốt quay lại trang này, app sẽ kiểm tra lại đăng nhập ngay lập tức
  useFocusEffect(
    useCallback(() => {
      fetchUserOrders();
    }, [])
  );

  // Thiết lập Socket.io thời gian thực
  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on('order_status_updated', (data) => {
      fetchUserOrders();
    });

    return () => {
      socket.off('order_status_updated');
      socket.disconnect();
    };
  }, []);

  const renderItem = ({ item }: { item: any }) => {
    const isCompleted = item.status === 'Hoàn thành' || item.status === 'Đã giao';
    const isShipping = item.status === 'Đang vận chuyển' || item.status === 'shipping';

    return (
      <Card style={styles.card} mode="outlined">
        <Card.Content>
          <View style={styles.rowBetween}>
            <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#6200ee' }}>
              Mã đơn: #{item.orderId}
            </Text>
            <Badge 
              style={{ 
                backgroundColor: isCompleted ? '#4CAF50' : isShipping ? '#FF9800' : '#2196F3',
                color: '#fff',
                fontWeight: 'bold'
              }}
            >
              {item.status}
            </Badge>
          </View>

          <Text variant="bodySmall" style={{ color: '#666', marginTop: 4 }}>
            🕒 Thời gian: {item.createdAt}
          </Text>
          <Text variant="bodyMedium" style={{ marginTop: 6 }}>
            📍 Địa chỉ: {item.address}
          </Text>
          <Text variant="bodyMedium" style={{ marginTop: 2 }}>
            💳 Thanh toán: {item.paymentMethod === 'cash' ? 'Tiền mặt (COD)' : 'Chuyển khoản'}
          </Text>

          <View style={{ marginTop: 8, borderTopWidth: 0.5, borderColor: '#eee', paddingTop: 8 }}>
            <Text variant="titleSmall" style={{ fontWeight: 'bold', marginBottom: 4 }}>Sản phẩm:</Text>
            {item.items?.map((prod: any, idx: number) => (
              <View key={idx} style={styles.productRow}>
                <Text variant="bodyMedium">{prod.name} (x{prod.quantity})</Text>
                <Text variant="bodyMedium" style={{ color: '#6200ee' }}>
                  {(prod.price * prod.quantity).toLocaleString('vi-VN')} đ
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.rowBetween, { marginTop: 12, borderTopWidth: 1, borderColor: '#f0f0f0', paddingTop: 8 }]}>
            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Tổng thanh toán:</Text>
            <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#6200ee' }}>
              {item.totalPrice.toLocaleString('vi-VN')} đ
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Dùng router.navigate để tránh lặp trang */}
        <Button icon="arrow-left" onPress={() => router.navigate('/')}>Về Trang Chủ</Button>
        <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Đơn Hàng Của Tôi</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item._id || item.orderId}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge" style={{ color: '#888' }}>Bạn chưa có đơn hàng nào!</Text>
              <Button mode="contained" buttonColor="#6200ee" onPress={() => router.navigate('/')} style={{ marginTop: 16 }}>
                Mua sắm ngay
              </Button>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f6f6', paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: '8@ms' as any, elevation: 2 },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
});