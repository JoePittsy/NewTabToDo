import type { BackupPayload, CloudBackupService } from "./CloudBackupService";

/**
 * Dropbox implementation of CloudBackupService.
 *
 * This uses the Dropbox HTTP API + PKCE OAuth2 flow (client-side safe).
 * See: https://www.dropbox.com/developers/documentation/http/documentation
 */
export class DropboxBackupService implements CloudBackupService {
  private accessToken: string | null = null;

  getProviderName(): string {
    return "dropbox";
  }

  /**
   * Authenticate using Dropbox OAuth2 with PKCE flow.
   * Redirects user to Dropbox authorization page, then stores access token.
   */
  async authenticate(): Promise<void> {
    // Check localStorage token first
    const stored = localStorage.getItem("dropboxAccessToken");
    if (stored) {
      this.accessToken = stored;
      return;
    }

    // Already authenticated in memory
    if (this.accessToken) return;

    // Step 1: generate code verifier and challenge
    const codeVerifier = this.randomString(64);
    const codeChallenge = await this.sha256base64url(codeVerifier);

    localStorage.setItem("dropbox_code_verifier", codeVerifier);

    const clientId = "yj55ji2tb6o3bx2"; // TODO: replace with your Dropbox App Key
    // Redirect specifically to /dropbox_auth route so we can handle callback there
    const redirectUri = window.location.origin + "/dropbox_auth";

    const authUrl = new URL("https://www.dropbox.com/oauth2/authorize");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");
    authUrl.searchParams.set("token_access_type", "offline");

    // Step 2: if no code param in URL, redirect user to Dropbox OAuth
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) {
      window.location.href = authUrl.toString();
      return;
    }

    // Step 3: exchange authorization code for token
    const storedVerifier = localStorage.getItem("dropbox_code_verifier");
    if (!storedVerifier) {
      throw new Error("Missing PKCE code verifier");
    }
    const tokenResp = await fetch("https://api.dropboxapi.com/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        client_id: clientId,
        redirect_uri: redirectUri,
        code_verifier: storedVerifier,
      }),
    });

    if (!tokenResp.ok) {
      throw new Error("Dropbox auth failed: " + (await tokenResp.text()));
    }
    const tokenData = await tokenResp.json();
    this.accessToken = tokenData.access_token ?? null;
    if (this.accessToken) {
      localStorage.setItem("dropboxAccessToken", this.accessToken);
    }

    // Clean up query params
    window.history.replaceState({}, document.title, redirectUri);
  }

  private randomString(length: number): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map(
        (b) =>
          "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[
            b % 62
          ]
      )
      .join("");
  }

  private async sha256base64url(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hash = await crypto.subtle.digest("SHA-256", data);
    const bytes = new Uint8Array(hash);
    let str = "";
    for (const b of bytes) str += String.fromCharCode(b);
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  private async apiRequest(
    path: string,
    method: "POST" | "GET",
    body?: any,
    contentType: string = "application/json"
  ): Promise<any> {
    if (!this.accessToken) {
      throw new Error("Not authenticated with Dropbox.");
    }
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": contentType,
    };
    if (body && contentType === "application/octet-stream" && body.args) {
      headers["Dropbox-API-Arg"] = JSON.stringify(body.args);
    }

    const res = await fetch(`https://content.dropboxapi.com/2/files/${path}`, {
      method,
      headers,
      body: body?.data
        ? body.data
        : contentType === "application/json"
        ? JSON.stringify(body)
        : undefined,
    });

    if (!res.ok) {
      throw new Error(`Dropbox API error: ${res.status} ${await res.text()}`);
    }
    return await res.json().catch(() => undefined);
  }

  async uploadBackup(data: BackupPayload, filename: string): Promise<void> {
    const fileContent = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const arrayBuffer = await fileContent.arrayBuffer();

    await this.apiRequest(
      "upload",
      "POST",
      {
        args: {
          path: `/${filename}`,
          mode: "overwrite",
          autorename: false,
          mute: false,
          strict_conflict: false,
        },
        data: arrayBuffer,
      },
      "application/octet-stream"
    );
  }

  async downloadBackup(filename: string): Promise<BackupPayload> {
    if (!this.accessToken) throw new Error("Not authenticated with Dropbox.");

    const res = await fetch("https://content.dropboxapi.com/2/files/download", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Dropbox-API-Arg": JSON.stringify({ path: `/${filename}` }),
      },
    });

    if (!res.ok) {
      throw new Error(`Unable to download backup: ${res.statusText}`);
    }

    return await res.json();
  }

  async listBackups(): Promise<string[]> {
    const res = await fetch("https://api.dropboxapi.com/2/files/list_folder", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path: "" }),
    });

    if (!res.ok) {
      throw new Error(`Unable to list backups: ${res.statusText}`);
    }

    const json = await res.json();
    return json.entries
      .filter((e: any) => e[".tag"] === "file")
      .map((f: any) => f.name);
  }

  async deleteBackup(filename: string): Promise<void> {
    const res = await fetch("https://api.dropboxapi.com/2/files/delete_v2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path: `/${filename}` }),
    });

    if (!res.ok) {
      throw new Error(`Unable to delete backup: ${res.statusText}`);
    }
  }

  isConnected(): boolean {
    return !!(this.accessToken || localStorage.getItem("dropboxAccessToken"));
  }

  disconnect(): void {
    this.accessToken = null;
    localStorage.removeItem("dropboxAccessToken");
  }
}
