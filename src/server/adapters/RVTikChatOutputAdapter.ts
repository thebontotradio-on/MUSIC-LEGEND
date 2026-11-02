import { exec } from 'node:child_process';
import type { IRVTikChatOutputAdapter } from './IRVTikChatOutputAdapter.js';
import type { RVTikChatOutputStatus, RVTikChatCommandRecord, RVTikChatOutputMode } from '../types.js';

export class RVTikChatOutputAdapter implements IRVTikChatOutputAdapter {
  private enabled: boolean = true;
  private autoSendEnabled: boolean = false;
  private activeMode: RVTikChatOutputMode = 'CLIPBOARD_ASSIST';
  private targetWindowPattern: string = 'TikTok';
  private bridgeEndpoint: string = 'http://127.0.0.1:4321/chat/send';
  private authorizedSenders: string[] = ['thebontotradio', 'thebontotradio-on', 'adhy', 'host_adhy', 'host', 'bontotstudio', 'admin'];
  private recentCommands: RVTikChatCommandRecord[] = [];
  private lastCommand?: RVTikChatCommandRecord;

  constructor(options?: {
    autoSendEnabled?: boolean;
    activeMode?: RVTikChatOutputMode;
    bridgeEndpoint?: string;
    authorizedSenders?: string[];
  }) {
    if (options?.autoSendEnabled !== undefined) {
      this.autoSendEnabled = options.autoSendEnabled;
    }
    if (options?.activeMode) {
      this.activeMode = options.activeMode;
    }
    if (options?.bridgeEndpoint) {
      this.bridgeEndpoint = options.bridgeEndpoint;
    }
    if (options?.authorizedSenders) {
      this.setAuthorizedSenders(options.authorizedSenders);
    }
  }

  public getStatus(): RVTikChatOutputStatus {
    return {
      enabled: this.enabled,
      autoSendEnabled: this.autoSendEnabled,
      activeMode: this.activeMode,
      targetWindowPattern: this.targetWindowPattern,
      recentCommands: [...this.recentCommands],
      lastCommand: this.lastCommand
    };
  }

  public setAuthorizedSenders(senders: string[]): void {
    if (Array.isArray(senders)) {
      this.authorizedSenders = senders.map((s) => s.trim().toLowerCase()).filter(Boolean);
    }
  }

  public getAuthorizedSenders(): string[] {
    return [...this.authorizedSenders];
  }

  public setMode(mode: RVTikChatOutputMode): void {
    this.activeMode = mode;
  }

  public setAutoSend(enabled: boolean): void {
    this.autoSendEnabled = enabled;
  }

  public setTargetWindowPattern(pattern: string): void {
    this.targetWindowPattern = pattern;
  }

  public setBridgeEndpoint(endpoint: string): void {
    this.bridgeEndpoint = endpoint;
  }

  public formatCommand(title: string, artist: string): string {
    const cleanTitle = (title || '').replace(/[\r\n\t]/g, ' ').trim();
    const cleanArtist = (artist || '').replace(/[\r\n\t]/g, ' ').trim();
    return `!play ${cleanTitle} ${cleanArtist}`.trim();
  }

