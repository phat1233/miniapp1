import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Chip, IconButton, Text } from 'react-native-paper';

// ⚠️ Thay bằng IPv4 máy tính của bạn
const BASE_URL = 'http://192.168.1.122:3000/api';

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const userInfoStr = await AsyncStorage.getItem('userInfo');
      if (!userInfoStr) return;
      const userInfo = JSON.parse(userInfoStr);

      const res = await fetch(`${BASE_URL}/orders`);
      const data = await res.json();

      // Lọc đơn hàng thuộc về chính User này
      const userOrders = data.filter((item: any) => item.userId === userInfo.id);
      setOrders(userOrders);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể tải danh sách đơn hàng!');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>
          Lịch sử Đơn hàng
        </Text>
      </View>
     <FlatList
  data={orders}
  keyExtractor={(item) => item.id}
  contentContainerStyle={{ padding: 16 }}
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} />
  }
  ListEmptyComponent={
    <Text style={{ textAlign: 'center', marginTop: 40, color: '#888' }}>
      Bạn chưa có đơn hàng nào!
    </Text>
  }
  /* ⚠️ Đảm bảo truyền { item } vào tham số của renderItem như bên dưới */
  renderItem={({ item }) => (
    <Card style={styles.orderCard} mode="outlined">
      <Card.Content>
        <View style={styles.rowBetween}>
          <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
            Mã đơn: #{item.id}
          </Text>
          <Chip icon="information" style={styles.chipStatus}>
            {item.status}
          </Chip>
        </View>

        <Text style={{ marginVertical: 8, color: '#555' }}>
          Món: {item.items.map((i: any) => `${i.product.name} (x${i.quantity})`).join(', ')}
        </Text>

        <View style={styles.rowBetween}>
          <Text variant="titleMedium" style={{ color: '#6200ee', fontWeight: 'bold' }}>
            {item.totalPrice.toLocaleString('vi-VN')} đ
          </Text>
          <Text style={{ fontSize: 12, color: '#888' }}>{item.createdAt}</Text>
        </View>
      </Card.Content>
    <Card.Actions>
  <Button 
    icon="chat" 
    mode="tonal" 
    compact 
    onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id } })}
  >
    Chat
  </Button>

  <Button 
    icon="map-marker-distance" 
    mode="contained" 
    buttonColor="#6200ee"
    compact 
    onPress={() => router.push({ pathname: '/tracking/[id]', params: { id: item.id } })}
  >
    Bản đồ
  </Button>
</Card.Actions>
    </Card>
  )}
/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f6f6', paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  orderCard: { marginBottom: 12, backgroundColor: '#fff', borderRadius: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chipStatus: { backgroundColor: '#e8f5e9' },
});