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
      // Try to open WireGuard app with deep link
      const wireguardUrl = `wireguard://activate?tunnel=${encodeURIComponent(WIREGUARD_TUNNEL_NAME)}`;
      
      // Check if WireGuard app can handle this URL
      const canOpen = await Linking.canOpenURL(wireguardUrl);
      
      if (canOpen) {
        // Open WireGuard app and activate tunnel
        const opened = await Linking.openURL(wireguardUrl);
        if (!opened) {
          // If deep link failed, fallback to settings
          await Linking.openSettings();
        }
      } else {
        // WireGuard app not installed or not configured, open system settings
        await Linking.openSettings();
      }
    } catch (error) {
      console.warn('Error opening VPN:', error);
      // Fallback to system settings
      try {
        await Linking.openSettings();
      } catch (settingsError) {
        console.warn('Cannot open settings:', settingsError);
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


