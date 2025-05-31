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
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [selectedSuggestion, setSelectedSuggestion] = useState<number>(-1);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [copySuccess, setCopySuccess] = useState(false);
    const [pasteSuccess, setPasteSuccess] = useState(false);
    const [templateSuccess, setTemplateSuccess] = useState(false);
    const leftEditorRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const paraRef = useRef<HTMLDivElement>(null);
    const [fadeLength, setFadeLength] = useState(8);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [selectedSegments, setSelectedSegments] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<'edit' | 'document'>('edit');
    const [documents, setDocuments] = useState<Document[]>([]);
    const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

    const createParagraphsFromText = (text: string): Paragraph[] => {
        const segments = text.split('\n\n').filter(segment => segment.trim());
        return segments.map((segment, index) => ({
            id: `${Date.now()}-${index}`,
            original: segment.trim(),
            current: segment.trim(),
            aiSuggested: `AI suggestion for: "${segment.trim().substring(0, 50)}..."`,
            isSelected: false
        }));
    };

    const createNewDocument = (content: string, title: string = 'Untitled Document') => {
        const newDoc: Document = {
            id: Date.now().toString(),
            title,
            paragraphs: createParagraphsFromText(content),
            lastModified: new Date()
        };
        setDocuments(prev => [...prev, newDoc]);
        setCurrentDocumentId(newDoc.id);
        textManagerRef.current = new TextManager(content);
        setCursorPosition(0);
        setSelectedSegments(new Set());
    };

    const loadDocument = (docId: string) => {
        const doc = documents.find(d => d.id === docId);
        if (doc) {
            setCurrentDocumentId(docId);
            const content = doc.paragraphs.map(p => p.current).join('\n\n');
            textManagerRef.current = new TextManager(content);
            setCursorPosition(0);
            setSelectedSegments(new Set());
        }
    };

    const updateCurrentDocument = () => {
        if (currentDocumentId) {
            setDocuments(prev => prev.map(doc => {
                if (doc.id === currentDocumentId) {
                    const segments = textManagerRef.current.getSegments();
                    const updatedParagraphs = doc.paragraphs.map((para, index) => {
                        const segment = segments[index];
                        if (segment) {
                            return {
                                ...para,
                                current: segment.working,
                                isSelected: selectedSegments.has(segment.id)
                            };
                        }
                        return para;
                    });
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
    }, [textManagerRef.current.getFullWorkingText()]);

    const handleLoadTemplate = () => {
        createNewDocument(template.content, 'Template Document');
        setTemplateSuccess(true);
        setTimeout(() => setTemplateSuccess(false), 2000);
    };

    const handlePaste = async () => {
        try {
            let text = '';
            // Try modern Clipboard API first
            try {
                text = await navigator.clipboard.readText();
                console.log('Successfully read from clipboard using modern API');
            } catch (modernError) {
                console.log('Modern clipboard API failed, trying fallback...');
                // Fallback: Create a temporary textarea
                const textarea = document.createElement('textarea');
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.focus();

                // Try to paste
                const success = document.execCommand('paste');
                if (success) {
                    text = textarea.value;
                } else {
                    throw new Error('Paste command failed');
                }

                // Cleanup
                document.body.removeChild(textarea);
            }

            createNewDocument(text, 'Pasted Document');
            setPasteSuccess(true);
            setTimeout(() => setPasteSuccess(false), 2000);
        } catch (err) {
            console.error('Failed to read from clipboard:', err);
            alert('Failed to read from clipboard. Please try using Ctrl+V (Cmd+V on Mac) to paste directly.');
        }
    };

    const handleCopy = async () => {
        try {
            const textToCopy = textManagerRef.current.getFullWorkingText();

            // Try modern Clipboard API first
            try {
                await navigator.clipboard.writeText(textToCopy);
                console.log('Successfully copied using modern API');
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
                return;
            } catch (modernError) {
                console.log('Modern clipboard API failed, trying fallback...');
            }

            // Fallback: Create a temporary textarea
            const textarea = document.createElement('textarea');
            textarea.value = textToCopy;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();

            // Try to copy
            const success = document.execCommand('copy');
            if (success) {
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            } else {
                throw new Error('Copy command failed');
            }

            // Cleanup
            document.body.removeChild(textarea);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            alert('Failed to copy to clipboard. Please try using Ctrl+C (Cmd+C on Mac) to copy directly.');
        }
    };

    const generateSuggestions = (segments: TextSegment[]) => {
        console.log('Generating suggestions...');
        const newSuggestions = segments.map(segment => ({
            original: segment.original,
            rewritten: `AI suggestion for: "${segment.original.substring(0, 50)}..."`,
            lineStart: segment.startLine,
            lineEnd: segment.endLine
        }));
        console.log(`Generated ${newSuggestions.length} suggestions`);
        return newSuggestions;
    };

    // Update suggestions whenever text changes
    useEffect(() => {
        console.log('Text changed, updating suggestions...');
        const newSuggestions = generateSuggestions(textManagerRef.current.getSegments());
        setSuggestions(newSuggestions);
        setSelectedSuggestion(newSuggestions.length > 0 ? 0 : -1);
    }, [textManagerRef]);

    const handleSelection = (segmentId: string, text: string) => {
        textManagerRef.current.updateWorkingCopy(segmentId, text);
        setSelectedSegments(prev => new Set(Array.from(prev).concat(segmentId)));

        // Update the current document's paragraphs
        if (currentDocumentId) {
            setDocuments(prev => prev.map(doc => {
                if (doc.id === currentDocumentId) {
                    const updatedParagraphs = doc.paragraphs.map(para => {
                        if (para.id === segmentId) {
                            return {
                                ...para,
                                current: text,
                                isSelected: true
                            };
                        }
                        return para;
                    });
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

    const renderSegments = () => {
        const segmentsWithOpacity = textManagerRef.current.getSegmentsWithOpacity(fadeLength, cursorPosition);
        return segmentsWithOpacity.map(({ segment, opacity }, index) => {
            const isSelected = index === cursorPosition;
            const isAccepted = selectedSegments.has(segment.id);
            const acceptedIndex = isAccepted ? Array.from(selectedSegments).indexOf(segment.id) : -1;

            if (isSelected) {
                // Generate AI suggestion (reuse your suggestion logic)
                const aiSuggestion = `AI suggestion for: "${segment.working.substring(0, 50)}..."`;
                return (
                    <div
                        key={segment.id}
                        ref={paraRef}
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            gap: '2rem',
                            opacity,
                            transition: 'all 0.5s ease',
                            marginBottom: '1rem',
                            maxWidth: 'calc(68ch * 2 + 2rem)',
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 10,
                            backgroundColor: '#1e1e1e',
                            padding: '2rem',
                            width: '100%',
                        }}
                    >
                        <div
                            onClick={() => handleSelection(segment.id, segment.original)}
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
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(45, 45, 45, 0.7)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(45, 45, 45, 0.5)';
                            }}
                        >
                            {segment.working}
                        </div>
                        <div
                            onClick={() => handleSelection(segment.id, aiSuggestion)}
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
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(30, 60, 90, 0.35)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(30, 60, 90, 0.25)';
                            }}
                        >
                            {aiSuggestion}
                        </div>
                    </div>
                );
            } else {
                const baseTransform = isAccepted
                    ? `translate(-50%, ${-40 - (acceptedIndex * 25)}%)`
                    : `translate(-50%, ${50 + ((index - cursorPosition) * 100)}%)`;

                return (
                    <div
                        key={segment.id}
                        style={{
                            opacity: isAccepted ? 1 : opacity,
                            transition: 'all 0.5s ease',
                            backgroundColor: isAccepted ? 'rgba(30, 30, 30, 0.5)' : 'transparent',
                            padding: isAccepted ? '1rem' : '0.5rem',
                            borderRadius: '4px',
                            marginBottom: '1rem',
                            color: '#e0bfae',
                            fontFamily: 'inherit',
                            fontSize: 16,
                            whiteSpace: 'pre-wrap',
                            maxWidth: '68ch',
                            transform: baseTransform,
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            width: '100%',
                            border: isAccepted ? '1px solid rgba(174, 224, 191, 0.3)' : 'none',
                            zIndex: isAccepted ? 5 : 1,
                        }}
                    >
                        {segment.working}
                    </div>
                );
            }
        });
    };

    // Add effect to scroll selected text into view
    useEffect(() => {
        if (paraRef.current) {
            paraRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, [cursorPosition]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                const currentSegment = textManagerRef.current.getCurrentSegment();
                if (currentSegment) {
                    const aiSuggestion = `AI suggestion for: "${currentSegment.working.substring(0, 50)}..."`;
                    const newText = e.key === 'ArrowLeft' ? currentSegment.original : aiSuggestion;
                    handleSelection(currentSegment.id, newText);

                    // Move to next paragraph if available
                    if (cursorPosition < textManagerRef.current.getSegments().length - 1) {
                        setCursorPosition(prev => prev + 1);
                    } else {
                        // Reached the end, switch to document view
                        setViewMode('document');
                        setCursorPosition(0);
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
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [suggestions, selectedSuggestion, cursorPosition]);

    // Add validation effect
    useEffect(() => {
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
    }, [textManagerRef]);

    // Calculate fadeLength based on screen height and average paragraph height
    useEffect(() => {
        function updateFadeLength() {
            if (containerRef.current && paraRef.current) {
                const containerHeight = containerRef.current.offsetHeight;
                const paraHeight = paraRef.current.offsetHeight;
                if (paraHeight > 0) {
                    // Number of visible paragraphs in the container
                    const visibleParas = Math.floor(containerHeight / paraHeight);
                    setFadeLength(Math.max(2, visibleParas - 1));
                }
            }
        }
        updateFadeLength();
        window.addEventListener('resize', updateFadeLength);
        return () => window.removeEventListener('resize', updateFadeLength);
    }, []);

    const acceptSuggestion = (suggestion: Suggestion) => {
        console.log('Accepting suggestion...', {
            lineStart: suggestion.lineStart,
            lineEnd: suggestion.lineEnd
        });

        const segment = textManagerRef.current.getSegmentByLineNumber(suggestion.lineStart);
        if (segment) {
            const newTextManager = new TextManager(textManagerRef.current.getFullOriginalText());
            newTextManager.updateWorkingCopy(segment.id, suggestion.rewritten);
            textManagerRef.current = newTextManager;
        }
    };

    return (
        <Container size="4" style={{
            backgroundColor: '#1e1e1e',
            height: '100vh',
            padding: '2rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden'
        }}>
            <Flex direction="row" gap="4" style={{
                height: 'calc(100vh - 4rem)', // Account for container padding
                width: '100%',
                maxWidth: '1200px',
                margin: '0 auto',
                backgroundColor: '#1e1e1e',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Sidebar */}
                <div style={{
                    width: isSidebarOpen ? '250px' : '0',
                    backgroundColor: '#2d2d2d',
                    borderRadius: '8px',
                    padding: isSidebarOpen ? '1rem' : '0',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    position: 'relative',
                    overflow: 'visible'
                }}>
                    <div style={{
                        position: 'absolute',
                        left: isSidebarOpen ? '1rem' : '-40px',
                        top: '1rem',
                        width: '40px',
                        zIndex: 10
                    }}>
                        <SidebarToggle isOpen={isSidebarOpen} onClick={() => setIsSidebarOpen(!isSidebarOpen)} />
                    </div>
                    {isSidebarOpen && (
                        <>
                            <Text size="2" weight="bold" style={{ color: '#a0a0a0', marginTop: '1rem', flexShrink: 0 }}>Documents</Text>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                                overflowY: 'auto',
                                flex: 1,
                                minHeight: 0,
                                marginTop: '0.5rem'
                            }}>
                                {documents.map(doc => (
                                    <Button
                                        key={doc.id}
                                        onClick={() => loadDocument(doc.id)}
                                        variant="soft"
                                        style={{
                                            backgroundColor: currentDocumentId === doc.id ? '#2e7d32' : '#3d3d3d',
                                            color: '#dcddde',
                                            border: '1px solid #4d4d4d',
                                            padding: '0.5rem',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            textAlign: 'left',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            flexShrink: 0
                                        }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <Text size="2" style={{ fontWeight: 'bold' }}>{doc.title}</Text>
                                            <Text size="1" style={{ color: '#a0a0a0' }}>
                                                {doc.lastModified.toLocaleDateString()}
                                            </Text>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                            <div style={{
                                borderTop: '1px solid #3d3d3d',
                                paddingTop: '1rem',
                                marginTop: '1rem',
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
                                                backgroundColor: '#3d3d3d',
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
                                            onClick={handleCopy}
                                            variant="soft"
                                            style={{
                                                backgroundColor: copySuccess ? '#2e7d32' : '#3d3d3d',
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
                        </>
                    )}
                </div>

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
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    ✏️ Edit View
                                </Button>
                                <Button
                                    onClick={() => setViewMode('document')}
                                    variant="soft"
                                    style={{
                                        backgroundColor: viewMode === 'document' ? '#2e7d32' : '#2d2d2d',
                                        color: '#dcddde',
                                        border: '1px solid #3d3d3d',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    📄 Document View
                                </Button>
                            </Flex>
                            {textManagerRef.current.getFullWorkingText().trim() === '' ? (
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    zIndex: 100,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1rem',
                                    alignItems: 'center'
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
                                                transition: 'all 0.2s ease',
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
                                                transition: 'all 0.2s ease',
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
                        ref={containerRef}
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
                                    {(documents.find(doc => doc.id === currentDocumentId)?.paragraphs
                                        .map(p => p.current.trim())
                                        .join('\n\n')) || ''}
                                </ReactMarkdown>
                            </div>
                        ) : (
                            // Edit view - show the comparison interface
                            renderSegments()
                        )}
                    </div>
                </Flex>
            </Flex>
        </Container>
    );
} 