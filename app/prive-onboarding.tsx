import { IconSymbol } from '@/components/ui/icon-symbol';
import { QuiloxColors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function PriveOnboardingScreen() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bvn: '',
  });
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bvn: '',
  });

  const validateForm = (): boolean => {
    const newErrors = {
      firstName: '',
      lastName: '',
      phone: '',
      bvn: '',
    };
    let isValid = true;

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
      isValid = false;
    }

    const phoneRegex = /^0\d{10}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
      isValid = false;
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number (e.g., 08012345678)';
      isValid = false;
    }

    const bvnRegex = /^\d{11}$/;
    if (!formData.bvn.trim()) {
      newErrors.bvn = 'BVN is required';
      isValid = false;
    } else if (!bvnRegex.test(formData.bvn)) {
      newErrors.bvn = 'BVN must be 11 digits';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          phone: formData.phone.trim(),
          bvn: formData.bvn.trim(),
          prive_onboarded: true,
          prive_onboarded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        throw profileError;
      }

      if (Platform.OS === 'web') {
        router.replace('/(tabs)/prive');
      } else {
        Alert.alert(
          'Success! 🎉',
          'Your Privé account is being created. This may take a moment...',
          [
            {
              text: 'Continue',
              onPress: () => {
                router.replace('/(tabs)/prive');
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Onboarding error:', error);
      Alert.alert('Error', error.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: QuiloxColors.black }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privé Onboarding</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.heroSection}>
          <View style={[styles.iconContainer, { backgroundColor: QuiloxColors.gold + '20' }]}>
            <IconSymbol name="crown.fill" size={48} color={QuiloxColors.gold} />
          </View>
          <Text style={styles.title}>Welcome to Quilox Privé</Text>
          <Text style={styles.subtitle}>
            Complete your profile to unlock exclusive benefits and create your wallet
          </Text>
        </View>

        <View style={styles.formContainer}>
          {/* First Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <View style={[styles.inputContainer, { borderColor: errors.firstName ? QuiloxColors.error : QuiloxColors.darkGray }]}>
              <IconSymbol name="person" size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="Enter your first name"
                placeholderTextColor="#666"
                value={formData.firstName}
                onChangeText={(text) => {
                  setFormData({ ...formData, firstName: text });
                  setErrors({ ...errors, firstName: '' });
                }}
                autoCapitalize="words"
              />
            </View>
            {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
          </View>

          {/* Last Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <View style={[styles.inputContainer, { borderColor: errors.lastName ? QuiloxColors.error : QuiloxColors.darkGray }]}>
              <IconSymbol name="person" size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="Enter your last name"
                placeholderTextColor="#666"
                value={formData.lastName}
                onChangeText={(text) => {
                  setFormData({ ...formData, lastName: text });
                  setErrors({ ...errors, lastName: '' });
                }}
                autoCapitalize="words"
              />
            </View>
            {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={[styles.inputContainer, { borderColor: errors.phone ? QuiloxColors.error : QuiloxColors.darkGray }]}>
              <IconSymbol name="phone" size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="08012345678"
                placeholderTextColor="#666"
                value={formData.phone}
                onChangeText={(text) => {
                  setFormData({ ...formData, phone: text });
                  setErrors({ ...errors, phone: '' });
                }}
                keyboardType="phone-pad"
                maxLength={11}
              />
            </View>
            {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
          </View>

          {/* BVN */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bank Verification Number (BVN)</Text>
            <View style={[styles.inputContainer, { borderColor: errors.bvn ? QuiloxColors.error : QuiloxColors.darkGray }]}>
              <IconSymbol name="creditcard" size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="Enter your 11-digit BVN"
                placeholderTextColor="#666"
                value={formData.bvn}
                onChangeText={(text) => {
                  setFormData({ ...formData, bvn: text });
                  setErrors({ ...errors, bvn: '' });
                }}
                keyboardType="number-pad"
                maxLength={11}
                secureTextEntry
              />
            </View>
            {errors.bvn ? <Text style={styles.errorText}>{errors.bvn}</Text> : null}
            <Text style={styles.helpText}>
              Your BVN is required to create a virtual account for your wallet
            </Text>
          </View>

          <View style={[styles.infoCard, { backgroundColor: QuiloxColors.darkGray }]}>
            <IconSymbol name="info.circle" size={20} color={QuiloxColors.gold} />
            <Text style={styles.infoText}>
              Your information is secure and used only to create your Privé wallet.
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: loading ? QuiloxColors.mediumGray : QuiloxColors.gold,
              },
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={QuiloxColors.black} />
            ) : (
              <>
                <Text style={[styles.submitButtonText, { color: QuiloxColors.black }]}>
                  Complete Onboarding
                </Text>
                <IconSymbol name="arrow.right" size={20} color={QuiloxColors.black} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 40,
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: QuiloxColors.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  heroSection: { alignItems: 'center', marginBottom: 40 },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  formContainer: { gap: 20 },
  inputGroup: { gap: 8 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: QuiloxColors.darkGray,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    height: 52,
    color: '#fff',
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    color: QuiloxColors.error,
    marginTop: 4,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 56,
    borderRadius: 12,
    gap: 8,
    marginTop: 12,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});