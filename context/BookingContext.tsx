import React, { createContext, useContext, useState } from 'react';
import { TableArea } from '../lib/supabase';

type BookingContextType = {
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  guestCount: number;
  setGuestCount: (count: number) => void;
  selectedTable: TableArea | null;
  setSelectedTable: (table: TableArea | null) => void;
  guestInfo: {
    name: string;
    email: string;
    phone: string;
    specialRequests: string;
  };
  setGuestInfo: (info: Partial<BookingContextType['guestInfo']>) => void;
  resetBooking: () => void;
};

const BookingContext = createContext<BookingContextType>({
  selectedDate: null,
  setSelectedDate: () => {},
  guestCount: 2,
  setGuestCount: () => {},
  selectedTable: null,
  setSelectedTable: () => {},
  guestInfo: {
    name: '',
    email: '',
    phone: '',
    specialRequests: '',
  },
  setGuestInfo: () => {},
  resetBooking: () => {},
});

export const useBooking = () => useContext(BookingContext);

export const BookingProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [guestCount, setGuestCount] = useState(2);
  const [selectedTable, setSelectedTable] = useState<TableArea | null>(null);
  const [guestInfo, setGuestInfoState] = useState({
    name: '',
    email: '',
    phone: '',
    specialRequests: '',
  });

  const setGuestInfo = (info: Partial<BookingContextType['guestInfo']>) => {
    setGuestInfoState((prev) => ({ ...prev, ...info }));
  };

  const resetBooking = () => {
    setSelectedDate(null);
    setGuestCount(2);
    setSelectedTable(null);
    setGuestInfoState({
      name: '',
      email: '',
      phone: '',
      specialRequests: '',
    });
  };

  return (
    <BookingContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        guestCount,
        setGuestCount,
        selectedTable,
        setSelectedTable,
        guestInfo,
        setGuestInfo,
        resetBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export default BookingProvider;