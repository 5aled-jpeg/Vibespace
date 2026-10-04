/**
 * High-Precision Media Drift Sync Engine
 * Uses epoch timestamps to compensate for network transit latency.
 *
 * Formula:
 * transitLatencyMs = Date.now() - hostSentAt
 * projectedMediaTime = hostCurrentTime + (transitLatencyMs / 1000)
 */

export interface MediaSyncPayload {
  mediaId: string;
  hostCurrentTime: number; // in seconds
  isPlaying: boolean;
  hostSentAt: number; // Date.now() epoch in ms
  playbackRate?: number;
  sequence: number;
}

export class SyncClock {
  private static instance: SyncClock;
  private driftThresholdSeconds = 0.12; // 120ms default drift tolerance before seeking

  public static getInstance(): SyncClock {
    if (!SyncClock.instance) {
      SyncClock.instance = new SyncClock();
    }
    return SyncClock.instance;
  }

  public setDriftThresholdMs(ms: number): void {
    this.driftThresholdSeconds = Math.max(0.02, ms / 1000);
  }

  public getDriftThresholdMs(): number {
    return this.driftThresholdSeconds * 1000;
  }

  /**
   * Calculates the drift-compensated target playback time for a client.
   */
  public calculateCompensatedTime(
    payload: MediaSyncPayload,
    receiveTimeMs: number = Date.now()
  ): number {
    const transitLatencyMs = Math.max(0, receiveTimeMs - payload.hostSentAt);
    const latencySeconds = transitLatencyMs / 1000;
    const rate = payload.playbackRate ?? 1.0;

    // Only project forward if host is currently playing
    const projectedTime = payload.isPlaying
      ? payload.hostCurrentTime + latencySeconds * rate
      : payload.hostCurrentTime;

    return projectedTime;
  }

  /**
   * Checks whether the local playback has drifted beyond acceptable tolerance.
   */
  public shouldCorrectDrift(
    localCurrentTime: number,
    compensatedTargetTime: number,
    threshold: number = this.driftThresholdSeconds
  ): boolean {
    const drift = Math.abs(localCurrentTime - compensatedTargetTime);
    return drift > threshold;
  }

  /**
   * Generates a sync payload from host.
   */
  public createHostSyncPayload(
    mediaId: string,
    hostCurrentTime: number,
    isPlaying: boolean,
    sequence: number = 0,
    playbackRate: number = 1.0
  ): MediaSyncPayload {
    return {
      mediaId,
      hostCurrentTime,
      isPlaying,
      hostSentAt: Date.now(),
      playbackRate,
      sequence,
    };
  }
}

export const syncClock = SyncClock.getInstance();
