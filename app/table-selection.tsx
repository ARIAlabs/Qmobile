import { IconSymbol } from '@/components/ui/icon-symbol';
import { QuiloxColors } from '@/constants/theme';
import { useBooking } from '@/context/BookingContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { checkTableAvailability, fetchTableAreas, TableArea } from '@/lib/supabase';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TableSelectionScreen() {
  const colorScheme = useColorScheme();
  const isDark = true;
  const { selectedDate, guestCount, selectedTable, setSelectedTable } = useBooking();

  const [tables, setTables] = useState<TableArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, boolean>>({});

  // Fetch tables and check availability
  const loadTablesAndAvailability = useCallback(async () => {
    setLoading(true);
    try {
      const tablesData = await fetchTableAreas();
      setTables(tablesData);

      if (selectedDate) {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const availabilityChecks = await Promise.all(
          tablesData.map(async (table) => ({
            id: table.id,
            available: await checkTableAvailability(table.id, dateStr),
          }))
        );

        const availMap: Record<string, boolean> = {};
        availabilityChecks.forEach(({ id, available }) => {
          availMap[id] = available;
        });
        setAvailabilityMap(availMap);
      }
    } catch (error) {
      console.error('Error loading tables:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadTablesAndAvailability();
  }, [loadTablesAndAvailability]);

  const isTableAvailable = (tableId: string) => {
    return availabilityMap[tableId] !== false;
  };

  const handleContinue = () => {
    if (selectedTable) {
      router.push('/booking-confirmation');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: QuiloxColors.black, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={QuiloxColors.gold} />
        <Text style={{ color: QuiloxColors.gold, marginTop: 10 }}>Loading tables...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: QuiloxColors.black }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={24} color={QuiloxColors.gold} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#fff' }]}>Select Your Table Area</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Booking Info */}
        {selectedDate && (
          <View style={[styles.infoCard, { backgroundColor: QuiloxColors.darkGray }]}>
            <View style={styles.infoRow}>
              <IconSymbol name="calendar" size={18} color={QuiloxColors.gold} />
              <Text style={[styles.infoText, { color: '#fff' }]}>
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <IconSymbol name="person.2" size={18} color={QuiloxColors.gold} />
              <Text style={[styles.infoText, { color: '#fff' }]}>{guestCount} Guests</Text>
            </View>
          </View>
        )}

        <View style={styles.tableGrid}>
          {tables.map((table) => {
            const available = isTableAvailable(table.id) && table.is_available;
            const isSelected = selectedTable?.id === table.id;

            return (
              <TouchableOpacity
                key={table.id}
                style={[
                  styles.tableCard,
                  !available && styles.tableCardDisabled,
                  isSelected && { borderColor: QuiloxColors.gold, borderWidth: 3 },
                ]}
                onPress={() => available && setSelectedTable(table)}
                disabled={!available}
              >
                <ImageBackground
                  source={{ uri: table.image_url || 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=400' }}
                  style={styles.tableImage}
                  imageStyle={{ borderRadius: 12 }}
                >
                  <View style={styles.tableOverlay}>
                    <View style={styles.tableInfo}>
                      <Text style={styles.tableName}>{table.name}</Text>
                      <Text style={styles.tableNumber}>{table.table_number}</Text>
                      <View style={styles.tableBadge}>
                        <Text style={styles.tableSectionText}>{table.section}</Text>
                      </View>
                      <Text style={styles.tableSeats}>{table.seats} seats</Text>
                      <Text style={styles.tableFee}>₦{table.booking_fee.toLocaleString()} booking fee</Text>
                      {!available && (
                        <View style={[styles.unavailableBadge, { backgroundColor: QuiloxColors.error }]}>
                          <Text style={styles.unavailableText}>Not Available</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: selectedTable ? QuiloxColors.gold : QuiloxColors.darkGray,
            },
          ]}
          onPress={handleContinue}
          disabled={!selectedTable}
        >
          <Text
            style={[
              styles.continueText,
              { color: selectedTable ? QuiloxColors.black : '#666' },
            ]}
          >
            Continue to Guest Details
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  content: { flex: 1, paddingHorizontal: 20 },
  tableGrid: { gap: 16, paddingBottom: 20 },
  tableCard: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: QuiloxColors.darkGray,
  },
  tableCardDisabled: { opacity: 0.5 },
  tableImage: { flex: 1, width: '100%', height: '100%' },
  tableOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  tableInfo: { gap: 4 },
  tableName: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  tableNumber: { fontSize: 14, color: '#999' },
  tableSeats: { fontSize: 14, color: '#fff', marginTop: 4 },
  tableFee: { fontSize: 16, fontWeight: 'bold', color: QuiloxColors.gold, marginTop: 4 },
  unavailableBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  unavailableText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  footer: { padding: 20, paddingBottom: 40 },
  continueButton: { padding: 18, borderRadius: 12, alignItems: 'center' },
  continueText: { fontSize: 16, fontWeight: 'bold' },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tableBadge: {
    backgroundColor: QuiloxColors.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  tableSectionText: {
    color: QuiloxColors.black,
    fontSize: 12,
    fontWeight: 'bold',
  },
});