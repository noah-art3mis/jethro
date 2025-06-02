'use client';

import { Flex, Text, Button, Tooltip } from '@radix-ui/themes';
import Link from 'next/link';
import EmptyState from './EmptyState'; // Import the new EmptyState component

interface HeaderProps {
  viewMode: 'edit' | 'document';
  onViewModeChange: (mode: 'edit' | 'document') => void;
  textIsEmpty: boolean;
  handleLoadTemplate: () => void; // For loading template content
  templateSuccess: boolean;
  onPasteDocument: () => Promise<void>; // For pasting from clipboard
  pasteDocumentSuccess: boolean;
  // Note: A general onCopyDocument/copyDocumentSuccess could be added if Header itself had a copy button
  validationErrors: string[];
}

export default function Header({
  viewMode,
  onViewModeChange,
  textIsEmpty,
  handleLoadTemplate,
  templateSuccess,
  onPasteDocument,
  pasteDocumentSuccess,
  validationErrors,
}: HeaderProps) {
  return (
    <Flex justify="between" align="center" style={{ marginBottom: '1rem' }}>
      <Link href="/" style={{ textDecoration: 'none' }}>
        <Text size="6" weight="bold" style={{
          color: '#ffffff',
          letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 2px 4px rgba(0,0,0,0.1)',
          cursor: 'pointer'
        }}>Parallax</Text>
      </Link>
      <Flex gap="2" align="center">
        <Flex gap="2" style={{ marginRight: '1rem' }}>
          <Button
            onClick={() => onViewModeChange('edit')}
            variant="soft"
            style={{
              backgroundColor: viewMode === 'edit' ? '#2e7d32' : '#2d2d2d',
              color: '#dcddde',
              border: '1px solid #3d3d3d',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            ✏️ Edit View
          </Button>
          <Button
            onClick={() => onViewModeChange('document')}
            variant="soft"
            style={{
              backgroundColor: viewMode === 'document' ? '#2e7d32' : '#2d2d2d',
              color: '#dcddde',
              border: '1px solid #3d3d3d',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            📄 Document View
          </Button>
        </Flex>
        {viewMode === 'edit' && textIsEmpty ? (
          <EmptyState
            onLoadTemplate={handleLoadTemplate}
            templateSuccess={templateSuccess}
            onPaste={onPasteDocument} // Pass down the new paste function
            pasteSuccess={pasteDocumentSuccess} // Pass down the new paste success state
          />
        ) : (
          <>
            {validationErrors.length > 0 && (
              <Tooltip content={validationErrors.join('\n')}>
                <Text size="2" style={{ color: '#ff6b6b' }}>
                  ⚠️ {validationErrors.length} validation {validationErrors.length === 1 ? 'error' : 'errors'}
                </Text>
              </Tooltip>
            )}
          </>
        )}
      </Flex>
    </Flex>
  );
}
