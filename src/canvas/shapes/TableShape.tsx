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
import TableGrid from '../../components/productivity/TableGrid';
import WindowFrame from '../../components/layout/WindowFrame';
import { minimizeShapeWithGenie } from '../../utils/genie-actions';

export type ITableShape = TLBaseShape<
  'table-node',
  {
    w: number;
    h: number;
    title: string;
  }
>;

export class TableShapeUtil extends ShapeUtil<ITableShape> {
  static override type = 'table-node' as const;

  static override props = {
    w: T.number,
    h: T.number,
    title: T.string,
  };

  override getDefaultProps(): ITableShape['props'] {
    return {
      w: 580,
      h: 360,
      title: 'Project Data Grid',
    };
  }

  override canResize = () => true;
  override isAspectRatioLocked = () => false;
  override hideSelectionBoundsFg = () => true;
  override hideSelectionBoundsBg = () => true;
  override hideResizeHandles = () => true;
  override hideRotateHandle = () => true;

  override getGeometry(shape: ITableShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override getIndicatorPath() {
    return undefined;
  }

  override onResize(shape: ITableShape, info: TLResizeInfo<any>) {
    return resizeBox(shape, info);
  }

  override component(shape: ITableShape) {
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
        toolType: 'table',
        title: shape.props.title || 'Project Data Grid',
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
          <TableGrid
            id={shape.id}
            title={shape.props.title}
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

export default TableShapeUtil;
