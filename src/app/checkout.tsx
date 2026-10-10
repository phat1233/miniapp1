import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, IconButton, Text, TextInput } from 'react-native-paper';
import { useCart } from '../context/CartContext';

export default function CartCheckoutScreen() {
  const router = useRouter();
  const { cart, updateQuantity, removeFromCart, totalPrice } = useCart();
  
  const [address, setAddress] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const handleGoToPayment = () => {
    if (!cart || cart.length === 0) {
      Alert.alert('Giỏ hàng trống', 'Vui lòng chọn món trước khi thanh toán!');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập địa chỉ giao hàng!');
      return;
    }

    // Chuyển sang trang chọn phương thức thanh toán và nhập mã giảm giá
    router.push({
      pathname: '/payment-method',
      params: {
        address: address,
        note: note,
        totalAmount: totalPrice.toString()
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>Xác Nhận Giỏ Hàng</Text>
      </View>

      {!cart || cart.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text variant="bodyLarge">Giỏ hàng đang trống!</Text>
          <Button mode="contained" onPress={() => router.back()} style={{ marginTop: 16 }}>Chọn món ngay</Button>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <Card style={styles.card} mode="outlined">
            <Card.Content>
              <View style={styles.rowBetweenHeader}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#6200ee' }}>📦 Món đã chọn</Text>
                <Button mode="text" compact onPress={() => router.back()}>+ Chọn thêm</Button>
              </View>

              {cart.map((item: any, index: number) => {
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
                      <Text style={styles.itemPrice}>{(price * quantity).toLocaleString('vi-VN')} đ</Text>
                      
                      <View style={styles.qtyRow}>
                        <IconButton icon="minus-box" size={18} onPress={() => updateQuantity(productId, -1)} />
                        <Text variant="bodyMedium">{quantity}</Text>
                        <IconButton icon="plus-box" size={18} onPress={() => updateQuantity(productId, 1)} />
                      </View>
                    </View>
                    <IconButton icon="trash-can-outline" iconColor="#B00020" size={20} onPress={() => removeFromCart(productId)} />
                  </View>
                );
              })}

              <Divider style={{ marginVertical: 12 }} />
              <View style={styles.rowBetween}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Tạm tính:</Text>
                <Text variant="headlineSmall" style={styles.totalText}>{totalPrice.toLocaleString('vi-VN')} đ</Text>
              </View>
            </Card.Content>
          </Card>

          <Card style={[styles.card, { marginTop: 12 }]} mode="outlined">
            <Card.Content>
              <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12, color: '#6200ee' }}>📍 Địa chỉ nhận hàng</Text>
              <TextInput
                label="Nhập địa chỉ giao hàng chi tiết..."
                mode="outlined"
                value={address}
                onChangeText={setAddress}
                style={{ marginBottom: 12, backgroundColor: '#fff' }}
              />
              <TextInput
                label="Ghi chú cho cửa hàng (Tùy chọn)"
                mode="outlined"
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={2}
                style={{ backgroundColor: '#fff' }}
              />
            </Card.Content>
          </Card>

          <Button 
            mode="contained" 
            buttonColor="#6200ee" 
            style={{ marginTop: 24, paddingVertical: 6, borderRadius: 8 }}
            onPress={handleGoToPayment}
          >
            Tiếp Tục Chọn Thanh Toán & Mã Giảm Giá
          </Button>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f6f6', paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', elevation: 2 },
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