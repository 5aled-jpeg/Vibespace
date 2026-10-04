import '@tldraw/tlschema';

declare module '@tldraw/tlschema' {
  interface TLGlobalShapePropsMap {
    'video-node': {
      w: number;
      h: number;
      src: string;
      title: string;
      isHost: boolean;
    };
    'audio-node': {
      w: number;
      h: number;
      src: string;
      title: string;
      artist: string;
    };
    'image-node': {
      w: number;
      h: number;
      src: string;
      title: string;
      caption?: string;
    };
    'web-embed-node': {
      w: number;
      h: number;
      url: string;
      title: string;
    };
    'code-runner-node': {
      w: number;
      h: number;
      code: string;
      language: 'javascript' | 'typescript';
      title: string;
    };
    'pdf-node': {
      w: number;
      h: number;
      fileUrl: string;
      title: string;
    };
    'table-node': {
      w: number;
      h: number;
      title: string;
    };
    'todo-node': {
      w: number;
      h: number;
      title: string;
    };
    'note-node': {
      w: number;
      h: number;
      text: string;
      background?: string;
    };
  }
}
