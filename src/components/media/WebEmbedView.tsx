import React from 'react';
import BrowserView, { BrowserViewProps } from '../browser/BrowserView';

export interface WebEmbedViewProps extends BrowserViewProps {
  slotToolbar?: React.ReactNode;
}

export function WebEmbedView(props: WebEmbedViewProps) {
  return <BrowserView {...props} />;
}

export default WebEmbedView;