  public prepareCommand(title: string, artist: string, winnerNickname?: string): RVTikChatCommandRecord {
    const commandText = this.formatCommand(title, artist);
    const id = `rvtik_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const record: RVTikChatCommandRecord = {
      id,
      command: commandText,
      songTitle: title,
      artist: artist,
      winnerNickname,
      mode: this.activeMode,
      status: 'PENDING',
      sentAt: Date.now(),
      verifiedInChat: false
    };

    this.lastCommand = record;
    this.recentCommands.unshift(record);
    if (this.recentCommands.length > 20) {
      this.recentCommands.pop();
    }

    if (this.autoSendEnabled) {
      this.dispatchCommand(record.id).catch((err) => {
        console.warn('[RVTikChatOutputAdapter] Auto-dispatch failed:', err);
      });
    }

    return record;
  }

  public async dispatchCommand(commandId?: string, forceMode?: RVTikChatOutputMode): Promise<RVTikChatCommandRecord> {
    const targetRecord = commandId
      ? this.recentCommands.find((r) => r.id === commandId)
      : this.lastCommand;

    if (!targetRecord) {
      throw new Error('No command record found to dispatch.');
    }

    const mode = forceMode || this.activeMode;
    targetRecord.mode = mode;
    targetRecord.sentAt = Date.now();

    try {
      if (mode === 'CLIPBOARD_ASSIST') {
        await this.copyToClipboard(targetRecord.command);
        targetRecord.status = 'COPIED_TO_CLIPBOARD';
      } else if (mode === 'WINDOW_AUTOMATION') {
        const injected = await this.injectToWindow(targetRecord.command, this.targetWindowPattern);
        if (injected.success) {
          targetRecord.status = 'SENT';
        } else {
          targetRecord.status = 'FAILED';
          targetRecord.errorMessage = injected.error || 'Window automation injection failed.';
        }
      } else if (mode === 'DIRECT_BRIDGE') {
        const sent = await this.sendToBridge(targetRecord.command);
        if (sent.success) {
          targetRecord.status = 'SENT';
        } else {
          targetRecord.status = 'FAILED';
          targetRecord.errorMessage = sent.error || 'Bridge endpoint unreachable.';
        }
      } else if (mode === 'SIMULATION') {
        targetRecord.status = 'SENT';
      }
    } catch (err: any) {
      targetRecord.status = 'FAILED';
      targetRecord.errorMessage = err.message || 'Unknown dispatch error';
    }

    return targetRecord;
  }

  public verifyIncomingMessage(message: string, username: string, timestamp?: number): boolean {
    if (!this.lastCommand || this.lastCommand.verifiedInChat) {
      return false;
    }

    const normUsername = (username || '').trim().toLowerCase();
    const isAuthorized = this.authorizedSenders.some(
      (auth) => normUsername === auth || normUsername.startsWith('host_') || normUsername === 'host'
    );

    // Reject if sender is not host/authorized account
    if (!isAuthorized) {
      return false;
    }

    // Exact command syntax correlation
    const normIncoming = (message || '').trim().toLowerCase();
    const normCommand = this.lastCommand.command.trim().toLowerCase();

    if (normIncoming !== normCommand) {
      return false;
    }

    // Correlation timing check: message must arrive within reasonable window of dispatch
    // Default window: 120 seconds, with up to 5s clock skew tolerance before dispatch
    const eventTime = timestamp || Date.now();
    const diff = eventTime - this.lastCommand.sentAt;
    if (diff < -5000 || diff > 120_000) {
      return false;
    }

    this.lastCommand.verifiedInChat = true;
    return true;
  }

  public clearHistory(): void {
    this.recentCommands = [];
    this.lastCommand = undefined;
  }

  private copyToClipboard(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (process.platform === 'win32') {
        const escaped = text.replace(/"/g, '`"');
        const cmd = `powershell.exe -NoProfile -NonInteractive -Command "Set-Clipboard -Value \\"${escaped}\\""`;
        exec(cmd, () => resolve());
      } else {
        resolve();
      }
    });
  }

  private injectToWindow(text: string, windowTitleSubstring: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (process.platform !== 'win32') {
        return resolve({ success: false, error: 'Desktop window automation only supported on Windows.' });
      }

      const escapedText = text.replace(/"/g, '`"');
      const escapedPattern = windowTitleSubstring.replace(/"/g, '`"');

      // Safe PowerShell script: finds process, checks MainWindowTitle, brings to foreground, pastes, and simulates Enter
      const psScript = `
        Add-Type -AssemblyName Microsoft.VisualBasic
        Add-Type -AssemblyName System.Windows.Forms
        $proc = Get-Process | Where-Object { $_.MainWindowTitle -like "*${escapedPattern}*" } | Select-Object -First 1
        if (-not $proc) {
          Write-Output "WINDOW_NOT_FOUND"
          exit 1
        }
        [Microsoft.VisualBasic.Interaction]::AppActivate($proc.Id)
        Start-Sleep -Milliseconds 150
        [System.Windows.Forms.SendKeys]::SendWait("${escapedText}{ENTER}")
        Write-Output "SUCCESS"
      `.trim();

      const cmd = `powershell.exe -NoProfile -NonInteractive -Command "${psScript.replace(/\r?\n/g, '; ')}"`;
      exec(cmd, { timeout: 3000 }, (err, stdout) => {
        if (err || stdout.includes('WINDOW_NOT_FOUND')) {
          resolve({
            success: false,
            error: `Jendela aplikasi TikTok ("${windowTitleSubstring}") tidak ditemukan di desktop. Buka TikTok Live Studio / Web terlebih dahulu.`
          });
        } else {
          resolve({ success: true });
        }
      });
    });
  }

  private async sendToBridge(command: string): Promise<{ success: boolean; error?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const res = await fetch(this.bridgeEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: command }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        return { success: true };
      }
      return { success: false, error: `Bridge returned HTTP ${res.status}` };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to connect to bridge' };
    }
  }
}

