import {
  Room,
  RoomEvent,
  RemoteParticipant,
  LocalParticipant,
  Track,
  VideoTrack,
  AudioTrack,
} from 'livekit-client';
import { MediaSyncPayload, syncClock } from './sync-clock';

export interface HangoutParticipant {
  identity: string;
  name: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  audioTrack?: AudioTrack;
  videoTrack?: VideoTrack;
}

export type MediaSyncCallback = (payload: MediaSyncPayload, compensatedTime: number) => void;

class LiveKitManager {
  private room: Room | null = null;
  private syncCallbacks: Map<string, MediaSyncCallback[]> = new Map();
  private participantListeners: Array<(participants: HangoutParticipant[]) => void> = [];

  constructor() {
    // Lazy initialized
  }

  public getRoom(): Room | null {
    return this.room;
  }

  public async connect(url: string, token: string): Promise<boolean> {
    try {
      this.room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      this.setupRoomEventListeners();
      await this.room.connect(url, token);
      this.notifyParticipants();
      return true;
    } catch (err) {
      console.warn('LiveKit connection error (operating in offline/local mode):', err);
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.room) {
      await this.room.disconnect();
      this.room = null;
      this.notifyParticipants();
    }
  }

  public async toggleMicrophone(): Promise<boolean> {
    if (!this.room?.localParticipant) return false;
    const isEnabled = this.room.localParticipant.isMicrophoneEnabled;
    await this.room.localParticipant.setMicrophoneEnabled(!isEnabled);
    this.notifyParticipants();
    return !isEnabled;
  }

  public async toggleCamera(): Promise<boolean> {
    if (!this.room?.localParticipant) return false;
    const isEnabled = this.room.localParticipant.isCameraEnabled;
    await this.room.localParticipant.setCameraEnabled(!isEnabled);
    this.notifyParticipants();
    return !isEnabled;
  }

  public async toggleScreenShare(): Promise<boolean> {
    if (!this.room?.localParticipant) return false;
    const isSharing = this.room.localParticipant.isScreenShareEnabled;
    await this.room.localParticipant.setScreenShareEnabled(!isSharing);
    this.notifyParticipants();
    return !isSharing;
  }

  public broadcastMediaSync(payload: MediaSyncPayload): void {
    if (!this.room) return;
    const data = new TextEncoder().encode(JSON.stringify(payload));
    this.room.localParticipant.publishData(data, {
      reliable: true,
      topic: 'MEDIA_SYNC',
    });
  }

  public onMediaSync(mediaId: string, callback: MediaSyncCallback): () => void {
    const list = this.syncCallbacks.get(mediaId) || [];
    list.push(callback);
    this.syncCallbacks.set(mediaId, list);

    return () => {
      const updated = (this.syncCallbacks.get(mediaId) || []).filter((cb) => cb !== callback);
      this.syncCallbacks.set(mediaId, updated);
    };
  }

  public onParticipantsChange(
    listener: (participants: HangoutParticipant[]) => void
  ): () => void {
    this.participantListeners.push(listener);
    listener(this.getParticipants());
    return () => {
      this.participantListeners = this.participantListeners.filter((l) => l !== listener);
    };
  }

  public getParticipants(): HangoutParticipant[] {
    const list: HangoutParticipant[] = [];

    if (this.room?.localParticipant) {
      const lp = this.room.localParticipant;
      list.push({
        identity: lp.identity,
        name: lp.name || 'You (Host)',
        isSpeaking: lp.isSpeaking,
        isMuted: !lp.isMicrophoneEnabled,
        isCameraOn: lp.isCameraEnabled,
        isScreenSharing: lp.isScreenShareEnabled,
      });
    }

    if (this.room?.remoteParticipants) {
      this.room.remoteParticipants.forEach((rp) => {
        list.push({
          identity: rp.identity,
          name: rp.name || rp.identity,
          isSpeaking: rp.isSpeaking,
          isMuted: !rp.isMicrophoneEnabled,
          isCameraOn: rp.isCameraEnabled,
          isScreenSharing: rp.isScreenShareEnabled,
        });
      });
    }

    return list;
  }

  private setupRoomEventListeners(): void {
    if (!this.room) return;

    this.room
      .on(RoomEvent.ParticipantConnected, () => this.notifyParticipants())
      .on(RoomEvent.ParticipantDisconnected, () => this.notifyParticipants())
      .on(RoomEvent.TrackSubscribed, () => this.notifyParticipants())
      .on(RoomEvent.TrackUnsubscribed, () => this.notifyParticipants())
      .on(RoomEvent.ActiveSpeakersChanged, () => this.notifyParticipants())
      .on(RoomEvent.DataReceived, (payload, participant, kind, topic) => {
        if (topic === 'MEDIA_SYNC') {
          try {
            const raw = new TextDecoder().decode(payload);
            const syncPayload: MediaSyncPayload = JSON.parse(raw);
            const compensated = syncClock.calculateCompensatedTime(syncPayload);

            const listeners = this.syncCallbacks.get(syncPayload.mediaId) || [];
            listeners.forEach((cb) => cb(syncPayload, compensated));
          } catch (e) {
            console.error('Failed to parse incoming media sync pulse:', e);
          }
        }
      });
  }

  private notifyParticipants(): void {
    const participants = this.getParticipants();
    this.participantListeners.forEach((l) => l(participants));
  }
}

export const livekitManager = new LiveKitManager();
