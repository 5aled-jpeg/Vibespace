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
import PdfViewer from '../../components/productivity/PdfViewer';
import WindowFrame from '../../components/layout/WindowFrame';
import { minimizeShapeWithGenie } from '../../utils/genie-actions';

export type IPdfShape = TLBaseShape<
  'pdf-node',
  {
    w: number;
    h: number;
    fileUrl: string;
    title: string;
  }
>;

export class PdfShapeUtil extends ShapeUtil<IPdfShape> {
  static override type = 'pdf-node' as const;

  static override props = {
    w: T.number,
    h: T.number,
    fileUrl: T.string,
    title: T.string,
  };

  override getDefaultProps(): IPdfShape['props'] {
    return {
      w: 680,
      h: 560,
      fileUrl: '',
      title: 'PDF Document Viewer',
    };
  }

  override canResize = () => true;
  override isAspectRatioLocked = () => false;
  override hideSelectionBoundsFg = () => true;
  override hideSelectionBoundsBg = () => true;
  override hideResizeHandles = () => true;
  override hideRotateHandle = () => true;

  override getGeometry(shape: IPdfShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override getIndicatorPath() {
    return undefined;
  }

  override onResize(shape: IPdfShape, info: TLResizeInfo<any>) {
    return resizeBox(shape, info);
  }

  override component(shape: IPdfShape) {
    const handleFileChange = (newUrl: string, newTitle?: string) => {
      this.editor.updateShape<IPdfShape>({
        id: shape.id,
        type: shape.type,
        props: {
          ...shape.props,
          fileUrl: newUrl,
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
        toolType: 'pdf',
        title: shape.props.title || 'PDF Document Viewer',
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
          <PdfViewer
            id={shape.id}
            fileUrl={shape.props.fileUrl}
            title={shape.props.title}
            onFileChange={handleFileChange}
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

export default PdfShapeUtil;
