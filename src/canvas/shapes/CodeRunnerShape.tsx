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
import CodeEditor from '../../components/productivity/CodeEditor';
import WindowFrame from '../../components/layout/WindowFrame';
import { minimizeShapeWithGenie } from '../../utils/genie-actions';

export type ICodeRunnerShape = TLBaseShape<
  'code-runner-node',
  {
    w: number;
    h: number;
    code: string;
    language: 'javascript' | 'typescript';
    title: string;
  }
>;

export class CodeRunnerShapeUtil extends ShapeUtil<ICodeRunnerShape> {
  static override type = 'code-runner-node' as const;

  static override props = {
    w: T.number,
    h: T.number,
    code: T.string,
    language: T.string as any,
    title: T.string,
  };

  override getDefaultProps(): ICodeRunnerShape['props'] {
    return {
      w: 620,
      h: 460,
      code: `// Spatial JS/TS Sandbox
const items = ['Tauri v2', 'React 19', 'tldraw', 'LiveKit'];
console.log('Active Stack:', items.join(' + '));
console.log('Workspace timestamp:', new Date().toLocaleTimeString());
`,
      language: 'typescript',
      title: 'JS/TS Evaluator',
    };
  }

  override canResize = () => true;
  override isAspectRatioLocked = () => false;
  override hideSelectionBoundsFg = () => true;
  override hideSelectionBoundsBg = () => true;
  override hideResizeHandles = () => true;
  override hideRotateHandle = () => true;

  override getGeometry(shape: ICodeRunnerShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override getIndicatorPath() {
    return undefined;
  }

  override onResize(shape: ICodeRunnerShape, info: TLResizeInfo<any>) {
    return resizeBox(shape, info);
  }

  override component(shape: ICodeRunnerShape) {
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
        toolType: 'code',
        title: shape.props.title || 'JS/TS Code Runner',
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
          <CodeEditor
            id={shape.id}
            initialCode={shape.props.code}
            initialLanguage={shape.props.language}
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

export default CodeRunnerShapeUtil;
