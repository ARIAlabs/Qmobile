import { QuiloxColors } from '@/constants/theme';
import { Carousel as CarouselType, fetchCarousel, subscribeToCarousel } from '@/lib/supabase';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';

const { width } = Dimensions.get('window');

export default function CarouselComponent() {
  const [carouselItems, setCarouselItems] = useState<CarouselType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCarousel();
    const unsubscribe = subscribeToCarousel(() => {
      loadCarousel();
    });
    return () => unsubscribe();
  }, []);

  const loadCarousel = async () => {
    try {
      setLoading(true);
      
      // Add 5 second timeout for carousel loading
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Carousel loading timeout')), 5000);
      });
      
      const response = await Promise.race([
        fetchCarousel(),
        timeoutPromise
      ]);
      
      // Handle new ApiResponse format
      if (response && typeof response === 'object' && 'data' in response) {
        setCarouselItems(response.data || []);
      } else {
        setCarouselItems([]);
      }
    } catch (error) {
      console.error('Error loading carousel:', error);
      setCarouselItems([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={QuiloxColors.gold} />
      </View>
    );
  }

  if (carouselItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No VIP experiences available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>VIP Experiences</Text>
      <Carousel
        loop
        width={width - 32}
        height={200}
        autoPlay
        autoPlayInterval={5000}
        data={carouselItems}
        scrollAnimationDuration={1000}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Image 
              source={{ uri: item.image_url }} 
              style={styles.image} 
              resizeMode="cover"
            />
            <View style={styles.overlay}>
              {item.title && <Text style={styles.title}>{item.title}</Text>}
              {item.subtitle && (
                <Text style={styles.subtitle} numberOfLines={2}>
                  {item.subtitle}
                </Text>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingHorizontal: 8,
    color: '#fff',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 15,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 18,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: QuiloxColors.darkGray,
    borderRadius: 12,
    margin: 16,
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: QuiloxColors.darkGray,
    borderRadius: 12,
    margin: 16,
    padding: 20,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
});