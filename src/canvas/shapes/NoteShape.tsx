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
import NoteCard from '../../components/productivity/NoteCard';

export type INoteShape = TLBaseShape<
  'note-node',
  {
    w: number;
    h: number;
    text: string;
    background?: string;
  }
>;

export class NoteShapeUtil extends ShapeUtil<INoteShape> {
  static override type = 'note-node' as const;

  static override props = {
    w: T.number,
    h: T.number,
    text: T.string,
    background: T.optional(T.string),
  };

  override getDefaultProps(): INoteShape['props'] {
    return {
      w: 340,
      h: 240,
      text: '',
      background: '',
    };
  }

  override canResize = () => true;
  override canEdit = () => true;
  override isAspectRatioLocked = () => false;
  override hideSelectionBoundsFg = () => true;
  override hideSelectionBoundsBg = () => true;
  override hideResizeHandles = () => true;
  override hideRotateHandle = () => true;

  override onDoubleClick = (shape: INoteShape) => {
    if (this.editor.getCurrentToolId() !== 'select') {
      this.editor.setCurrentTool('select');
    }
    this.editor.select(shape.id);
    this.editor.setEditingShape(shape.id);
    return undefined;
  };

  override getGeometry(shape: INoteShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override getIndicatorPath() {
    return undefined;
  }

  override onResize(shape: INoteShape, info: TLResizeInfo<any>) {
    return resizeBox(shape, info);
  }

  override component(shape: INoteShape) {
    const isEditing = this.editor.getEditingShapeId() === shape.id;

    const handleSetEditing = (editing: boolean) => {
      if (editing) {
        if (this.editor.getCurrentToolId() !== 'select') {
          this.editor.setCurrentTool('select');
        }
        this.editor.select(shape.id);
        this.editor.setEditingShape(shape.id);
      } else {
        if (this.editor.getEditingShapeId() === shape.id) {
          this.editor.setEditingShape(null);
        }
      }
    };

    const handleDelete = () => {
      this.editor.deleteShape(shape.id);
    };

    const handleTextChange = (newText: string) => {
      this.editor.updateShape<INoteShape>({
        id: shape.id,
        type: shape.type,
        props: {
          ...shape.props,
          text: newText,
        },
      });
    };

    const handleBackgroundChange = (newBg: string | undefined) => {
      let nextH = shape.props.h;
      if (newBg && nextH < 340) {
        nextH = 400;
      } else if (!newBg && nextH > 350) {
        nextH = 240;
      }

      this.editor.updateShape<INoteShape>({
        id: shape.id,
        type: shape.type,
        props: {
          ...shape.props,
          background: newBg || '',
          h: nextH,
        },
      });
    };

    return (
      <HTMLContainer
        id={shape.id}
        style={{
          width: shape.props.w,
          height: shape.props.h,
          pointerEvents: 'all',
          overscrollBehavior: 'contain',
        }}
        onDoubleClickCapture={(e) => {
          e.stopPropagation();
          if (e.nativeEvent) {
            e.nativeEvent.stopImmediatePropagation?.();
          }
        }}
      >
        <NoteCard
          id={shape.id}
          text={shape.props.text}
          background={shape.props.background || undefined}
          isEditing={isEditing}
          onSetEditing={handleSetEditing}
          onTextChange={handleTextChange}
          onBackgroundChange={handleBackgroundChange}
          onDelete={handleDelete}
          className="w-full h-full"
        />
      </HTMLContainer>
    );
  }
}

export default NoteShapeUtil;
