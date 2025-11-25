import * as LocalAuthentication from 'expo-local-authentication';

export class BiometricsService {
  static async isBiometricsAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Error checking biometrics availability:', error);
      return false;
    }
  }

  static async getSupportedAuthenticationTypes(): Promise<number[]> {
    try {
      return await LocalAuthentication.supportedAuthenticationTypesAsync();
    } catch (error) {
      console.error('Error getting supported authentication types:', error);
      return [];
    }
  }

  static async authenticate(
    promptMessage: string = 'Authenticate to access gates'
  ): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });

      return result.success;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }

  static getAuthenticationTypeText(types: number[]): string {
    const typeTexts: string[] = [];

    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      typeTexts.push('Fingerprint');
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      typeTexts.push('Face ID');
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      typeTexts.push('Iris');
    }

    return typeTexts.length > 0 ? typeTexts.join(', ') : 'Device credentials';
  }
}

