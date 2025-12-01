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
  const [isOpeningVpn, setIsOpeningVpn] = useState(false);

  if (status === 'online') {
    return null;
  }

  const { title, icon } =
    statusCopy[status === 'checking' ? 'checking' : status] || statusCopy['vpn-required'];

  const handleOpenVpn = async () => {
    setIsOpeningVpn(true);
    
    try {
      // Try to open WireGuard app with deep link directly
      // On Android, canOpenURL may return false even if app is installed,
      // so we try to open directly first
      const wireguardUrl = `wireguard://activate?tunnel=${encodeURIComponent(WIREGUARD_TUNNEL_NAME)}`;
      
      try {
        // Try to open WireGuard deep link directly
        await Linking.openURL(wireguardUrl);
        console.log('[VpnStatusBanner] WireGuard deep link opened');
        // Give it a moment, then check if it worked
        // If WireGuard is installed, it should open
        setTimeout(() => {
          setIsOpeningVpn(false);
        }, 500);
        return; // Exit early, let WireGuard handle it
      } catch (deepLinkError) {
        console.log('[VpnStatusBanner] WireGuard deep link failed, trying VPN settings:', deepLinkError);
      }
      
      // If deep link failed, try to open VPN settings
      if (Platform.OS === 'android') {
        // On Android, try multiple methods to open VPN settings
        try {
          // Method 1: Intent URI for VPN settings (most reliable)
          const vpnIntentUrl = 'intent:#Intent;action=android.settings.VPN_SETTINGS;end';
          await Linking.openURL(vpnIntentUrl);
          console.log('[VpnStatusBanner] VPN settings opened via intent URI');
          return;
        } catch (intentError) {
          console.log('[VpnStatusBanner] Intent URI failed, trying alternative method:', intentError);
          
          try {
            // Method 2: Alternative intent format
            const vpnIntentUrl2 = 'intent://settings/vpn#Intent;scheme=android.settings;action=android.settings.VPN_SETTINGS;end';
            await Linking.openURL(vpnIntentUrl2);
            console.log('[VpnStatusBanner] VPN settings opened via alternative intent');
            return;
          } catch (intentError2) {
            console.log('[VpnStatusBanner] Alternative intent failed, trying system settings:', intentError2);
            
            try {
              // Method 3: Open system settings (not app settings)
              // This opens Android system settings where user can navigate to VPN
              await Linking.openURL('android.settings.SETTINGS');
              console.log('[VpnStatusBanner] System settings opened');
              return;
            } catch (systemError) {
              console.warn('[VpnStatusBanner] System settings failed:', systemError);
            }
          }
        }
        
        // Final fallback: open app settings (not ideal, but better than nothing)
        console.log('[VpnStatusBanner] All methods failed, falling back to app settings');
        await Linking.openSettings();
      } else {
        // On iOS, open system settings (not app settings) for VPN
        try {
          // On iOS, we can try to open system settings directly
          await Linking.openURL('App-Prefs:root=General&path=VPN');
          console.log('[VpnStatusBanner] iOS VPN settings opened');
        } catch (iosError) {
          console.log('[VpnStatusBanner] iOS VPN settings failed, opening general settings:', iosError);
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
        console.warn('[VpnStatusBanner] Cannot open settings:', settingsError);
      }
    } finally {
      setIsOpeningVpn(false);
    }
  };

  const showSettingsButton = status === 'vpn-required';
  const showRetryButton = status !== 'checking';

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
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


