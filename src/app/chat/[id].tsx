import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { IconButton, Text, TextInput } from 'react-native-paper';
import { io, Socket } from 'socket.io-client';

// ⚠️ Thay bằng IPv4 máy tính của bạn (Ví dụ: http://192.168.1.10:3000)
const SOCKET_URL = 'http://172.20.10.2:3000';

let socket: Socket;

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const orderId = params.id as string;
  const router = useRouter();

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!orderId) return;

    socket = io(SOCKET_URL);

    // Tham gia phòng chat riêng theo mã đơn hàng
    socket.emit('join_room', orderId);

    // Nhận lịch sử chat cũ
    socket.on('load_history', (history) => {
      setMessages(history);
    });

    // Nhận tin nhắn mới từ Server Socket
    socket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, [orderId]);

  const sendMessage = () => {
    if (!text.trim()) return;

    socket.emit('send_message', {
      orderId,
      sender: 'user', // Khách hàng gửi
      text: text.trim(),
    });

    setText('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
          💬 Chat Đơn #{orderId}
        </Text>
      </View>

      {/* Danh sách Bong Bóng Chat */}
      <FlatList
        data={messages}
        keyExtractor={(item, index) => item.id || index.toString()}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const isMe = item.sender === 'user'; // Đánh giá người gửi
          return (
            <View style={[styles.messageRow, isMe ? styles.myRow : styles.theirRow]}>
              <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
                <Text style={[styles.msgText, { color: isMe ? '#ffffff' : '#1c1b1f' }]}>
                  {item.text}
                </Text>
                <Text style={[styles.timeText, { color: isMe ? '#e0e0e0' : '#79747e' }]}>
                  {item.time}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {/* Thanh Nhập Tin Nhắn */}
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Nhập tin nhắn..."
          value={text}
          onChangeText={setText}
          mode="outlined"
          dense
          style={styles.textInput}
        />
        <IconButton
          icon="send"
          mode="contained"
        //   buttonColor="#6200ee"
          iconColor="#fff"
          size={22}
          onPress={sendMessage}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f7', paddingTop: 30 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    elevation: 2,
    paddingRight: 16,
  },
  messageRow: {
    marginVertical: 4,
    flexDirection: 'row',
    width: '100%',
  },
  myRow: {
    justifyContent: 'flex-end', // Căn sang Phải nếu là mình gửi
  },
  theirRow: {
    justifyContent: 'flex-start', // Căn sang Trái nếu là đối phương
  },
  bubble: {
    maxWidth: '78%',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    elevation: 1,
  },
  myBubble: {
    backgroundColor: '#6200ee', // Nền tím nổi bật cho tin nhắn của mình
    borderBottomRightRadius: 2, // Bo góc kiểu bong bóng
  },
  theirBubble: {
    backgroundColor: '#ffffff', // Nền trắng cho tin nhắn đối phương
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  msgText: {
    fontSize: 15,
    lineHeight: 20,
  },
  timeText: {
    fontSize: 10,
    marginTop: 3,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#fff',
    marginRight: 6,
  },
});