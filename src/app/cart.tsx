import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, IconButton, Text, TextInput } from 'react-native-paper';
import { useCart } from '../context/CartContext';

// ⚠️ Thay bằng IPv4 máy tính của bạn
const BASE_URL = 'http://172.20.10.2:3000/api';

export default function CartCheckoutScreen() {
  const router = useRouter();
  const { cart, updateQuantity, removeFromCart, totalPrice, clearCart } = useCart();
  
  const [address, setAddress] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // 🚀 Gửi đơn hàng trực tiếp lên Server
  const handleConfirmOrder = async () => {
    try {
      const userInfoStr = await AsyncStorage.getItem('userInfo');
      const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;

      if (!userInfo) {
        Alert.alert('Chưa đăng nhập', 'Vui lòng đăng nhập để đặt hàng!');
        router.push('/login');
        return;
      }

      if (!cart || cart.length === 0) {
        Alert.alert('Giỏ hàng trống', 'Vui lòng chọn món trước khi đặt hàng!');
        return;
      }

      if (!address.trim()) {
        Alert.alert('Thiếu thông tin', 'Vui lòng nhập địa chỉ giao hàng!');
        return;
      }

      setLoading(true);

      // Chuẩn hóa dữ liệu sản phẩm gửi lên server bất kể cấu trúc gốc ra sao
      const formattedItems = cart.map((item: any) => {
        const prod = item.product || item;
        return {
          productId: prod.id || prod._id || '',
          name: prod.name || 'Sản phẩm',
          price: Number(prod.price || 0),
          image: prod.image || '',
          quantity: Number(item.quantity || 1)
        };
      });

      const orderData = {
        userId: userInfo.id,
        userName: userInfo.name || 'Khách hàng',
        address: address,
        note: note,
        items: formattedItems,
        totalPrice: totalPrice
      };

      const response = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert(
          '🎉 Đặt hàng thành công!',
          `Mã đơn hàng: #${data.order.orderId || data.order.id}\nQuán đã nhận được đơn và đang chuẩn bị!`,
          [
            { 
              text: 'Xem lịch sử đơn hàng', 
              onPress: () => {
                clearCart(); // Xóa giỏ hàng trên app
                router.replace('/orders'); // Sang trang lịch sử
              } 
            }
          ]
        );
      } else {
        Alert.alert('Lỗi', data.error || 'Không thể tạo đơn hàng!');
      }
    } catch (error) {
      console.error('Lỗi đặt hàng:', error);
      Alert.alert('Lỗi kết nối', 'Không thể kết nối tới server.');
    } finally {
      setLoading(false);
    }
  };
  // Thay vì tạo đơn luôn, ta chuyển hướng sang trang chọn Phương thức thanh toán & Mã giảm giá
  const handleGoToPaymentOptions = () => {
    if (!cart || cart.length === 0) {
      Alert.alert('Giỏ hàng trống', 'Vui lòng chọn món trước khi thanh toán!');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập địa chỉ giao hàng!');
      return;
    }

    // Chuyển sang màn hình chọn phương thức thanh toán và mã giảm giá
    router.push({
      pathname: '/payment-method', // Hoặc tên file trang phương thức thanh toán của bạn
      params: {
        address: address,
        note: note,
        totalAmount: totalPrice.toString()
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>
          Xác Nhận Đơn Hàng ({cart?.length || 0} món)
        </Text>
      </View>

      {!cart || cart.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text variant="bodyLarge">Giỏ hàng của bạn đang trống!</Text>
          <Button mode="contained" onPress={() => router.back()} style={{ marginTop: 16 }}>
            Tiếp tục chọn món từ Menu
          </Button>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {/* Danh sách món ăn */}
          <Card style={styles.card} mode="outlined">
            <Card.Content>
              <View style={styles.rowBetweenHeader}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#6200ee' }}>
                  📦 Món đã chọn
                </Text>
                <Button mode="text" compact onPress={() => router.back()}>
                  + Chọn thêm món
                </Button>
              </View>

              {cart.map((item: any, index: number) => {
                // Xử lý linh hoạt lấy thông tin sản phẩm (dù nằm trong .product hay nằm trực tiếp ngoài item)
                const product = item.product || item;
                const productId = product.id || product._id || index.toString();
                const name = product.name || 'Sản phẩm';
                const price = Number(product.price || 0);
                const image = product.image || 'https://via.placeholder.com/150';
                const quantity = Number(item.quantity || 1);

                return (
                  <View key={productId} style={styles.cartRow}>
                    <Image source={{ uri: image }} style={styles.itemImage} />
                    <View style={styles.itemInfo}>
                      <Text variant="titleMedium" numberOfLines={1}>{name}</Text>
                      <Text style={styles.itemPrice}>
                        {(price * quantity).toLocaleString('vi-VN')} đ
                      </Text>
                      
                      <View style={styles.qtyRow}>
                        <IconButton icon="minus-box" size={18} onPress={() => updateQuantity(productId, -1)} />
                        <Text variant="bodyMedium">{quantity}</Text>
                        <IconButton icon="plus-box" size={18} onPress={() => updateQuantity(productId, 1)} />
                      </View>
                    </View>

                    <IconButton
                      icon="trash-can-outline"
                      iconColor="#B00020"
                      size={20}
                      onPress={() => removeFromCart(productId)}
                    />
                  </View>
                );
              })}

              <Divider style={{ marginVertical: 12 }} />
              
              <View style={styles.rowBetween}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Tổng thanh toán:</Text>
                <Text variant="headlineSmall" style={styles.totalText}>
                  {totalPrice.toLocaleString('vi-VN')} đ
                </Text>
              </View>
            </Card.Content>
          </Card>

          {/* Phần nhập địa chỉ giao hàng */}
          <Card style={[styles.card, { marginTop: 12 }]} mode="outlined">
            <Card.Content>
              <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12, color: '#6200ee' }}>
                📍 Thông tin giao hàng
              </Text>
              
              <TextInput
                label="Nhập địa chỉ giao hàng chi tiết..."
                mode="outlined"
                value={address}
                onChangeText={setAddress}
                style={{ marginBottom: 12, backgroundColor: '#fff' }}
                outlineColor="#ccc"
                activeOutlineColor="#6200ee"
              />

              <TextInput
                label="Ghi chú cho tài xế / cửa hàng (Tùy chọn)"
                mode="outlined"
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={2}
                style={{ backgroundColor: '#fff' }}
                outlineColor="#ccc"
                activeOutlineColor="#6200ee"
              />
            </Card.Content>
          </Card>

          {/* Nút đặt hàng */}
        <Button 
    mode="contained" 
    buttonColor="#6200ee" 
    style={{ marginTop: 24, paddingVertical: 6, borderRadius: 8 }}
    onPress={handleGoToPaymentOptions}
  >
    Tiếp Tục Chọn Thanh Toán & Mã Giảm Giá ({totalPrice.toLocaleString('vi-VN')} đ)
  </Button>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f6f6', paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, backgroundColor: '#fff', elevation: 2 },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12 },
  rowBetweenHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cartRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#eee', paddingBottom: 8 },
  itemImage: { width: 60, height: 60, borderRadius: 8 },
  itemInfo: { flex: 1, marginLeft: 10 },
  itemPrice: { color: '#6200ee', fontWeight: 'bold', fontSize: 13 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalText: { color: '#6200ee', fontWeight: 'bold' },
});