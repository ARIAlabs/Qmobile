import { IconSymbol } from '@/components/ui/icon-symbol';
import { QuiloxColors } from '@/constants/theme';
import { useBooking } from '@/context/BookingContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BookingScreen() {
  const colorScheme = useColorScheme();
  const isDark = true;
  const { selectedDate, setSelectedDate, guestCount, setGuestCount } = useBooking();
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  // Generate calendar days for current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const monthDays = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const isDateSelected = (day: Date | null) => {
    if (!day || !selectedDate) return false;
    return day.toDateString() === selectedDate.toDateString();
  };

  const isDateDisabled = (day: Date | null) => {
    if (!day) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return day < today;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleContinue = () => {
    if (selectedDate && guestCount > 0) {
      router.push('/table-selection');
    }
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return '';
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: QuiloxColors.black }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={24} color={QuiloxColors.gold} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#fff' }]}>Book a Table</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Selected Date Display */}
        {selectedDate && (
          <View style={[styles.selectedDateCard, { backgroundColor: QuiloxColors.darkGray }]}>
            <IconSymbol name="calendar" size={20} color={QuiloxColors.gold} />
            <Text style={[styles.selectedDateText, { color: '#fff' }]}>
              {formatSelectedDate()}
            </Text>
          </View>
        )}

        {/* Guest Count */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#fff' }]}>Number of Guests</Text>
          <View style={styles.guestCounter}>
            <TouchableOpacity
              style={[styles.counterButton, { backgroundColor: QuiloxColors.darkGray }]}
              onPress={() => setGuestCount(Math.max(1, guestCount - 1))}
            >
              <IconSymbol name="minus" size={20} color={QuiloxColors.gold} />
            </TouchableOpacity>
            <Text style={[styles.guestCount, { color: '#fff' }]}>{guestCount} Guests</Text>
            <TouchableOpacity
              style={[styles.counterButton, { backgroundColor: QuiloxColors.darkGray }]}
              onPress={() => setGuestCount(Math.min(20, guestCount + 1))}
            >
              <IconSymbol name="plus" size={20} color={QuiloxColors.gold} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar Date Selection */}
        <View style={styles.section}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthButton}>
              <IconSymbol name="chevron.left" size={24} color={QuiloxColors.gold} />
            </TouchableOpacity>
            <Text style={[styles.monthTitle, { color: '#fff' }]}>{monthName}</Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.monthButton}>
              <IconSymbol name="chevron.right" size={24} color={QuiloxColors.gold} />
            </TouchableOpacity>
          </View>

          {/* Week Days Header */}
          <View style={styles.weekDaysRow}>
            {weekDays.map((day) => (
              <Text key={day} style={[styles.weekDayText, { color: '#999' }]}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {monthDays.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.calendarDay,
                  !day && styles.emptyDay,
                  isDateSelected(day) && { backgroundColor: QuiloxColors.gold },
                  isDateDisabled(day) && styles.disabledDay,
                ]}
                onPress={() => day && !isDateDisabled(day) && setSelectedDate(day)}
                disabled={!day || isDateDisabled(day)}
              >
                {day && (
                  <Text
                    style={[
                      styles.calendarDayText,
                      { color: isDateSelected(day) ? QuiloxColors.black : '#fff' },
                      isDateDisabled(day) && { color: '#444' },
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: selectedDate && guestCount > 0 ? QuiloxColors.gold : QuiloxColors.darkGray,
            },
          ]}
          onPress={handleContinue}
          disabled={!selectedDate || guestCount <= 0}
        >
          <Text
            style={[
              styles.continueText,
              { color: selectedDate && guestCount > 0 ? QuiloxColors.black : '#666' },
            ]}
          >
            Continue to Table Selection
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
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  guestCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  counterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestCount: { fontSize: 24, fontWeight: 'bold', minWidth: 120, textAlign: 'center' },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    width: 40,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 8,
  },
  emptyDay: {
    backgroundColor: 'transparent',
  },
  disabledDay: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: { padding: 20, paddingBottom: 40 },
  continueButton: { padding: 18, borderRadius: 12, alignItems: 'center' },
  continueText: { fontSize: 16, fontWeight: 'bold' },
  selectedDateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600',
  },
});