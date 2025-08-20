import { ApiService } from './api';
import { indexedDBService } from './indexedDB';
import { AuthService } from './auth';

export class SessionSyncService {
  static async syncSessions() {
    if (!AuthService.isAuthenticated()) return;
    
    try {
      const backendSessions = await ApiService.getUserSessions();
      
      // Store in IndexedDB for offline access
      if (backendSessions.sessions) {
        for (const session of backendSessions.sessions) {
          await indexedDBService.saveSession({
            ...session,
            userId: AuthService.getCurrentUserId()
          });
        }
      }
    } catch (error) {
      console.error('Failed to sync sessions:', error);
    }
  }

  static async getOfflineSessions() {
    const userId = AuthService.getCurrentUserId();
    if (!userId) return [];
    
    try {
      return await indexedDBService.getUserSessions(userId);
    } catch (error) {
      console.error('Failed to get offline sessions:', error);
      return [];
    }
  }

  static async getSessions() {
    if (AuthService.isAuthenticated()) {
      try {
        await this.syncSessions();
        const response = await ApiService.getUserSessions();
        return response.sessions || [];
      } catch (error) {
        console.error('Failed to get online sessions, falling back to offline:', error);
        return await this.getOfflineSessions();
      }
    } else {
      return await this.getOfflineSessions();
    }
  }
}