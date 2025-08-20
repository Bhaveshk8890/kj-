class IndexedDBService {
  constructor() {
    this.dbName = 'ChatAppDB';
    this.version = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('userId', 'userId', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
          messageStore.createIndex('sessionId', 'sessionId', { unique: false });
        }
      };
    });
  }

  async saveSession(session) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['sessions'], 'readwrite');
    const store = transaction.objectStore('sessions');
    await store.put(session);
  }

  async getUserSessions(userId) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['sessions'], 'readonly');
      const store = transaction.objectStore('sessions');
      const index = store.index('userId');
      const request = index.getAll(userId);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearUserData(userId) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['sessions', 'messages'], 'readwrite');
    const sessionStore = transaction.objectStore('sessions');
    const messageStore = transaction.objectStore('messages');
    
    // Clear user sessions
    const sessionIndex = sessionStore.index('userId');
    const sessionRequest = sessionIndex.getAllKeys(userId);
    
    sessionRequest.onsuccess = () => {
      sessionRequest.result.forEach(key => sessionStore.delete(key));
    };
    
    // Clear user messages
    const sessions = await this.getUserSessions(userId);
    sessions.forEach(session => {
      const messageIndex = messageStore.index('sessionId');
      const messageRequest = messageIndex.getAllKeys(session.id);
      
      messageRequest.onsuccess = () => {
        messageRequest.result.forEach(key => messageStore.delete(key));
      };
    });
  }
}

export const indexedDBService = new IndexedDBService();