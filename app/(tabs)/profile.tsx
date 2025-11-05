import { IconSymbol } from '@/components/ui/icon-symbol';
import { QuiloxColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = true; // Force dark mode

  return (
    <ScrollView style={[styles.container, { backgroundColor: QuiloxColors.black }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: '#fff' }]}>Profile</Text>
      </View>

      {/* Profile Info */}
      <View style={styles.profileSection}>
        <View style={[styles.avatar, { backgroundColor: QuiloxColors.gold }]}>
          <Text style={styles.avatarText}>AC</Text>
        </View>
        <Text style={[styles.name, { color: '#fff' }]}>Aria Creative</Text>
        <Text style={[styles.email, { color: '#999' }]}>ariacreativeng@gmail.com</Text>
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <TouchableOpacity style={[styles.menuItem, { backgroundColor: QuiloxColors.darkGray }]}>
          <IconSymbol name="person" size={24} color={QuiloxColors.gold} />
          <Text style={[styles.menuText, { color: '#fff' }]}>Edit Profile</Text>
          <IconSymbol name="chevron.right" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, { backgroundColor: QuiloxColors.darkGray }]}
          onPress={() => router.push('/booking-history')}
        >
          <IconSymbol name="calendar" size={24} color={QuiloxColors.gold} />
          <Text style={[styles.menuText, { color: '#fff' }]}>My Bookings</Text>
          <IconSymbol name="chevron.right" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: QuiloxColors.darkGray }]}>
          <IconSymbol name="gear" size={24} color={QuiloxColors.gold} />
          <Text style={[styles.menuText, { color: '#fff' }]}>Settings</Text>
          <IconSymbol name="chevron.right" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold' },
  profileSection: { alignItems: 'center', padding: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: QuiloxColors.black },
  name: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  email: { fontSize: 14 },
  menuSection: { padding: 20, gap: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, gap: 12 },
  menuText: { flex: 1, fontSize: 16, fontWeight: '600' },
});