'use client';

import { Button, Tooltip, Text } from '@radix-ui/themes';
import React from 'react';

interface EmptyStateProps {
  onLoadTemplate: () => void;
  templateSuccess: boolean;
  onPaste: () => void;
  pasteSuccess: boolean;
}

export default function EmptyState({
  onLoadTemplate,
  templateSuccess,
  onPaste,
  pasteSuccess,
}: EmptyStateProps) {
  return (
    <div style={{
      // Styles from the original div in Header.tsx
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      alignItems: 'center',
      padding: '2rem',
      backgroundColor: 'rgba(30, 30, 30, 0.5)',
      borderRadius: '8px',
      backdropFilter: 'blur(8px)'
    }}>
      <Tooltip content={templateSuccess ? "Template loaded!" : "Load template content"}>
        <Button
          onClick={onLoadTemplate}
          variant="soft"
          style={{
            backgroundColor: templateSuccess ? '#2e7d32' : '#2d2d2d',
            color: '#dcddde',
            border: '1px solid #3d3d3d',
            padding: '1rem 2rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1.2rem',
            width: '300px'
          }}
        >
          {templateSuccess ? '✓ Template Loaded!' : '📝 Load Template'}
        </Button>
      </Tooltip>
      <Text size="2" style={{ color: '#a0a0a0' }}>or</Text>
      <Tooltip content={pasteSuccess ? "Pasted!" : "Paste text from your clipboard (Ctrl+V)"}>
        <Button
          onClick={onPaste}
          variant="soft"
          style={{
            backgroundColor: pasteSuccess ? '#2e7d32' : '#2d2d2d',
            color: '#dcddde',
            border: '1px solid #3d3d3d',
            padding: '1rem 2rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1.2rem',
            width: '300px'
          }}
        >
          {pasteSuccess ? '✓ Pasted!' : '📋 Paste from Clipboard'}
        </Button>
      </Tooltip>
    </div>
  );
}
