import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// WireGuard app identifiers
const WIREGUARD_IOS_BUNDLE_ID = 'com.wireguard.ios';
const WIREGUARD_ANDROID_PACKAGE = 'com.wireguard.android';

// Keywords that indicate VPN connection status in notifications
const VPN_CONNECTED_KEYWORDS = ['connected', 'połączono', 'aktywny', 'active', 'on'];
const VPN_DISCONNECTED_KEYWORDS = ['disconnected', 'rozłączono', 'nieaktywny', 'inactive', 'off'];

export type VpnNotificationType = 'connected' | 'disconnected' | 'unknown';

export interface VpnNotification {
  type: VpnNotificationType;
  tunnelName?: string;
  timestamp: number;
}

class NotificationService {
  private listeners: Array<(notification: VpnNotification) => void> = [];
  private isInitialized = false;

  /**
   * Initialize notification service and request permissions
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      // Request notification permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      // Configure notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });

      // Set up notification received listener
      Notifications.addNotificationReceivedListener((notification) => {
        this.handleNotification(notification);
      });

      // Set up notification response listener (when user taps notification)
      Notifications.addNotificationResponseReceivedListener((response) => {
        this.handleNotification(response.notification);
      });

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing NotificationService:', error);
      return false;
    }
  }

  /**
   * Check if notification is from WireGuard
   */
  private isWireGuardNotification(notification: Notifications.Notification): boolean {
    const request = notification.request;
    
    // Check iOS bundle identifier
    if (Platform.OS === 'ios' && request.identifier) {
      // On iOS, we check the notification's origin
      // WireGuard notifications might have specific identifiers
      return request.identifier.includes('wireguard') || 
             request.identifier.includes('vpn');
    }

    // Check Android package name
    if (Platform.OS === 'android') {
      // On Android, we can check the notification's origin
      // This is more complex and might require checking notification extras
      const data = notification.request.content.data;
      if (data?.packageName) {
        return data.packageName === WIREGUARD_ANDROID_PACKAGE;
      }
    }

    // Fallback: Check notification title/body for WireGuard keywords
    const title = notification.request.content.title?.toLowerCase() || '';
    const body = notification.request.content.body?.toLowerCase() || '';
    const combined = `${title} ${body}`;

    return combined.includes('wireguard') || 
           combined.includes('vpn') ||
           combined.includes('tunnel');
  }

  /**
   * Parse VPN status from notification
   */
  private parseVpnStatus(notification: Notifications.Notification): VpnNotification | null {
    if (!this.isWireGuardNotification(notification)) {
      return null;
    }

    const title = notification.request.content.title?.toLowerCase() || '';
    const body = notification.request.content.body?.toLowerCase() || '';
    const combined = `${title} ${body}`;

    // Extract tunnel name (usually in format "Tunnel Name - Connected" or similar)
    let tunnelName: string | undefined;
    const tunnelMatch = combined.match(/(?:tunnel|tunel)[\s:]+([^\s-]+)/i);
    if (tunnelMatch) {
      tunnelName = tunnelMatch[1];
    }

    // Determine connection status
    let type: VpnNotificationType = 'unknown';
    
    if (VPN_CONNECTED_KEYWORDS.some(keyword => combined.includes(keyword))) {
      type = 'connected';
    } else if (VPN_DISCONNECTED_KEYWORDS.some(keyword => combined.includes(keyword))) {
      type = 'disconnected';
    }

    return {
      type,
      tunnelName,
      timestamp: Date.now(),
    };
  }

  /**
   * Handle incoming notification
   */
  private handleNotification(notification: Notifications.Notification) {
    const vpnNotification = this.parseVpnStatus(notification);
    
    if (vpnNotification) {
      console.log('WireGuard VPN notification detected:', vpnNotification);
      this.notifyListeners(vpnNotification);
    }
  }

  /**
   * Subscribe to VPN notifications
   */
  subscribe(callback: (notification: VpnNotification) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(notification: VpnNotification) {
    this.listeners.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  /**
   * Get last notification (for testing/debugging)
   */
  async getLastNotification(): Promise<Notifications.Notification | null> {
    try {
      const notifications = await Notifications.getLastNotificationResponseAsync();
      return notifications?.notification || null;
    } catch (error) {
      console.error('Error getting last notification:', error);
      return null;
    }
  }
}

export default new NotificationService();

