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
import ImageViewer from '../../components/media/ImageViewer';
import WindowFrame from '../../components/layout/WindowFrame';
import { minimizeShapeWithGenie } from '../../utils/genie-actions';

export type IImageShape = TLBaseShape<
  'image-node',
  {
    w: number;
    h: number;
    src: string;
    title: string;
    caption?: string;
  }
>;

export class ImageShapeUtil extends ShapeUtil<IImageShape> {
  static override type = 'image-node' as const;

  static override props = {
    w: T.number,
    h: T.number,
    src: T.string,
    title: T.string,
    caption: T.string.optional(),
  };

  override getDefaultProps(): IImageShape['props'] {
    return {
      w: 560,
      h: 440,
      src: '',
      title: 'Photo Canvas',
      caption: '',
    };
  }

  override canResize = () => true;
  override isAspectRatioLocked = () => false;
  override hideSelectionBoundsFg = () => true;
  override hideSelectionBoundsBg = () => true;
  override hideResizeHandles = () => true;
  override hideRotateHandle = () => true;

  override getGeometry(shape: IImageShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override getIndicatorPath() {
    return undefined;
  }

  override onResize(shape: IImageShape, info: TLResizeInfo<any>) {
    return resizeBox(shape, info);
  }

  override component(shape: IImageShape) {
    const handleSourceChange = (newSrc: string, newTitle?: string) => {
      this.editor.updateShape<IImageShape>({
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
        toolType: 'image',
        title: shape.props.title || 'New Photo Canvas',
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
          <ImageViewer
            id={shape.id}
            src={shape.props.src}
            title={shape.props.title}
            caption={shape.props.caption}
            onSourceChange={handleSourceChange}
            onDelete={handleDelete}
            onMaximize={handleMaximize}
            onToggleMinimize={handleMinimize}
            className="w-full h-full rounded-2xl md:rounded-3xl shadow-vision-elevated"
          />
        </WindowFrame>
      </HTMLContainer>
    );
  }
}

export default ImageShapeUtil;
