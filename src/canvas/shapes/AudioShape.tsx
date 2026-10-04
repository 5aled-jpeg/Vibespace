import React from 'react';
import {
  ShapeUtil,
  HTMLContainer,
  TLBaseShape,
  T,
  Rectangle2d,
  resizeBox,
  TLResizeInfo,
} from 'tldraw';
import AudioPlayer from '../../components/media/AudioPlayer';
import WindowFrame from '../../components/layout/WindowFrame';
import { useAppStore } from '../../stores/appStore';
import { livekitManager } from '../../realtime/livekit-client';
import { syncClock } from '../../realtime/sync-clock';
import { minimizeShapeWithGenie } from '../../utils/genie-actions';

export type IAudioShape = TLBaseShape<
  'audio-node',
  {
    w: number;
    h: number;
    src: string;
    title: string;
    artist: string;
    cover?: string;
  }
>;

export class AudioShapeUtil extends ShapeUtil<IAudioShape> {
  static override type = 'audio-node' as const;

  static override props = {
    w: T.number,
    h: T.number,
    src: T.string,
    title: T.string,
    artist: T.string,
    cover: T.optional(T.string),
  };

  override getDefaultProps(): IAudioShape['props'] {
    return {
      w: 340,
      h: 540,
      src: '',
      title: '',
      artist: '',
      cover: '',
    };
  }

  override canResize = () => true;
  override isAspectRatioLocked = () => false;
  override hideSelectionBoundsFg = () => true;
  override hideSelectionBoundsBg = () => true;
  override hideResizeHandles = () => true;
  override hideRotateHandle = () => true;

  override getGeometry(shape: IAudioShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override getIndicatorPath() {
    return undefined;
  }

  override onResize(shape: IAudioShape, info: TLResizeInfo<any>) {
    return resizeBox(shape, info);
  }

  override component(shape: IAudioShape) {
    const handleSourceChange = (
      newSrc: string,
      newTitle?: string,
      newArtist?: string,
      newCover?: string
    ) => {
      this.editor.updateShape<IAudioShape>({
        id: shape.id,
        type: shape.type,
        props: {
          ...shape.props,
          src: newSrc,
          title: newTitle || shape.props.title,
          artist: newArtist || shape.props.artist,
          cover: newCover !== undefined ? newCover : shape.props.cover,
        },
      });
    };

    const handleDelete = () => {
      this.editor.deleteShape(shape.id);
    };

    const handleMaximize = () => {
      this.editor.setSelectedShapes([shape.id]);
      this.editor.zoomToSelection({ animation: { duration: 250 } });
    };

    const handleMinimize = () => {
      minimizeShapeWithGenie({
        shapeId: shape.id,
        toolType: 'audio',
        title: shape.props.title || 'Music Player',
        editor: this.editor,
        element: document.getElementById(shape.id),
      });
    };

    return (
      <HTMLContainer
        id={shape.id}
        style={{
          width: shape.props.w,
          height: shape.props.h,
          pointerEvents: 'all',
        }}
      >
        <WindowFrame
          shapeId={shape.id}
          width={shape.props.w}
          height={shape.props.h}
          editor={this.editor}
        >
          <AudioShapeBridge
            shape={shape}
            onSourceChange={handleSourceChange}
            onDelete={handleDelete}
            onMaximize={handleMaximize}
            onToggleMinimize={handleMinimize}
          />
        </WindowFrame>
      </HTMLContainer>
    );
  }
}

function AudioShapeBridge({
  shape,
  onSourceChange,
  onDelete,
  onMaximize,
  onToggleMinimize,
}: {
  shape: IAudioShape;
  onSourceChange: (newSrc: string, newTitle?: string, newArtist?: string, newCover?: string) => void;
  onDelete: () => void;
  onMaximize: () => void;
  onToggleMinimize?: () => void;
}) {
  const syncMediaId = useAppStore((s) => s.syncMediaId);
  const syncCurrentTime = useAppStore((s) => s.syncCurrentTime);
  const syncIsPlaying = useAppStore((s) => s.syncIsPlaying);
  const updateMediaSync = useAppStore((s) => s.updateMediaSync);
  const isHost = useAppStore((s) => s.isHost);

  const handlePlaybackChange = (time: number, playing: boolean) => {
    updateMediaSync(shape.id, time, playing);
    if (isHost) {
      const payload = syncClock.createHostSyncPayload(shape.id, time, playing);
      livekitManager.broadcastMediaSync(payload);
    }
  };

  return (
    <AudioPlayer
      id={shape.id}
      src={shape.props.src}
      title={shape.props.title}
      artist={shape.props.artist}
      cover={shape.props.cover}
      isHost={isHost}
      syncEnabled={true}
      externalCurrentTime={syncMediaId === shape.id ? syncCurrentTime : undefined}
      externalIsPlaying={syncMediaId === shape.id ? syncIsPlaying : undefined}
      onPlaybackChange={handlePlaybackChange}
      onSourceChange={onSourceChange}
      onDelete={onDelete}
      onMaximize={onMaximize}
      onToggleMinimize={onToggleMinimize}
      className="w-full h-full rounded-2xl md:rounded-3xl shadow-vision-elevated"
    />
  );
}

export default AudioShapeUtil;
