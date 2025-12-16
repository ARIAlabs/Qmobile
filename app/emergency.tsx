import { IconSymbol } from '@/components/ui/icon-symbol';
import { QuiloxColors } from '@/constants/theme';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function EmergencyScreen() {
  const router = useRouter();
  const [calling, setCalling] = useState(false);

  const emergencyServices = [
    {
      title: 'Medical Emergency',
      description: 'Request immediate EMT assistance',
      icon: 'cross.case.fill',
      phone: '112',
      color: '#FF3B30',
    },
    {
      title: 'Security',
      description: 'Contact Quilox security team',
      icon: 'shield.fill',
      phone: null,
      color: QuiloxColors.gold,
    },
    {
      title: 'First Aid Station',
      description: 'Locate nearest first aid point',
      icon: 'bandage.fill',
      phone: null,
      color: '#34C759',
    },
  ];

  const handleEmergencyCall = async (phone: string | null, title: string) => {
    if (!phone) {
      Alert.alert(
        title,
        'A staff member will be notified and assist you shortly.',
        [{ text: 'OK' }]
      );
      return;
    }

    setCalling(true);
    try {
      const url = `tel:${phone}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to make phone calls on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to initiate call');
    } finally {
      setCalling(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Services</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Warning Banner */}
        <View style={styles.warningBanner}>
          <IconSymbol name="exclamationmark.triangle.fill" size={24} color="#FF3B30" />
          <Text style={styles.warningText}>
            For life-threatening emergencies, call 112 immediately
          </Text>
        </View>

        {/* Emergency Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          {emergencyServices.map((service, index) => (
            <TouchableOpacity
              key={index}
              style={styles.emergencyCard}
              onPress={() => handleEmergencyCall(service.phone, service.title)}
              disabled={calling}
            >
              <View style={[styles.emergencyIcon, { backgroundColor: service.color + '20' }]}>
                <IconSymbol name={service.icon as any} size={28} color={service.color} />
              </View>
              <View style={styles.emergencyInfo}>
                <Text style={styles.emergencyTitle}>{service.title}</Text>
                <Text style={styles.emergencyDescription}>{service.description}</Text>
              </View>
              <View style={[styles.callButton, { backgroundColor: service.color }]}>
                {service.phone ? (
                  <IconSymbol name="phone.fill" size={20} color="#fff" />
                ) : (
                  <IconSymbol name="bell.fill" size={20} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Safety Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety Information</Text>
          <View style={styles.tipsCard}>
            <View style={styles.tipItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color={QuiloxColors.gold} />
              <Text style={styles.tipText}>Stay calm and assess the situation</Text>
            </View>
            <View style={styles.tipItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color={QuiloxColors.gold} />
              <Text style={styles.tipText}>Alert nearby staff if possible</Text>
            </View>
            <View style={styles.tipItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color={QuiloxColors.gold} />
              <Text style={styles.tipText}>Do not move injured persons unless necessary</Text>
            </View>
            <View style={styles.tipItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color={QuiloxColors.gold} />
              <Text style={styles.tipText}>First aid stations are located at each floor</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: QuiloxColors.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30' + '20',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  warningText: {
    flex: 1,
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: QuiloxColors.darkGray,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  emergencyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyInfo: {
    flex: 1,
    marginLeft: 16,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  emergencyDescription: {
    fontSize: 13,
    color: '#999',
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipsCard: {
    backgroundColor: QuiloxColors.darkGray,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#ccc',
  },
});
