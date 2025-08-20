import { indexedDBService } from './indexedDB';

export class AuthService {
  static isTokenExpired(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  static isAuthenticated() {
    const token = localStorage.getItem('access_token');
    return token && !this.isTokenExpired(token);
  }

  static getCurrentUserId() {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.user_id;
    } catch {
      return null;
    }
  }

  static async logout() {
    const userId = this.getCurrentUserId();
    
    localStorage.removeItem('access_token');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    
    if (userId) {
      await indexedDBService.clearUserData(userId);
    }
  }

  static setToken(token) {
    localStorage.setItem('access_token', token);
  }
}