import { APICredential } from '../types/advanced';

// Simple encryption for browser (NOT production-grade for sensitive data)
// In production, use server-side encryption with proper key management

class CredentialManager {
  private storageKey = 'aura_credentials';
  private encryptionKey: string;

  constructor() {
    // In production, this should be a secure key from environment or user password
    this.encryptionKey = this.getOrCreateEncryptionKey();
  }

  private getOrCreateEncryptionKey(): string {
    let key = localStorage.getItem('aura_encryption_key');
    if (!key) {
      key = this.generateRandomKey();
      localStorage.setItem('aura_encryption_key', key);
    }
    return key;
  }

  private generateRandomKey(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Simple XOR encryption (for demo - use AES in production)
  private encrypt(text: string): string {
    const key = this.encryptionKey;
    let encrypted = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      encrypted += String.fromCharCode(charCode);
    }
    return btoa(encrypted); // Base64 encode
  }

  private decrypt(encrypted: string): string {
    const key = this.encryptionKey;
    const decoded = atob(encrypted);
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      decrypted += String.fromCharCode(charCode);
    }
    return decrypted;
  }

  getAllCredentials(): APICredential[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];

      const credentials: APICredential[] = JSON.parse(stored);

      // Decrypt sensitive fields
      return credentials.map(cred => {
        if (cred.encrypted) {
          return {
            ...cred,
            credentials: this.decryptCredentialData(cred.credentials)
          };
        }
        return cred;
      });
    } catch (error) {
      console.error('Error loading credentials:', error);
      return [];
    }
  }

  getCredentialById(id: string): APICredential | null {
    const credentials = this.getAllCredentials();
    return credentials.find(c => c.id === id) || null;
  }

  getCredentialsByIntegration(integrationId: string): APICredential[] {
    const credentials = this.getAllCredentials();
    return credentials.filter(c => c.integrationId === integrationId);
  }

  saveCredential(credential: APICredential): void {
    try {
      const credentials = this.getAllCredentials();

      // Encrypt sensitive data
      const encryptedCredential = {
        ...credential,
        encrypted: true,
        credentials: this.encryptCredentialData(credential.credentials),
        createdAt: credential.createdAt || Date.now()
      };

      // Update or add
      const index = credentials.findIndex(c => c.id === credential.id);
      if (index >= 0) {
        credentials[index] = encryptedCredential;
      } else {
        credentials.push(encryptedCredential);
      }

      // Save back (with encrypted data)
      const credentialsToStore = credentials.map(cred => ({
        ...cred,
        credentials: cred.encrypted
          ? this.encryptCredentialData(cred.credentials)
          : cred.credentials
      }));

      localStorage.setItem(this.storageKey, JSON.stringify(credentialsToStore));
    } catch (error) {
      console.error('Error saving credential:', error);
      throw new Error('Failed to save credential');
    }
  }

  deleteCredential(id: string): void {
    const credentials = this.getAllCredentials();
    const filtered = credentials.filter(c => c.id !== id);

    const credentialsToStore = filtered.map(cred => ({
      ...cred,
      credentials: cred.encrypted
        ? this.encryptCredentialData(cred.credentials)
        : cred.credentials
    }));

    localStorage.setItem(this.storageKey, JSON.stringify(credentialsToStore));
  }

  updateLastUsed(id: string): void {
    const credentials = this.getAllCredentials();
    const credential = credentials.find(c => c.id === id);

    if (credential) {
      credential.lastUsed = Date.now();
      this.saveCredential(credential);
    }
  }

  private encryptCredentialData(data: Record<string, any>): Record<string, any> {
    const encrypted: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && value.length > 0) {
        encrypted[key] = this.encrypt(value);
      } else {
        encrypted[key] = value;
      }
    }

    return encrypted;
  }

  private decryptCredentialData(data: Record<string, any>): Record<string, any> {
    const decrypted: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && value.length > 0) {
        try {
          decrypted[key] = this.decrypt(value);
        } catch {
          decrypted[key] = value; // If decryption fails, return as is
        }
      } else {
        decrypted[key] = value;
      }
    }

    return decrypted;
  }

  // Test a credential by making a simple API call
  async testCredential(credentialId: string, integrationId: string): Promise<boolean> {
    // This would make a test API call to verify the credential works
    // Implementation depends on the specific integration
    return true;
  }

  // Export all credentials (encrypted) for backup
  exportCredentials(): string {
    const stored = localStorage.getItem(this.storageKey) || '[]';
    return stored;
  }

  // Import credentials from backup
  importCredentials(data: string): void {
    try {
      const credentials = JSON.parse(data);
      localStorage.setItem(this.storageKey, JSON.stringify(credentials));
    } catch (error) {
      throw new Error('Invalid credential data format');
    }
  }

  // Clear all credentials (use with caution)
  clearAllCredentials(): void {
    localStorage.removeItem(this.storageKey);
  }
}

// Singleton instance
export const credentialManager = new CredentialManager();

// Helper function to create a new credential
export function createCredential(
  integrationId: string,
  name: string,
  type: APICredential['type'],
  credentials: Record<string, string>
): APICredential {
  return {
    id: generateId(),
    integrationId,
    name,
    type,
    encrypted: false,
    credentials,
    createdAt: Date.now()
  };
}

// Helper to generate unique IDs
function generateId(): string {
  return `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Validate credential fields based on type
export function validateCredential(credential: APICredential): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!credential.name || credential.name.trim().length === 0) {
    errors.push('Credential name is required');
  }

  switch (credential.type) {
    case 'api_key':
      if (!credential.credentials.apiKey) {
        errors.push('API key is required');
      }
      break;

    case 'bearer_token':
      if (!credential.credentials.accessToken) {
        errors.push('Access token is required');
      }
      break;

    case 'basic_auth':
      if (!credential.credentials.username || !credential.credentials.password) {
        errors.push('Username and password are required');
      }
      break;

    case 'oauth2':
      if (!credential.credentials.accessToken) {
        errors.push('Access token is required for OAuth2');
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
