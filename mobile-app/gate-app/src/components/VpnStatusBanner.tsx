import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { GatewayStatus } from '../hooks/useGatewayReachability';
import { WIREGUARD_TUNNEL_NAME } from '../config/api.config';

interface Props {
  status: GatewayStatus;
  message?: string | null;
  onRetry: () => void;
}

const statusCopy: Record<
  Exclude<GatewayStatus, 'online'>,
  { title: string; icon: keyof typeof MaterialIcons.glyphMap }
> = {
  checking: { title: 'Sprawdzanie połączenia…', icon: 'autorenew' },
  'vpn-required': { title: 'Połącz się z VPN', icon: 'vpn-lock' },
  offline: { title: 'Brak internetu', icon: 'wifi-off' },
};

const VpnStatusBanner: React.FC<Props> = ({ status, message, onRetry }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isOpeningVpn, setIsOpeningVpn] = useState(false);

  if (status === 'online') {
    return null;
  }

  const { title, icon } =
    statusCopy[status === 'checking' ? 'checking' : status] || statusCopy['vpn-required'];

  const handleOpenVpn = async () => {
    setIsOpeningVpn(true);
    
    try {
      if (Platform.OS === 'android') {
        // On Android, try to open WireGuard app directly by package name
        try {
          // Method 1: Try to open WireGuard app directly
          const wireguardPackage = 'com.wireguard.android';
          const wireguardIntent = `intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;component=${wireguardPackage}/.ui.MainActivity;end`;
          await Linking.openURL(wireguardIntent);
          setTimeout(() => {
            setIsOpeningVpn(false);
          }, 500);
          return;
        } catch (intentError) {
          // Intent failed, try deep link
        }
        
        // Method 2: Try WireGuard deep link
        try {
          const wireguardUrl = `wireguard://activate?tunnel=${encodeURIComponent(WIREGUARD_TUNNEL_NAME)}`;
          await Linking.openURL(wireguardUrl);
          setTimeout(() => {
            setIsOpeningVpn(false);
          }, 500);
          return;
        } catch (deepLinkError) {
          // Deep link failed
        }
      } else {
        // On iOS, try WireGuard deep link
        try {
          const wireguardUrl = `wireguard://activate?tunnel=${encodeURIComponent(WIREGUARD_TUNNEL_NAME)}`;
          await Linking.openURL(wireguardUrl);
          setTimeout(() => {
            setIsOpeningVpn(false);
          }, 500);
          return;
        } catch (deepLinkError) {
          // Deep link failed
        }
      }
      
      // If deep link failed, try to open VPN settings
      if (Platform.OS === 'android') {
        // On Android, try multiple methods to open VPN settings
        try {
          // Method 1: Intent URI for VPN settings (most reliable)
          const vpnIntentUrl = 'intent:#Intent;action=android.settings.VPN_SETTINGS;end';
          await Linking.openURL(vpnIntentUrl);
          return;
        } catch (intentError) {
          try {
            // Method 2: Alternative intent format
            const vpnIntentUrl2 = 'intent://settings/vpn#Intent;scheme=android.settings;action=android.settings.VPN_SETTINGS;end';
            await Linking.openURL(vpnIntentUrl2);
            return;
          } catch (intentError2) {
            try {
              // Method 3: Open system settings (not app settings)
              await Linking.openURL('android.settings.SETTINGS');
              return;
            } catch (systemError) {
              // System settings failed
            }
          }
        }
        
        // Final fallback: open app settings
        await Linking.openSettings();
      } else {
        // On iOS, open system settings (not app settings) for VPN
        try {
          await Linking.openURL('App-Prefs:root=General&path=VPN');
        } catch (iosError) {
          // Fallback to general settings
          await Linking.openSettings();
        }
      }
    } catch (error) {
      console.error('[VpnStatusBanner] Error opening VPN:', error);
      // Final fallback to app settings
      try {
        await Linking.openSettings();
      } catch (settingsError) {
        // Settings failed
      }
    } finally {
      setIsOpeningVpn(false);
    }
  };

  const showSettingsButton = status === 'vpn-required';
  const showRetryButton = status !== 'checking';

  return (
    <View style={[styles.container, { backgroundColor: colors.card, paddingTop: Math.max(insets.top, 8) }]}>
      <View style={styles.iconWrapper}>
        {status === 'checking' ? (
          <ActivityIndicator color={colors.accent} size="small" />
        ) : (
          <MaterialIcons name={icon} size={24} color={colors.accent} />
        )}
      </View>
      <View style={styles.textWrapper}>
        <Text
          style={[
            styles.title,
            { color: colors.textPrimary, fontFamily: typography.fontFamily.semiBold },
          ]}
        >
          {title}
        </Text>
        {message ? (
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {message}
          </Text>
        ) : null}
      </View>
      <View style={styles.actions}>
        {showRetryButton && (
          <TouchableOpacity style={styles.actionButton} onPress={onRetry} activeOpacity={0.7}>
            <MaterialIcons name="refresh" size={20} color={colors.textPrimary} />
            <Text
              style={[
                styles.actionText,
                { color: colors.textPrimary, fontFamily: typography.fontFamily.medium },
              ]}
            >
              Odśwież
            </Text>
          </TouchableOpacity>
        )}
        {showSettingsButton && (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionSpacing]}
            onPress={handleOpenVpn}
            activeOpacity={0.7}
            disabled={isOpeningVpn}
          >
            {isOpeningVpn ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : (
              <>
                <MaterialIcons name="vpn-lock" size={20} color={colors.textPrimary} />
                <Text
                  style={[
                    styles.actionText,
                    { color: colors.textPrimary, fontFamily: typography.fontFamily.medium },
                  ]}
                >
                  {Platform.OS === 'ios' ? 'VPN' : 'Połącz VPN'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconWrapper: {
    marginRight: 12,
  },
  textWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    opacity: 0.8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionSpacing: {
    marginLeft: 4,
  },
  actionText: {
    fontSize: 12,
    marginLeft: 4,
  },
});

export default VpnStatusBanner;


