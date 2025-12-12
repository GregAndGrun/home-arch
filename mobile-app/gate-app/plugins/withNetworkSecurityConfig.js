const { withAndroidManifest, withDangerousMod, AndroidConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Plugin to add network security config to AndroidManifest.xml
 */
const withNetworkSecurityConfig = (config) => {
  // First, copy the network_security_config.xml file to the Android resources
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const xmlDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'xml');
      
      // Ensure xml directory exists
      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
      }
      
      // Copy network_security_config.xml if it doesn't exist
      const sourceFile = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'xml', 'network_security_config.xml');
      if (!fs.existsSync(sourceFile)) {
        const networkSecurityConfig = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Allow cleartext traffic for local network IPs -->
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    
    <!-- Specifically allow local network ranges -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">127.0.0.1</domain>
        <domain includeSubdomains="true">10.0.0.0</domain>
        <domain includeSubdomains="true">192.168.0.0</domain>
        <domain includeSubdomains="true">192.168.1.0</domain>
        <domain includeSubdomains="true">172.16.0.0</domain>
    </domain-config>
</network-security-config>`;
        
        fs.writeFileSync(sourceFile, networkSecurityConfig, 'utf8');
      }
      
      return config;
    },
  ]);

  // Then, add the networkSecurityConfig reference to AndroidManifest.xml
  config = withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const { manifest } = androidManifest;

    if (!manifest.application) {
      manifest.application = [{}];
    }

    const application = manifest.application[0];
    
    // Add networkSecurityConfig attribute
    if (!application.$) {
      application.$ = {};
    }
    
    // Set network security config
    application.$['android:networkSecurityConfig'] = '@xml/network_security_config';

    return config;
  });

  return config;
};

module.exports = withNetworkSecurityConfig;

