export class GoogleDriveService {
  private clientId: string;
  private token: string | null = null;
  private readonly SCOPES = 'https://www.googleapis.com/auth/drive.file';

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  // Dynamically load the Google Identity Services script
  async init(): Promise<void> {
    if (window.google?.accounts?.oauth2) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.body.appendChild(script);
    });
  }

  private async getAccessToken(): Promise<string> {
    if (this.token) return this.token;

    return new Promise((resolve, reject) => {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: this.SCOPES,
          callback: (response: any) => {
            if (response.error !== undefined) {
              reject(response);
            }
            this.token = response.access_token;
            resolve(response.access_token);
          },
        });
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (err) {
        reject(err);
      }
    });
  }

  async findBackupFile(token: string): Promise<string | null> {
    const response = await fetch(
      "https://www.googleapis.com/drive/v3/files?q=name='pocketwise_backup.json' and trashed=false&spaces=drive&fields=files(id, name)",
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    const data = await response.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  }

  async uploadBackup(jsonData: string): Promise<boolean> {
    try {
      await this.init();
      const token = await this.getAccessToken();
      
      const fileId = await this.findBackupFile(token);
      
      const metadata = {
        name: 'pocketwise_backup.json',
        mimeType: 'application/json'
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([jsonData], { type: 'application/json' }));

      const url = fileId 
        ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart` 
        : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        
      const method = fileId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });

      return res.ok;
    } catch (error) {
      console.error('Google Drive Upload Error:', error);
      return false;
    }
  }

  async downloadBackup(): Promise<any | null> {
    try {
      await this.init();
      const token = await this.getAccessToken();
      
      const fileId = await this.findBackupFile(token);
      if (!fileId) return null;

      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to download file');
      
      return await response.json();
    } catch (error) {
      console.error('Google Drive Download Error:', error);
      return null;
    }
  }
}

// Global declaration for Google script
declare global {
  interface Window {
    google: any;
  }
}
