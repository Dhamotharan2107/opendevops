import type { Env } from '../types';

export class StorageService {
  constructor(private env: Env) {}

  async upload(file: Blob, fileName: string, contentType: string): Promise<string> {
    const authResponse = await fetch(
      'https://api.backblazeb2.com/b2api/v2/b2_authorize_account',
      {
        headers: {
          Authorization: `Basic ${btoa(`${this.env.BACKBLAZE_KEY_ID}:${this.env.BACKBLAZE_APP_KEY}`)}`,
        },
      },
    );

    if (!authResponse.ok) {
      throw new Error('Backblaze B2 authorization failed');
    }

    const auth = await authResponse.json() as {
      apiUrl: string;
      authorizationToken: string;
      downloadUrl: string;
    };

    const uploadUrlResponse = await fetch(
      `${auth.apiUrl}/b2api/v2/b2_get_upload_url`,
      {
        method: 'POST',
        headers: {
          Authorization: auth.authorizationToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bucketId: this.env.BACKBLAZE_BUCKET }),
      },
    );

    if (!uploadUrlResponse.ok) {
      throw new Error('Failed to get B2 upload URL');
    }

    const uploadUrl = await uploadUrlResponse.json() as {
      uploadUrl: string;
      authorizationToken: string;
    };

    const arrayBuffer = await file.arrayBuffer();
    const sha1 = await this.sha1Hex(arrayBuffer);

    const uploadResponse = await fetch(uploadUrl.uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: uploadUrl.authorizationToken,
        'X-Bz-File-Name': encodeURIComponent(fileName),
        'Content-Type': contentType,
        'Content-Length': String(arrayBuffer.byteLength),
        'X-Bz-Content-Sha1': sha1,
      },
      body: arrayBuffer,
    });

    if (!uploadResponse.ok) {
      throw new Error('B2 file upload failed');
    }

    return `${auth.downloadUrl}/file/${this.env.BACKBLAZE_BUCKET}/${encodeURIComponent(fileName)}`;
  }

  private async sha1Hex(buffer: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
