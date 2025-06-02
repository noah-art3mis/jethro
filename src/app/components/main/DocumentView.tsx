'use client';

import ReactMarkdown from 'react-markdown';
import React from 'react';

interface DocumentViewProps {
  content: string;
}

export default function DocumentView({ content }: DocumentViewProps) {
  return (
    <div className="markdown-body" style={{
      maxWidth: '68ch',
      margin: '0 auto',
      width: '100%',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '16px',
      lineHeight: '1.6',
      color: '#dcddde',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center', // This was on the parent in page.tsx, might need adjustment
    }}>
      <ReactMarkdown>
        {content}
      </ReactMarkdown>
    </div>
  );
}
