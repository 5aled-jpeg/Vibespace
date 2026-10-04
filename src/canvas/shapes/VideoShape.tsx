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
import VideoPlayer from '../../components/media/VideoPlayer';
import WindowFrame from '../../components/layout/WindowFrame';
import { useAppStore } from '../../stores/appStore';
import { livekitManager } from '../../realtime/livekit-client';
import { syncClock } from '../../realtime/sync-clock';
import { minimizeShapeWithGenie } from '../../utils/genie-actions';

export type IVideoShape = TLBaseShape<
  'video-node',
  {
    w: number;
    h: number;
    src: string;
    title: string;
    isHost: boolean;
  }
>;

export class VideoShapeUtil extends ShapeUtil<IVideoShape> {
  static override type = 'video-node' as const;

  static override props = {
    w: T.number,
    h: T.number,
    src: T.string,
    title: T.string,
    isHost: T.boolean,
  };

  override getDefaultProps(): IVideoShape['props'] {
    return {
      w: 640,
      h: 420,
      src: '',
      title: 'Watch Party Video',
      isHost: true,
    };
  }

  override canResize = () => true;
  override isAspectRatioLocked = () => false;
  override hideSelectionBoundsFg = () => true;
  override hideSelectionBoundsBg = () => true;
  override hideResizeHandles = () => true;
  override hideRotateHandle = () => true;

  override getGeometry(shape: IVideoShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override getIndicatorPath() {
    return undefined;
  }

  override onResize(shape: IVideoShape, info: TLResizeInfo<any>) {
    return resizeBox(shape, info);
  }

  override component(shape: IVideoShape) {
    const handleSourceChange = (newSrc: string, newTitle?: string) => {
      this.editor.updateShape<IVideoShape>({
        id: shape.id,
        type: shape.type,
        props: {
          ...shape.props,
          src: newSrc,
          title: newTitle || shape.props.title,
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
        toolType: 'video',
        title: shape.props.title || 'New Video Stream',
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
          <VideoShapeBridge
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

function VideoShapeBridge({
  shape,
  onSourceChange,
  onDelete,
  onMaximize,
  onToggleMinimize,
}: {
  shape: IVideoShape;
  onSourceChange: (newSrc: string, newTitle?: string) => void;
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
    <VideoPlayer
      id={shape.id}
      src={shape.props.src}
      title={shape.props.title}
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

export default VideoShapeUtil;
