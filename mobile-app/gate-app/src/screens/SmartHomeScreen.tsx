import React from 'react';
import HomeScreen from './HomeScreen';

interface SmartHomeScreenProps {
  onCategoryPress: (category: any) => void;
  onDevicePress: (device: any) => void;
  onLogout: () => void;
  onBack?: () => void;
}

// SmartHomeScreen is a wrapper around HomeScreen
// This allows us to keep the existing smart home functionality
// while making it a category within the larger app
const SmartHomeScreen: React.FC<SmartHomeScreenProps> = ({ onBack, ...props }) => {
  return <HomeScreen {...props} onBack={onBack} />;
};

export default SmartHomeScreen;

