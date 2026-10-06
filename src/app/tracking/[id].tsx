import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { ActivityIndicator, Card, IconButton, Text } from 'react-native-paper';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://192.168.1.10:3000'; // ⚠️ Thay bằng IPv4 của bạn

let socket: Socket;

export default function TrackingScreen() {
  const params = useLocalSearchParams();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const orderId = String(rawId || '').replace('#', '').trim();
  const router = useRouter();

  // Tọa độ cố định của Quán ăn
  const storeLocation = {
    latitude: 10.7769,
    longitude: 106.7009,
  };

  // Vị trí mặc định của Tài xế / Khách
  const [driverLocation, setDriverLocation] = useState({
    latitude: 10.7720,
    longitude: 106.6980,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({});
        setDriverLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
      setLoading(false);
    })();

    socket = io(SOCKET_URL);
    socket.emit('join_room', orderId);

    // Lắng nghe vị trí tài xế cập nhật Realtime
    socket.on('driver_location_update', (newCoords) => {
      setDriverLocation(newCoords);
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [orderId]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={{ marginTop: 10 }}>Đang xác định vị trí...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
          🛵 Theo Dõi Đơn Hàng #{orderId}
        </Text>
      </View>

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: (storeLocation.latitude + driverLocation.latitude) / 2,
          longitude: (storeLocation.longitude + driverLocation.longitude) / 2,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
      >
        <Marker coordinate={storeLocation} title="Quán ăn" pinColor="red" />
        <Marker coordinate={driverLocation} title="Tài xế giao hàng" pinColor="blue" />
        <Polyline coordinates={[storeLocation, driverLocation]} strokeColor="#6200ee" strokeWidth={4} />
      </MapView>

      <Card style={styles.infoCard}>
        <Card.Content>
          <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#6200ee' }}>
            🛵 Tài xế đang di chuyển tới bạn
          </Text>
          <Text style={{ marginTop: 4, color: '#555' }}>
            Thời gian giao dự kiến: <Text style={{ fontWeight: 'bold' }}>10 - 15 phút</Text>
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 30 },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', elevation: 2 },
  map: { width: Dimensions.get('window').width, flex: 1 },
  infoCard: { position: 'absolute', bottom: 20, left: 16, right: 16, backgroundColor: '#fff', borderRadius: 12, elevation: 4 },
});