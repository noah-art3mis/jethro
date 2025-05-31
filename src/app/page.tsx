'use client';

import { Container, Flex, Text, Button, Tooltip } from '@radix-ui/themes';
import Editor from '@monaco-editor/react';
import { useState, useRef, useEffect } from 'react';
import template from './template.json';
import { validateMarkdown, formatValidationErrors } from '../utils/markdownValidator';
import { TextManager, TextSegment } from '../utils/textManager';
import Link from 'next/link';
import { SidebarToggle } from '../components/SidebarToggle';
import ReactMarkdown from 'react-markdown';
import { Sidebar } from './Sidebar';

interface Paragraph {
    id: string;
    original: string;
    current: string;
    aiSuggested: string;
    isSelected: boolean;
}

interface Document {
    id: string;
    title: string;
    paragraphs: Paragraph[];
    lastModified: Date;
}

interface Suggestion {
    original: string;
    rewritten: string;
    lineStart: number;
    lineEnd: number;
}

export default function Home() {
    const textManagerRef = useRef<TextManager>(new TextManager(''));
    const [rawText, setRawText] = useState(textManagerRef.current.getFullWorkingText());
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [selectedSuggestion, setSelectedSuggestion] = useState<number>(-1);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [copySuccess, setCopySuccess] = useState(false);
    const [pasteSuccess, setPasteSuccess] = useState(false);
    const [templateSuccess, setTemplateSuccess] = useState(false);
    const mainContainerRef = useRef<HTMLDivElement>(null);
    const selectedParaRef = useRef<HTMLDivElement>(null);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [selectedSegments, setSelectedSegments] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<'edit' | 'document'>('edit');
    const [documents, setDocuments] = useState<Document[]>([]);
    const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [, forceUpdate] = useState(0);

    // Load documents from localStorage on mount
    useEffect(() => {
        const savedDocuments = localStorage.getItem('documents');
        if (savedDocuments) {
            const parsedDocs = JSON.parse(savedDocuments).map((doc: any) => ({
                ...doc,
                lastModified: new Date(doc.lastModified)
            }));
            setDocuments(parsedDocs);
        }
    }, []);

    // Save documents to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('documents', JSON.stringify(documents));
    }, [documents]);

    const createParagraphsFromSegments = (segments: TextSegment[]): Paragraph[] => {
        return segments.map(segment => ({
            id: segment.id,
            original: segment.original,
            current: segment.working,
            aiSuggested: `AI suggestion for: "${segment.original.substring(0, 50)}..."`,
            isSelected: selectedSegments.has(segment.id)
        }));
    };

    const createNewDocument = (content: string, title: string = 'Untitled Document') => {
        const manager = new TextManager(content);
        textManagerRef.current = manager;
        setRawText(manager.getFullWorkingText());
        const newDoc: Document = {
            id: Date.now().toString(),
            title,
            paragraphs: createParagraphsFromSegments(manager.getSegments()),
            lastModified: new Date()
        };
        setDocuments(prev => [...prev, newDoc]);
        setCurrentDocumentId(newDoc.id);
        setCursorPosition(0);
        setSelectedSegments(new Set());
    };

    const loadDocument = (docId: string) => {
        const doc = documents.find(d => d.id === docId);
        if (doc) {
            setCurrentDocumentId(docId);
            const content = doc.paragraphs.map(p => p.current).join('\n\n');
            const manager = new TextManager(content);
            textManagerRef.current = manager;
            setRawText(manager.getFullWorkingText());
            setCursorPosition(0);
            setSelectedSegments(new Set());
        }
    };

    // Rebuild paragraphs from segments
    const updateCurrentDocument = () => {
        if (currentDocumentId) {
            setDocuments(prev => prev.map(doc => {
                if (doc.id === currentDocumentId) {
                    const segments = textManagerRef.current.getSegments();
                    const updatedParagraphs = createParagraphsFromSegments(segments);
                    return {
                        ...doc,
                        paragraphs: updatedParagraphs,
                        lastModified: new Date()
                    };
                }
                return doc;
            }));
        }
    };

    // Update document content when text changes
    useEffect(() => {
        if (currentDocumentId) {
            updateCurrentDocument();
        }
    }, [rawText]);

    const handleLoadTemplate = () => {
        createNewDocument(template.content, 'Template Document');
        setTemplateSuccess(true);
        setTimeout(() => setTemplateSuccess(false), 2000);
    };

    const handlePaste = async () => {
        try {
            let text = '';
            try {
                text = await navigator.clipboard.readText();
            } catch (modernError) {
                const textarea = document.createElement('textarea');
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.focus();
                const success = document.execCommand('paste');
                if (success) {
                    text = textarea.value;
                } else {
                    throw new Error('Paste command failed');
                }
                document.body.removeChild(textarea);
            }
            createNewDocument(text, 'Pasted Document');
            setPasteSuccess(true);
            setTimeout(() => setPasteSuccess(false), 2000);
        } catch (err) {
            alert('Failed to read from clipboard. Please try using Ctrl+V (Cmd+V on Mac) to paste directly.');
        }
    };

    const handleCopy = async () => {
        try {
            const textToCopy = textManagerRef.current.getFullWorkingText();
            try {
                await navigator.clipboard.writeText(textToCopy);
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
                return;
            } catch (modernError) { }
            const textarea = document.createElement('textarea');
            textarea.value = textToCopy;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const success = document.execCommand('copy');
            if (success) {
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            } else {
                throw new Error('Copy command failed');
            }
            document.body.removeChild(textarea);
        } catch (err) {
            alert('Failed to copy to clipboard. Please try using Ctrl+C (Cmd+C on Mac) to copy directly.');
        }
    };

    const generateSuggestions = (segments: TextSegment[]) => {
        return segments.map(segment => ({
            original: segment.original,
            rewritten: `AI suggestion for: "${segment.original.substring(0, 50)}..."`,
            lineStart: segment.startLine,
            lineEnd: segment.endLine
        }));
    };

    // Update suggestions whenever text changes
    useEffect(() => {
        const newSuggestions = generateSuggestions(textManagerRef.current.getSegments());
        setSuggestions(newSuggestions);
        setSelectedSuggestion(newSuggestions.length > 0 ? 0 : -1);
    }, [rawText]);

    // Validation effect (debounced)
    useEffect(() => {
        const handler = setTimeout(() => {
            const validateContent = async () => {
                const result = await validateMarkdown(textManagerRef.current.getFullWorkingText());
                if (!result.isValid) {
                    setValidationErrors(result.errors.map(error =>
                        `${error.message} (line ${error.line}, column ${error.column})`
                    ));
                } else {
                    setValidationErrors([]);
                }
            };
            validateContent();
        }, 300);
        return () => clearTimeout(handler);
    }, [rawText]);

    const handleSelection = (segmentId: string, text: string) => {
        textManagerRef.current.updateWorkingCopy(segmentId, text);
        setRawText(textManagerRef.current.getFullWorkingText());
        setSelectedSegments(prev => new Set(Array.from(prev).concat(segmentId)));
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const segments = textManagerRef.current.getSegments();
            const currentSegment = segments[cursorPosition];
            if (viewMode === 'edit' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
                e.preventDefault();
                if (currentSegment) {
                    const aiSuggestion = `AI suggestion for: "${currentSegment.working.substring(0, 50)}..."`;
                    const newText = e.key === 'ArrowLeft' ? currentSegment.original : aiSuggestion;
                    handleSelection(currentSegment.id, newText);
                    if (cursorPosition < segments.length - 1) {
                        setCursorPosition(prev => prev + 1);
                    }
                }
            } else if (e.key === 'Tab' && suggestions.length > 0) {
                e.preventDefault();
                setSelectedSuggestion(prev => {
                    const next = prev < suggestions.length - 1 ? prev + 1 : 0;
                    return next;
                });
            } else if (e.key === 'Enter' && selectedSuggestion !== -1) {
                e.preventDefault();
                acceptSuggestion(suggestions[selectedSuggestion]);
            } else if (viewMode === 'edit' && e.key === 'ArrowUp') {
                e.preventDefault();
                if (cursorPosition > 0) {
                    setCursorPosition(prev => prev - 1);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [suggestions, selectedSuggestion, cursorPosition, viewMode]);

    // Scroll selected paragraph into view
    useEffect(() => {
        if (selectedParaRef.current) {
            selectedParaRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    }, [cursorPosition, rawText]);

    const acceptSuggestion = (suggestion: Suggestion) => {
        const segments = textManagerRef.current.getSegments();
        const segment = segments.find(seg => seg.startLine === suggestion.lineStart);
        if (segment) {
            textManagerRef.current.updateWorkingCopy(segment.id, suggestion.rewritten);
            setRawText(textManagerRef.current.getFullWorkingText());
        }
    };

    const renderSegments = () => {
        const segments = textManagerRef.current.getSegments();
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
                position: 'relative',
            }}>
                {/* Above */}
                <div style={{ width: '100%' }}>
                    {above.map((segment, index) => (
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
                            onClick={() => handleSelection(segment.id, segment.working)}
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
                            onClick={() => handleSelection(selected.id, selected.original)}
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
                            onClick={() => handleSelection(selected.id, `AI suggestion for: "${selected.working.substring(0, 50)}..."`)}
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
                <div style={{ width: '100%', marginTop: 'calc(50vh + 2rem)' }}>
                    {below.map((segment, index) => (
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
                            onClick={() => handleSelection(segment.id, segment.working)}
                        >
                            {segment.working}
                        </div>
                    ))}
                </div>
                {/* End buttons if at the last segment */}
                {viewMode === 'edit' && cursorPosition === segments.length - 1 && (
                    <div key="end-edit-buttons" style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '1rem',
                        marginTop: '3rem',
                        zIndex: 200,
                    }}>
                        <Button
                            variant="soft"
                            onClick={() => {
                                setViewMode('document');
                                forceUpdate(n => n + 1);
                            }}
                        >
                            Go to Document View
                        </Button>
                        <Button
                            variant="soft"
                            onClick={handleCopy}
                        >
                            {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
                        </Button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <Container size="4" style={{
            backgroundColor: '#1e1e1e',
            height: '100vh',
            padding: '2rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            position: 'relative'
        }}>
            <Sidebar
                documents={documents}
                currentDocumentId={currentDocumentId}
                onSelectDocument={loadDocument}
                onCreateNewDocument={() => createNewDocument('', 'Untitled Document')}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                onCopy={handleCopy}
                copySuccess={copySuccess}
            />
            <div
                ref={mainContainerRef}
                style={{
                    marginLeft: isSidebarOpen ? 280 : 0,
                    transition: 'margin-left 0.2s cubic-bezier(.4,0,.2,1)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    maxWidth: '1200px',
                    margin: '0 auto',
                    backgroundColor: '#1e1e1e',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                <Flex direction="row" gap="4" style={{
                    height: 'calc(100vh - 4rem)', // Account for container padding
                    width: '100%',
                    backgroundColor: '#1e1e1e',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Main Content */}
                    <Flex direction="column" gap="4" style={{
                        flex: 1,
                        backgroundColor: '#1e1e1e',
                        position: 'relative',
                        height: '100%',
                        overflow: viewMode === 'document' ? 'auto' : 'hidden'
                    }}>
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
                                        onClick={() => setViewMode('edit')}
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
                                        onClick={() => {
                                            setViewMode('document');
                                            forceUpdate(n => n + 1);
                                        }}
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
                                {viewMode === 'edit' && textManagerRef.current.getFullWorkingText().trim() === '' ? (
                                    <div style={{
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
                                                onClick={handleLoadTemplate}
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
                                                onClick={handlePaste}
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

                        <div
                            ref={mainContainerRef}
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                width: '100%',
                                backgroundColor: '#1e1e1e',
                                borderRadius: '8px',
                                position: viewMode === 'document' ? 'relative' : 'fixed',
                                overflow: viewMode === 'document' ? 'auto' : 'hidden',
                                padding: viewMode === 'document' ? '1rem' : '0',
                            }}
                        >
                            {viewMode === 'document' ? (
                                // Document view - show text in Obsidian-like format
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
                                    alignItems: 'center',
                                }}>
                                    <ReactMarkdown>
                                        {textManagerRef.current.getFullWorkingText()}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                // Edit view - show the comparison interface
                                renderSegments()
                            )}
                        </div>
                    </Flex>
                </Flex>
            </div>
        </Container>
    );
} 