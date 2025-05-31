import { Flex, Text, Button, Tooltip } from '@radix-ui/themes';
import { SidebarToggle } from '../components/SidebarToggle';
import React from 'react';

interface Document {
    id: string;
    title: string;
    lastModified: Date;
}

interface SidebarProps {
    documents: Document[];
    currentDocumentId: string | null;
    onSelectDocument: (id: string) => void;
    onCreateNewDocument: () => void;
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
    onCopy: () => void;
    copySuccess: boolean;
}

export function Sidebar({
    documents,
    currentDocumentId,
    onSelectDocument,
    onCreateNewDocument,
    isSidebarOpen,
    onToggleSidebar,
    onCopy,
    copySuccess
}: SidebarProps) {
    return (
        <>
            {!isSidebarOpen && (
                <div style={{
                    position: 'absolute',
                    left: '2rem',
                    top: '2rem',
                    zIndex: 100
                }}>
                    <SidebarToggle isOpen={isSidebarOpen} onClick={onToggleSidebar} />
                </div>
            )}
            <aside
                style={{
                    position: 'absolute',
                    left: '2rem',
                    top: '2rem',
                    width: isSidebarOpen ? 260 : 0,
                    minWidth: isSidebarOpen ? 260 : 0,
                    maxWidth: isSidebarOpen ? 260 : 0,
                    height: 'calc(100vh - 4rem)',
                    background: '#23272a',
                    borderRadius: 12,
                    boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
                    overflow: 'hidden',
                    zIndex: 100,
                    transition: 'width 0.2s cubic-bezier(.4,0,.2,1), min-width 0.2s cubic-bezier(.4,0,.2,1), max-width 0.2s cubic-bezier(.4,0,.2,1)'
                }}
            >
                <Flex direction="column" style={{ height: '100%' }}>
                    <Flex align="center" justify="between" style={{ padding: '1rem', borderBottom: '1px solid #36393f' }}>
                        <Flex align="center" gap="2">
                            <SidebarToggle isOpen={isSidebarOpen} onClick={onToggleSidebar} />
                            <Text weight="bold" size="4">Documents</Text>
                        </Flex>
                        <Tooltip content="Create new document">
                            <Button
                                aria-label="Create new document"
                                size="1"
                                variant="soft"
                                style={{ marginLeft: 8, background: '#36393f', color: '#dcddde', border: 'none', borderRadius: 4, padding: 4, minWidth: 0 }}
                                onClick={onCreateNewDocument}
                            >
                                <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path d="M8 3.333v9.334M3.333 8h9.334" stroke="#dcddde" strokeWidth="2" strokeLinecap="round" /></svg>
                            </Button>
                        </Tooltip>
                    </Flex>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {documents.length === 0 ? (
                            <Text style={{ color: '#888', padding: '1rem' }}>No documents</Text>
                        ) : (
                            documents.map(doc => (
                                <Flex
                                    key={doc.id}
                                    align="center"
                                    justify="between"
                                    style={{
                                        padding: '0.75rem 1rem',
                                        background: doc.id === currentDocumentId ? '#36393f' : 'transparent',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid #2c2f33',
                                        transition: 'background 0.2s',
                                        color: doc.id === currentDocumentId ? '#fff' : '#dcddde',
                                        fontWeight: doc.id === currentDocumentId ? 600 : 400
                                    }}
                                    onClick={() => onSelectDocument(doc.id)}
                                >
                                    <Text style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</Text>
                                    <Text size="1" style={{ color: '#aaa', marginLeft: 8 }}>{doc.lastModified.toLocaleDateString()}</Text>
                                </Flex>
                            ))
                        )}
                    </div>
                    <div style={{
                        borderTop: '1px solid #36393f',
                        padding: '1rem',
                        flexShrink: 0
                    }}>
                        <Text size="2" weight="bold" style={{ color: '#a0a0a0', marginBottom: '0.5rem' }}>Analysis</Text>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                            <Tooltip content="Check AI-generated content probability using GPTZero">
                                <Button
                                    onClick={() => {
                                        // To be implemented with GPTZero integration
                                        console.log('Analyze AI clicked');
                                    }}
                                    variant="soft"
                                    style={{
                                        backgroundColor: '#36393f',
                                        color: '#dcddde',
                                        border: '1px solid #4d4d4d',
                                        padding: '0.5rem',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    🤖 Check AI Probability
                                </Button>
                            </Tooltip>
                        </div>

                        <Text size="2" weight="bold" style={{ color: '#a0a0a0', marginBottom: '0.5rem' }}>Export</Text>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <Tooltip content={copySuccess ? "Copied!" : "Copy text to clipboard"}>
                                <Button
                                    onClick={onCopy}
                                    variant="soft"
                                    style={{
                                        backgroundColor: copySuccess ? '#2e7d32' : '#36393f',
                                        color: '#dcddde',
                                        border: '1px solid #4d4d4d',
                                        padding: '0.5rem',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    {copySuccess ? '✓ Copied!' : '📋 Copy to Clipboard'}
                                </Button>
                            </Tooltip>
                        </div>
                    </div>
                </Flex>
            </aside>
        </>
    );
} 