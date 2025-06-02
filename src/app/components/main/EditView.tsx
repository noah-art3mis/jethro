'use client';

import { Button } from '@radix-ui/themes';
import { TextManager } from '@/app/utils/textManager';
import React, { RefObject } from 'react';

interface EditViewProps {
  textManager: TextManager;
  cursorPosition: number;
  selectedSegments: Set<string>;
  onSegmentSelect: (segmentId: string, text: string) => void;
  onSetViewModeDocument: () => void;
  onCopy: () => void;
  copySuccess: boolean;
  selectedParaRef: RefObject<HTMLDivElement>;
}

export default function EditView({
  textManager,
  cursorPosition,
  selectedSegments,
  onSegmentSelect,
  onSetViewModeDocument,
  onCopy,
  copySuccess,
  selectedParaRef,
}: EditViewProps) {
  const segments = textManager.getSegments();
  const above = segments.slice(0, cursorPosition);
  const selected = segments[cursorPosition];
  const below = segments.slice(cursorPosition + 1);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      position: 'relative', // This was 'fixed' in page.tsx's wrapper, but here it's for the content flow
    }}>
      {/* Above */}
      <div style={{ width: '100%' }}>
        {above.map((segment) => (
          <div key={segment.id} style={{
            backgroundColor: selectedSegments.has(segment.id) ? 'rgba(30, 30, 30, 0.5)' : 'rgba(45, 45, 45, 0.2)',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            color: '#e0bfae',
            fontFamily: 'inherit',
            fontSize: 16,
            whiteSpace: 'pre-wrap',
            maxWidth: '68ch',
            border: selectedSegments.has(segment.id) ? '1px solid rgba(174, 224, 191, 0.3)' : 'none',
            width: '100%',
            cursor: 'pointer',
          }}
            onClick={() => onSegmentSelect(segment.id, segment.working)}
          >
            {segment.working}
          </div>
        ))}
      </div>
      {/* Selected paragraph fixed in the center */}
      {selected && (
        <div
          key={selected.id}
          ref={selectedParaRef}
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '2rem',
            marginBottom: '1rem',
            backgroundColor: '#23272a',
            padding: '2rem',
            width: '100%',
            border: '2px solid #2e7d32',
            borderRadius: '8px',
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 100,
            maxWidth: 'calc(68ch * 2 + 2rem)',
          }}
        >
          <div
            onClick={() => onSegmentSelect(selected.id, selected.original)}
            style={{
              backgroundColor: 'rgba(45, 45, 45, 0.5)',
              padding: '0.5rem',
              borderRadius: '4px',
              color: '#e0bfae',
              fontFamily: 'inherit',
              fontSize: 16,
              whiteSpace: 'pre-wrap',
              maxWidth: '68ch',
              flex: 1,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(45, 45, 45, 0.7)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(45, 45, 45, 0.5)';
            }}
          >
            {selected.working}
          </div>
          <div
            onClick={() => onSegmentSelect(selected.id, `AI suggestion for: "${selected.working.substring(0, 50)}..."`)}
            style={{
              backgroundColor: 'rgba(30, 60, 90, 0.25)',
              padding: '0.5rem',
              borderRadius: '4px',
              color: '#aee0bf',
              fontFamily: 'inherit',
              fontSize: 16,
              whiteSpace: 'pre-wrap',
              maxWidth: '68ch',
              flex: 1,
              borderLeft: '2px solid #3d3d3d',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(30, 60, 90, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(30, 60, 90, 0.25)';
            }}
          >
            {`AI suggestion for: "${selected.working.substring(0, 50)}..."`}
          </div>
        </div>
      )}
      {/* Below */}
      {/* The marginTop calculation needs to be handled carefully.
          If selected Para is fixed, this div needs to ensure it starts below it.
          This might need adjustment based on how it's integrated into page.tsx's layout.
          For now, assuming the parent div in page.tsx handles the overall fixed/scroll nature.
      */}
      <div style={{ width: '100%', marginTop: selected ? 'calc(50vh + 2rem)' : '0' }}>
        {below.map((segment) => (
          <div key={segment.id} style={{
            backgroundColor: selectedSegments.has(segment.id) ? 'rgba(30, 30, 30, 0.5)' : 'rgba(45, 45, 45, 0.2)',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            color: '#e0bfae',
            fontFamily: 'inherit',
            fontSize: 16,
            whiteSpace: 'pre-wrap',
            maxWidth: '68ch',
            border: selectedSegments.has(segment.id) ? '1px solid rgba(174, 224, 191, 0.3)' : 'none',
            width: '100%',
            cursor: 'pointer',
          }}
            onClick={() => onSegmentSelect(segment.id, segment.working)}
          >
            {segment.working}
          </div>
        ))}
      </div>
      {/* End buttons if at the last segment */}
      {cursorPosition === segments.length - 1 && segments.length > 0 && (
        <div key="end-edit-buttons" style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          marginTop: '3rem',
          zIndex: 200, // Ensure buttons are clickable if overlap occurs
        }}>
          <Button
            variant="soft"
            onClick={onSetViewModeDocument}
          >
            Go to Document View
          </Button>
          <Button
            variant="soft"
            onClick={onCopy}
          >
            {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
          </Button>
        </div>
      )}
    </div>
  );
}
