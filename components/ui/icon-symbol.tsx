// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Tab bar icons
  'house.fill': 'home',
  'person.fill': 'person',
  'person': 'person',
  'cart.fill': 'shopping-cart',
  'photo.fill': 'photo-library',
  'photo': 'photo',
  'crown.fill': 'workspace-premium',

  // Navigation icons
  'arrow.left': 'arrow-back',
  'chevron.left': 'chevron-left',
  'chevron.right': 'chevron-right',
  'chevron.left.forwardslash.chevron.right': 'code',
  'line.3.horizontal': 'menu',

  // Booking icons
  'calendar': 'calendar-today',
  'person.2': 'people',
  'location': 'place',
  'creditcard': 'credit-card',
  'info.circle': 'info',
  'minus': 'remove',
  'plus': 'add',

  // Prive screen icons
  'shield.fill': 'shield',
  'wallet.pass': 'account-balance-wallet',
  'star.fill': 'star',
  'qrcode': 'qr-code',
  'trophy.fill': 'emoji-events',
  'checkmark.circle': 'check-circle',
  'checkmark.circle.fill': 'check-circle',
  'eye': 'visibility',
  'clock': 'access-time',
  'gear': 'settings',

  // Shop icons
  'tshirt': 'checkroom',
  'bag': 'shopping-bag',
  'circle': 'circle',

  // Benefits & Services icons
  'percent': 'percent',
  'star': 'star-outline',
  'gift': 'card-giftcard',
  'checkmark.seal': 'verified',
  'checkmark.seal.fill': 'verified',
  'list.bullet': 'list',

  // Social / Feed icons
  'heart': 'favorite',
  'bubble.left': 'chat-bubble',
  'paperplane': 'send',

  // Document / placeholders
  'doc.text.image': 'insert-drive-file',

  // Other icons
  'paperplane.fill': 'send',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
