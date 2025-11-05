import { IconSymbol } from '@/components/ui/icon-symbol';
import { QuiloxColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { fetchMerchProducts, MerchProduct } from '@/lib/supabase';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with 16px padding on sides and 16px gap

export default function ShopScreen() {
  const colorScheme = useColorScheme();
  const isDark = true;
  const [selectedCategory, setSelectedCategory] = useState('All Items');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [merchItems, setMerchItems] = useState<MerchProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = ['All Items', 'Apparel', 'Accessories', 'Collectibles'];

  // Fetch products from database
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const products = await fetchMerchProducts();
      console.log('Loaded products from database:', products.length);
      setMerchItems(products);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fallback hardcoded items if database is empty (for development)
  const fallbackItems = [
    { 
      id: '1',
      name: 'Quilox Signature T-Shirt', 
      price: 25000, 
      oldPrice: 32000,
      category: 'Apparel', 
      rating: 4.8,
      reviews: 127,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
      exclusive: false,
    },
    { 
      id: '2',
      name: 'Quilox Premium Hoodie', 
      price: 65000,
      oldPrice: 85000, 
      category: 'Apparel',
      rating: 4.9,
      reviews: 89,
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400',
      exclusive: true,
    },
    { 
      id: '3',
      name: 'Quilox Snapback Cap', 
      price: 35000,
      oldPrice: 45000,
      category: 'Accessories',
      rating: 4.7,
      reviews: 156,
      image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400',
      exclusive: false,
    },
    { 
      id: '4',
      name: 'Quilox Signature Sunglasses', 
      price: 85000,
      oldPrice: 110000,
      category: 'Accessories',
      rating: 4.8,
      reviews: 94,
      image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',
      exclusive: true,
    },
    { 
      id: '5',
      name: 'Quilox Limited Edition Watch', 
      price: 450000,
      oldPrice: 550000,
      category: 'Collectibles',
      rating: 5.0,
      reviews: 43,
      image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400',
      exclusive: true,
    },
    { 
      id: '6',
      name: 'Quilox Phone Case', 
      price: 18000,
      oldPrice: 25000,
      category: 'Accessories',
      rating: 4.4,
      reviews: 203,
      image: 'https://images.unsplash.com/photo-1601593346740-925612772716?w=400',
      exclusive: false,
    },
    { 
      id: '7',
      name: 'Black Hoodie', 
      price: 120000,
      oldPrice: 150000,
      category: 'Apparel',
      rating: 5.0,
      reviews: 67,
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400',
      exclusive: true,
    },
  ];

  // Use database items if available, otherwise use fallback
  const displayItems = merchItems.length > 0 ? merchItems : fallbackItems;

  const filteredItems = selectedCategory === 'All Items' 
    ? displayItems 
    : displayItems.filter(item => item.category === selectedCategory);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="arrow.left" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: '#fff' }]}>Quilox Shop</Text>
            <Text style={[styles.subtitle, { color: '#999' }]}>Exclusive merchandise</Text>
          </View>
        </View>
        <TouchableOpacity>
          <IconSymbol name="cart" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Category Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.tab,
              { backgroundColor: selectedCategory === category ? QuiloxColors.gold : QuiloxColors.darkGray }
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.tabText,
              { color: selectedCategory === category ? QuiloxColors.black : '#999' }
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products Grid */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={QuiloxColors.gold} />
            <Text style={[styles.loadingText, { color: '#999' }]}>Loading products...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="bag" size={48} color="#666" />
            <Text style={[styles.emptyText, { color: '#999' }]}>No products available</Text>
            <Text style={[styles.emptySubtext, { color: '#666' }]}>Check back soon for new items!</Text>
          </View>
        ) : (
        <View style={styles.productsGrid}>
          {filteredItems.map((item) => (
            <View key={item.id} style={[styles.productCard, { width: CARD_WIDTH }]}>
              {/* Product Image */}
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
                {item.is_exclusive && (
                  <View style={[styles.exclusiveBadge, { backgroundColor: QuiloxColors.gold }]}>
                    <Text style={[styles.exclusiveText, { color: QuiloxColors.black }]}>Exclusive</Text>
                  </View>
                )}
                <TouchableOpacity 
                  style={styles.favoriteButton}
                  onPress={() => toggleFavorite(item.id)}
                >
                  <IconSymbol 
                    name={favorites.includes(item.id) ? "heart.fill" : "heart"} 
                    size={20} 
                    color={favorites.includes(item.id) ? QuiloxColors.gold : "#fff"} 
                  />
                </TouchableOpacity>
              </View>

              {/* Product Info */}
              <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: '#fff' }]} numberOfLines={2}>
                  {item.name}
                </Text>

                <View style={styles.priceRow}>
                  <View>
                    {item.old_price && (
                      <Text style={[styles.oldPrice, { color: '#666' }]}>₦{item.old_price.toLocaleString()}</Text>
                    )}
                    <Text style={[styles.price, { color: QuiloxColors.gold }]}>₦{item.price.toLocaleString()}</Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.viewButton, { backgroundColor: QuiloxColors.gold }]}
                    onPress={() => router.push({
                      pathname: '/product-detail',
                      params: {
                        id: item.id,
                        name: encodeURIComponent(item.name),
                        price: item.price.toString(),
                        oldPrice: (item.old_price || item.price).toString(),
                        image: encodeURIComponent(item.image_url),
                        rating: (item.rating || 5.0).toString(),
                        reviews: (item.reviews_count || 0).toString(),
                        exclusive: (item.is_exclusive || false).toString(),
                        category: encodeURIComponent(item.category),
                      },
                    })}
                  >
                    <Text style={[styles.viewText, { color: QuiloxColors.black }]}>View</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#000',
  },
  header: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerText: {
    gap: 2,
  },
  title: { 
    fontSize: 20, 
    fontWeight: '600',
  },
  subtitle: { 
    fontSize: 13,
  },
  tabsContainer: {
    maxHeight: 50,
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 16,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 20,
  },
  productCard: {
    backgroundColor: QuiloxColors.darkGray,
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  productImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  exclusiveBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  exclusiveText: {
    fontSize: 10,
    fontWeight: '700',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    padding: 12,
    gap: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    minHeight: 36,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
  },
  reviews: {
    fontSize: 11,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  oldPrice: {
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
  },
  viewButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewText: {
    fontSize: 13,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
  },
});