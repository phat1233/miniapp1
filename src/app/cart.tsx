import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, IconButton, Text } from 'react-native-paper';
import { useCart } from '../context/CartContext';

// ⚠️ Thay bằng IPv4 máy tính của bạn
const BASE_URL = 'http://192.168.1.122:3000/api'; 

export default function CartScreen() {
  const router = useRouter();
  const { cart, updateQuantity, removeFromCart, totalPrice, clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  // 🚀 Hàm gửi đơn hàng lên Server Node.js
  const handleCheckout = async () => {
    try {
      setLoading(true);
      const userInfoStr = await AsyncStorage.getItem('userInfo');
      const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;

      if (!userInfo) {
        Alert.alert('Chưa đăng nhập', 'Vui lòng đăng nhập để đặt hàng!');
        router.push('/login');
        return;
      }

      // Gọi API POST /api/orders
      const response = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userInfo.id,
          userName: userInfo.name,
          items: cart,
          totalPrice: totalPrice,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('🎉 Thành công', `Đơn hàng #${data.order.id} đã được gửi tới quán!`);
        clearCart(); // Xóa sạch giỏ hàng sau khi đặt thành công
        router.back();
      } else {
        Alert.alert('Lỗi', data.message || 'Không thể tạo đơn hàng!');
      }
    } catch (error) {
      Alert.alert('Lỗi kết nối', 'Không thể kết nối tới Server!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>
          Giỏ hàng của bạn ({cart.length})
        </Text>
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text variant="bodyLarge">Giỏ hàng đang trống!</Text>
          <Button mode="contained" onPress={() => router.back()} style={{ marginTop: 16 }}>
            Mua sắm ngay
          </Button>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={(item) => item.product.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <Card style={styles.cartCard} mode="outlined">
                <Card.Content style={styles.cartRow}>
                  <Image source={{ uri: item.product.image }} style={styles.itemImage} />
                  
                  <View style={styles.itemInfo}>
                    <Text variant="titleMedium">{item.product.name}</Text>
                    <Text variant="bodyMedium" style={styles.itemPrice}>
                      {(item.product.price * item.quantity).toLocaleString('vi-VN')} đ
                    </Text>

                    <View style={styles.qtyRow}>
                      <IconButton
                        icon="minus-box"
                        size={20}
                        onPress={() => updateQuantity(item.product.id, -1)}
                      />
                      <Text variant="titleMedium">{item.quantity}</Text>
                      <IconButton
                        icon="plus-box"
                        size={20}
                        onPress={() => updateQuantity(item.product.id, 1)}
                      />
                    </View>
                  </View>

                  <IconButton
                    icon="trash-can-outline"
                    iconColor="#B00020"
                    onPress={() => removeFromCart(item.product.id)}
                  />
                </Card.Content>
              </Card>
            )}
          />

          <Card style={styles.footerCard}>
            <Card.Content>
              <View style={styles.totalRow}>
                <Text variant="titleMedium">Tổng thanh toán:</Text>
                <Text variant="headlineSmall" style={styles.totalText}>
                  {totalPrice.toLocaleString('vi-VN')} đ
                </Text>
              </View>
              <Divider style={{ marginVertical: 12 }} />
              <Button
                mode="contained"
                buttonColor="#6200ee"
                onPress={handleCheckout}
                loading={loading}
                disabled={loading}
              >
                Đặt hàng ngay
              </Button>
            </Card.Content>
          </Card>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f6f6', paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cartCard: { marginBottom: 12, backgroundColor: '#fff' },
  cartRow: { flexDirection: 'row', alignItems: 'center' },
  itemImage: { width: 70, height: 70, borderRadius: 8 },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemPrice: { color: '#6200ee', fontWeight: 'bold', marginVertical: 4 },
  qtyRow: { flexDirection: 'row', alignItems: 'center' },
  footerCard: { borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: '#fff' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalText: { color: '#6200ee', fontWeight: 'bold' },
});