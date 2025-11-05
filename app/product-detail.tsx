import { IconSymbol } from '@/components/ui/icon-symbol';
import { QuiloxColors } from '@/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProductDetailScreen() {
  const params = useLocalSearchParams();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('M');

  const product = {
    id: params.id as string,
    name: decodeURIComponent(params.name as string),
    price: Number(params.price),
    oldPrice: Number(params.oldPrice),
    image: decodeURIComponent(params.image as string),
    rating: Number(params.rating),
    reviews: Number(params.reviews),
    exclusive: params.exclusive === 'true',
    category: decodeURIComponent(params.category as string),
  };

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const discount = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);

  const handlePurchase = () => {
    const total = product.price * quantity;
    
    if (Platform.OS === 'web') {
      if (confirm(`Purchase ${quantity}x ${product.name} for ₦${total.toLocaleString()}?`)) {
        alert('Order placed successfully! You will receive a confirmation email shortly.');
        router.back();
      }
    } else {
      Alert.alert(
        'Confirm Purchase',
        `Purchase ${quantity}x ${product.name} for ₦${total.toLocaleString()}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: () => {
              Alert.alert('Success!', 'Order placed successfully! You will receive a confirmation email shortly.');
              router.back();
            },
          },
        ]
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#fff' }]}>Product Details</Text>
        <TouchableOpacity>
          <IconSymbol name="cart" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.image }}
            style={styles.productImage}
            resizeMode="cover"
          />
          {product.exclusive && (
            <View style={[styles.exclusiveBadge, { backgroundColor: QuiloxColors.gold }]}>
              <Text style={[styles.exclusiveText, { color: QuiloxColors.black }]}>Exclusive</Text>
            </View>
          )}
          {discount > 0 && (
            <View style={[styles.discountBadge, { backgroundColor: '#EF4444' }]}>
              <Text style={[styles.discountText, { color: '#fff' }]}>{discount}% OFF</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: '#fff' }]}>{product.name}</Text>
          
          <View style={styles.ratingRow}>
            <IconSymbol name="star.fill" size={16} color={QuiloxColors.gold} />
            <Text style={[styles.rating, { color: '#fff' }]}>{product.rating}</Text>
            <Text style={[styles.reviews, { color: '#666' }]}>({product.reviews} reviews)</Text>
          </View>

          <View style={styles.priceContainer}>
            <View>
              <Text style={[styles.oldPrice, { color: '#666' }]}>₦{product.oldPrice.toLocaleString()}</Text>
              <Text style={[styles.price, { color: QuiloxColors.gold }]}>₦{product.price.toLocaleString()}</Text>
            </View>
            <View style={[styles.savingsBadge, { backgroundColor: QuiloxColors.gold + '20' }]}>
              <Text style={[styles.savingsText, { color: QuiloxColors.gold }]}>
                Save ₦{(product.oldPrice - product.price).toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Size Selection */}
          {product.category === 'Apparel' && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: '#fff' }]}>Select Size</Text>
              <View style={styles.sizesRow}>
                {sizes.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.sizeButton,
                      {
                        backgroundColor: selectedSize === size ? QuiloxColors.gold : QuiloxColors.darkGray,
                        borderColor: selectedSize === size ? QuiloxColors.gold : '#333',
                      },
                    ]}
                    onPress={() => setSelectedSize(size)}
                  >
                    <Text
                      style={[
                        styles.sizeText,
                        { color: selectedSize === size ? QuiloxColors.black : '#999' },
                      ]}
                    >
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Quantity */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: '#fff' }]}>Quantity</Text>
            <View style={styles.quantityRow}>
              <TouchableOpacity
                style={[styles.quantityButton, { backgroundColor: QuiloxColors.darkGray }]}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <IconSymbol name="minus" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={[styles.quantityText, { color: '#fff' }]}>{quantity}</Text>
              <TouchableOpacity
                style={[styles.quantityButton, { backgroundColor: QuiloxColors.darkGray }]}
                onPress={() => setQuantity(quantity + 1)}
              >
                <IconSymbol name="plus" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: '#fff' }]}>Description</Text>
            <Text style={[styles.description, { color: '#999' }]}>
              Premium quality {product.name.toLowerCase()} from Quilox. Made with high-quality materials 
              and designed for comfort and style. Perfect for showcasing your Quilox pride.
              {'\n\n'}
              Features:{'\n'}
              - Premium quality materials{'\n'}
              - Quilox signature branding{'\n'}
              - Comfortable fit{'\n'}
              - Exclusive design
            </Text>
          </View>

          {/* Features */}
          <View style={styles.featuresGrid}>
            <View style={[styles.featureCard, { backgroundColor: QuiloxColors.darkGray }]}>
              <IconSymbol name="checkmark.shield" size={24} color={QuiloxColors.gold} />
              <Text style={[styles.featureText, { color: '#fff' }]}>Authentic</Text>
            </View>
            <View style={[styles.featureCard, { backgroundColor: QuiloxColors.darkGray }]}>
              <IconSymbol name="truck.box" size={24} color={QuiloxColors.gold} />
              <Text style={[styles.featureText, { color: '#fff' }]}>Free Delivery</Text>
            </View>
            <View style={[styles.featureCard, { backgroundColor: QuiloxColors.darkGray }]}>
              <IconSymbol name="arrow.clockwise" size={24} color={QuiloxColors.gold} />
              <Text style={[styles.featureText, { color: '#fff' }]}>Easy Returns</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Purchase Bar */}
      <View style={[styles.purchaseBar, { backgroundColor: QuiloxColors.darkGray }]}>
        <View>
          <Text style={[styles.totalLabel, { color: '#999' }]}>Total Price</Text>
          <Text style={[styles.totalPrice, { color: QuiloxColors.gold }]}>
            ₦{(product.price * quantity).toLocaleString()}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.purchaseButton, { backgroundColor: QuiloxColors.gold }]}
          onPress={handlePurchase}
        >
          <IconSymbol name="cart" size={20} color={QuiloxColors.black} />
          <Text style={[styles.purchaseText, { color: QuiloxColors.black }]}>Add to Cart</Text>
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  scrollView: { flex: 1 },
  imageContainer: {
    width: '100%',
    height: 400,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  exclusiveBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  exclusiveText: { fontSize: 12, fontWeight: '700' },
  discountBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  discountText: { fontSize: 12, fontWeight: '700' },
  productInfo: { padding: 16, gap: 16 },
  productName: { fontSize: 24, fontWeight: 'bold', lineHeight: 30 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rating: { fontSize: 14, fontWeight: '600' },
  reviews: { fontSize: 13 },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  oldPrice: {
    fontSize: 14,
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  price: { fontSize: 28, fontWeight: 'bold' },
  savingsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  savingsText: { fontSize: 12, fontWeight: '600' },
  section: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  sizesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sizeButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  sizeText: { fontSize: 14, fontWeight: '600' },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: { fontSize: 20, fontWeight: 'bold', minWidth: 40, textAlign: 'center' },
  description: { fontSize: 14, lineHeight: 22 },
  featuresGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  featureCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  featureText: { fontSize: 12, fontWeight: '600' },
  purchaseBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  totalLabel: { fontSize: 12, marginBottom: 4 },
  totalPrice: { fontSize: 20, fontWeight: 'bold' },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  purchaseText: { fontSize: 16, fontWeight: 'bold' },
});