import * as SQLite from 'expo-sqlite';

export interface DeviceActivity {
  id: number;
  deviceId: string;
  deviceName: string;
  deviceType: string;
  action: string;
  timestamp: number;
}

class ActivityService {
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized && this.db) {
      return;
    }

    try {
      this.db = await SQLite.openDatabaseAsync('activity.db');
      
      // Create activities table if it doesn't exist
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS activities (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          deviceId TEXT NOT NULL,
          deviceName TEXT NOT NULL,
          deviceType TEXT NOT NULL,
          action TEXT NOT NULL,
          timestamp INTEGER NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_deviceId ON activities(deviceId);
        CREATE INDEX IF NOT EXISTS idx_timestamp ON activities(timestamp);
      `);
      
      this.initialized = true;
      console.log('[ActivityService] Database initialized successfully');
    } catch (error) {
      console.error('[ActivityService] Failed to initialize database:', error);
      // Don't throw error - allow app to continue without database
      // Database operations will gracefully fail if not initialized
      this.initialized = false;
      this.db = null;
    }
  }

  async recordActivity(
    deviceId: string,
    deviceName: string,
    deviceType: string,
    action: string = 'used'
  ): Promise<void> {
    try {
      await this.initialize();
      
      if (!this.db || !this.initialized) {
        console.warn('[ActivityService] Database not initialized, skipping activity record');
        return;
      }

      const timestamp = Date.now();
      
      await this.db.runAsync(
        'INSERT INTO activities (deviceId, deviceName, deviceType, action, timestamp) VALUES (?, ?, ?, ?, ?)',
        [deviceId, deviceName, deviceType, action, timestamp]
      );
    } catch (error) {
      console.error('[ActivityService] Failed to record activity:', error);
      // Don't throw - allow app to continue
    }
  }

  async getDeviceActivity(deviceId: string, limit: number = 10): Promise<DeviceActivity[]> {
    try {
      await this.initialize();
      
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const result = await this.db.getAllAsync<DeviceActivity>(
        'SELECT * FROM activities WHERE deviceId = ? ORDER BY timestamp DESC LIMIT ?',
        [deviceId, limit]
      );

      return result || [];
    } catch (error) {
      console.error('[ActivityService] Failed to get device activity:', error);
      return [];
    }
  }

  async getLastActivity(deviceId: string): Promise<DeviceActivity | null> {
    try {
      await this.initialize();
      
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const result = await this.db.getFirstAsync<DeviceActivity>(
        'SELECT * FROM activities WHERE deviceId = ? ORDER BY timestamp DESC LIMIT 1',
        [deviceId]
      );

      return result || null;
    } catch (error) {
      console.error('[ActivityService] Failed to get last activity:', error);
      return null;
    }
  }

  async getAllActivities(limit: number = 50): Promise<DeviceActivity[]> {
    try {
      await this.initialize();
      
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const result = await this.db.getAllAsync<DeviceActivity>(
        'SELECT * FROM activities ORDER BY timestamp DESC LIMIT ?',
        [limit]
      );

      return result || [];
    } catch (error) {
      console.error('[ActivityService] Failed to get all activities:', error);
      return [];
    }
  }

  async getActivitiesByDateRange(startDate: number, endDate: number): Promise<DeviceActivity[]> {
    try {
      await this.initialize();
      
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const result = await this.db.getAllAsync<DeviceActivity>(
        'SELECT * FROM activities WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp DESC',
        [startDate, endDate]
      );

      return result || [];
    } catch (error) {
      console.error('[ActivityService] Failed to get activities by date range:', error);
      return [];
    }
  }

  async getTodayActivities(deviceId?: string): Promise<DeviceActivity[]> {
    // Use local timezone (Poland) for today's date range
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (deviceId) {
      const allActivities = await this.getActivitiesByDateRange(startOfDay.getTime(), endOfDay.getTime());
      return allActivities.filter(activity => activity.deviceId === deviceId);
    }

    return this.getActivitiesByDateRange(startOfDay.getTime(), endOfDay.getTime());
  }

  async clearOldActivities(daysToKeep: number = 30): Promise<void> {
    try {
      await this.initialize();
      
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
      
      await this.db.runAsync(
        'DELETE FROM activities WHERE timestamp < ?',
        [cutoffDate]
      );
    } catch (error) {
      console.error('[ActivityService] Failed to clear old activities:', error);
    }
  }

  async clearAllActivities(): Promise<void> {
    try {
      await this.initialize();
      
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      await this.db.runAsync('DELETE FROM activities');
    } catch (error) {
      console.error('[ActivityService] Failed to clear all activities:', error);
    }
  }
}

export default new ActivityService();

