import { IconSymbol } from '@/components/ui/icon-symbol';
import { QuiloxColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = true; // Force dark mode
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Quilox Member');
  const [initials, setInitials] = useState<string>('QX');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserEmail(user?.email || null);

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      if (profile?.first_name) {
        const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
        setUserName(fullName || 'Quilox Member');
        const first = profile.first_name?.charAt(0) || '';
        const last = profile.last_name?.charAt(0) || '';
        setInitials((first + last).toUpperCase() || 'QX');
      }
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/auth');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: QuiloxColors.black }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: '#fff' }]}>Profile</Text>
      </View>

      {/* Profile Info */}
      <View style={styles.profileSection}>
        <View style={[styles.avatar, { backgroundColor: QuiloxColors.gold }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={[styles.name, { color: '#fff' }]}>{userName}</Text>
        <Text style={[styles.email, { color: '#999' }]}>{userEmail || 'Loading...'}</Text>
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <TouchableOpacity 
          style={[styles.menuItem, { backgroundColor: QuiloxColors.darkGray }]}
          onPress={() => router.push('/edit-profile')}
        >
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

        <TouchableOpacity 
          style={[styles.menuItem, { backgroundColor: QuiloxColors.darkGray }]}
          onPress={handleLogout}
        >
          <IconSymbol name="arrow.right.square" size={24} color={QuiloxColors.gold} />
          <Text style={[styles.menuText, { color: '#fff' }]}>Logout</Text>
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