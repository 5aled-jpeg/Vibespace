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
import WebEmbedView from '../../components/media/WebEmbedView';
import WindowFrame from '../../components/layout/WindowFrame';
import { minimizeShapeWithGenie } from '../../utils/genie-actions';

export type IWebEmbedShape = TLBaseShape<
  'web-embed-node',
  {
    w: number;
    h: number;
    url: string;
    title: string;
  }
>;

export class WebEmbedShapeUtil extends ShapeUtil<IWebEmbedShape> {
  static override type = 'web-embed-node' as const;

  static override props = {
    w: T.number,
    h: T.number,
    url: T.string,
    title: T.string,
  };

  override getDefaultProps(): IWebEmbedShape['props'] {
    return {
      w: 780,
      h: 540,
      url: '',
      title: 'Web Browser',
    };
  }

  override canResize = () => true;
  override isAspectRatioLocked = () => false;
  override hideSelectionBoundsFg = () => true;
  override hideSelectionBoundsBg = () => true;
  override hideResizeHandles = () => true;
  override hideRotateHandle = () => true;

  override getGeometry(shape: IWebEmbedShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override getIndicatorPath() {
    return undefined;
  }

  override onResize(shape: IWebEmbedShape, info: TLResizeInfo<any>) {
    return resizeBox(shape, info);
  }

  override component(shape: IWebEmbedShape) {
    const handleUrlChange = (newUrl: string) => {
      this.editor.updateShape<IWebEmbedShape>({
        id: shape.id,
        type: shape.type,
        props: {
          ...shape.props,
          url: newUrl,
        },
      });
    };

    const handleTitleChange = (newTitle: string) => {
      this.editor.updateShape<IWebEmbedShape>({
        id: shape.id,
        type: shape.type,
        props: {
          ...shape.props,
          title: newTitle,
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
        toolType: 'web',
        title: shape.props.title || 'Web Space',
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
          <WebEmbedView
            id={shape.id}
            initialUrl={shape.props.url}
            title={shape.props.title}
            onTitleChange={handleTitleChange}
            onUrlChange={handleUrlChange}
            onDelete={handleDelete}
            onMaximize={handleMaximize}
            onToggleMinimize={handleMinimize}
            className="w-full h-full rounded-2xl shadow-2xl"
          />
        </WindowFrame>
      </HTMLContainer>
    );
  }
}

export default WebEmbedShapeUtil;
