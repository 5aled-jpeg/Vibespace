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
import TodoCard from '../../components/productivity/TodoCard';
import WindowFrame from '../../components/layout/WindowFrame';
import { minimizeShapeWithGenie } from '../../utils/genie-actions';

export type ITodoShape = TLBaseShape<
  'todo-node',
  {
    w: number;
    h: number;
    title: string;
  }
>;

export class TodoShapeUtil extends ShapeUtil<ITodoShape> {
  static override type = 'todo-node' as const;

  static override props = {
    w: T.number,
    h: T.number,
    title: T.string,
  };

  override getDefaultProps(): ITodoShape['props'] {
    return {
      w: 380,
      h: 460,
      title: 'Action Items',
    };
  }

  override canResize = () => true;
  override isAspectRatioLocked = () => false;
  override hideSelectionBoundsFg = () => true;
  override hideSelectionBoundsBg = () => true;
  override hideResizeHandles = () => true;
  override hideRotateHandle = () => true;

  override getGeometry(shape: ITodoShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override getIndicatorPath() {
    return undefined;
  }

  override onResize(shape: ITodoShape, info: TLResizeInfo<any>) {
    return resizeBox(shape, info);
  }

  override component(shape: ITodoShape) {
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
        toolType: 'todo',
        title: shape.props.title || 'Action Items',
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
          <TodoCard
            id={shape.id}
            title={shape.props.title || 'Action Items'}
            onTitleChange={(newTitle) => {
              this.editor.updateShape({
                id: shape.id,
                type: 'todo-node',
                props: {
                  ...shape.props,
                  title: newTitle,
                },
              });
            }}
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

export default TodoShapeUtil;
