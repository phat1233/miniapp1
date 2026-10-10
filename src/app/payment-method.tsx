import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Card, RadioButton, Text, TextInput } from 'react-native-paper';
import { useCart } from '../context/CartContext';

// ⚠️ Đảm bảo đúng địa chỉ IP máy tính của bạn
const BASE_URL = 'http://172.20.10.1:3000/api';

export default function PaymentMethodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { cart, clearCart } = useCart();

  const address = (params.address as string) || '';
  const note = (params.note as string) || '';
  const totalPrice = params.totalAmount ? Number(params.totalAmount) : 0;
  
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [voucherCode, setVoucherCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);

  const finalTotal = Math.max(0, totalPrice - discount);

  // Áp dụng mã giảm giá
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập mã giảm giá!');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/vouchers/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: voucherCode.trim(), totalPrice })
      });

      const data = await response.json();
      if (response.ok && (data.success || data.discountAmount)) {
        setDiscount(data.discountAmount);
        Alert.alert('Thành công', `Đã áp dụng mã giảm ${data.discountAmount.toLocaleString('vi-VN')} đ!`);
      } else {
        setDiscount(0);
        Alert.alert('Không thể áp dụng', data.message || 'Mã không hợp lệ!');
      }
    } catch (error) {
      console.error('Lỗi check voucher:', error);
      Alert.alert('Lỗi', 'Không thể kết nối đến server kiểm tra mã.');
    }
  };

  // 🚀 Xác nhận tạo đơn hàng cuối cùng
  const handleFinalSubmitOrder = async () => {
    try {
      setLoading(true);
      const userInfoStr = await AsyncStorage.getItem('userInfo');
      const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;

      if (!userInfo) {
        Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại!');
        router.replace('/login');
        return;
      }

      // Chuẩn hóa cấu trúc sản phẩm gửi lên server
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
        address,
        note,
        paymentMethod,
        discount,
        items: formattedItems,
        totalPrice: finalTotal
      };

      console.log("📤 Đang gửi đơn hàng lên server:", orderData);

      const response = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();
      console.log("📥 Phản hồi từ server tạo đơn:", data);

      // ✅ Đã sửa điều kiện khớp đúng với dữ liệu server trả về
      if (response.ok && (data.success || data.order || data.message === "Đặt hàng thành công!")) {
        console.log("🎉 Đặt hàng thành công, tiến hành làm sạch giỏ hàng và chuyển trang...");
        
        // 1. Làm sạch giỏ hàng ngay lập tức
        clearCart();

        const orderCode = data.order?.orderId || data.order?.id || 'mới';

        // 2. Thông báo và chuyển hướng an toàn
        Alert.alert(
          '🎉 Đặt hàng thành công!',
          `Mã đơn: #${orderCode}\nQuán đã nhận được đơn hàng của bạn!`,
          [
            { 
              text: 'OK / Về Trang Chủ', 
              onPress: () => {
                router.replace('/'); // Hoặc chuyển về '/orders' nếu muốn sang lịch sử
              } 
            }
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert('Lỗi đặt hàng', data.error || data.message || 'Không thể tạo đơn hàng từ máy chủ!');
      }
    } catch (error) {
      console.error('❌ Lỗi kết nối đặt hàng:', error);
      Alert.alert('Lỗi kết nối', 'Không thể kết nối tới server. Vui lòng kiểm tra lại mạng hoặc IP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button icon="arrow-left" onPress={() => router.back()}>Quay lại</Button>
        <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Thanh Toán & Ưu Đãi</Text>
      </View>

      <View style={{ padding: 16 }}>
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#6200ee', marginBottom: 8 }}>🎟️ Mã giảm giá</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                label="Nhập mã ưu đãi..."
                mode="outlined"
                value={voucherCode}
                onChangeText={setVoucherCode}
                style={{ flex: 1, backgroundColor: '#fff', marginRight: 8 }}
                dense
              />
              <Button mode="contained" onPress={handleApplyVoucher} buttonColor="#6200ee" style={{ marginTop: 4 }}>Áp dụng</Button>
            </View>
            {discount > 0 && (
              <Text style={{ color: 'green', marginTop: 6, fontWeight: 'bold' }}>Đã giảm: -{discount.toLocaleString('vi-VN')} đ</Text>
            )}
          </Card.Content>
        </Card>

        <Card style={[styles.card, { marginTop: 16 }]} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#6200ee', marginBottom: 8 }}>💳 Phương thức thanh toán</Text>
            <RadioButton.Group onValueChange={value => setPaymentMethod(value)} value={paymentMethod}>
              <View style={styles.radioRow}><RadioButton value="cash" /><Text>Tiền mặt khi nhận hàng (COD)</Text></View>
              <View style={styles.radioRow}><RadioButton value="banking" /><Text>Chuyển khoản Ngân hàng / Momo</Text></View>
            </RadioButton.Group>
          </Card.Content>
        </Card>

        <Card style={[styles.card, { marginTop: 16, backgroundColor: '#f9f9f9' }]} mode="outlined">
          <Card.Content>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text>Tạm tính:</Text><Text>{totalPrice.toLocaleString('vi-VN')} đ</Text></View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}><Text>Giảm giá:</Text><Text style={{ color: 'green' }}>-{discount.toLocaleString('vi-VN')} đ</Text></View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#ddd', paddingTop: 8 }}>
              <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Tổng thanh toán:</Text>
              <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#6200ee' }}>{finalTotal.toLocaleString('vi-VN')} đ</Text>
            </View>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          buttonColor="#6200ee"
          style={{ marginTop: 24, paddingVertical: 6, borderRadius: 8 }}
          onPress={handleFinalSubmitOrder}
          loading={loading}
          disabled={loading}
        >
          Xác Nhận Đặt Hàng ({finalTotal.toLocaleString('vi-VN')} đ)
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f6f6', paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 8, elevation: 2 },
  card: { backgroundColor: '#fff', borderRadius: 12 },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
});