import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
// ⚠️ Chú ý đường dẫn ../context/CartContext nếu file nằm trong src/app
import { CartProvider } from '../context/CartContext';

export default function RootLayout() {
  return (
    <PaperProvider>
      <CartProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </CartProvider>
    </PaperProvider>
  );
}