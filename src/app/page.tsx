'use client';

import { Container, Flex } from '@radix-ui/themes'; // Text, Button, Tooltip are not directly used
// Editor not used
import { useState, useRef, useEffect, useCallback } from 'react';
import template from './template.json';
import { validateMarkdown } from '../utils/markdownValidator'; // formatValidationErrors removed
import { TextManager, TextSegment } from '../utils/textManager';
// SidebarToggle not used

import { Sidebar } from './Sidebar';
import Header from './components/main/Header';
import EditView from './components/main/EditView';
import DocumentView from './components/main/DocumentView';
import { useLocalStorageDocuments, Document, Paragraph } from '../hooks/useLocalStorageDocuments';
import { useClipboard } from '../hooks/useClipboard';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation'; // HookSuggestion removed

// Suggestion interface is used for suggestions state and acceptSuggestion function
interface Suggestion {
    original: string;
    rewritten: string;
    lineStart: number;
    lineEnd: number;
}

export default function Home() {
    // Document Management State
    const [documents, setDocuments] = useLocalStorageDocuments(); // Use the custom hook
    const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);

    // Editor Content State
    const textManagerRef = useRef<TextManager>(new TextManager(''));
    const [rawText, setRawText] = useState(textManagerRef.current.getFullWorkingText());
    const [selectedSegments, setSelectedSegments] = useState<Set<string>>(new Set());

    // Suggestions State
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [selectedSuggestion, setSelectedSuggestion] = useState<number>(-1);

    // UI/View State
    const [viewMode, setViewMode] = useState<'edit' | 'document'>('edit');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [cursorPosition, setCursorPosition] = useState(0);

    // Temporary Feedback State (template part remains, clipboard part moves to hook)
    const [templateSuccess, setTemplateSuccess] = useState(false);

    // Validation State
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // Refs for DOM elements
    const mainContainerRef = useRef<HTMLDivElement>(null);
    const selectedParaRef = useRef<HTMLDivElement>(null);

    // Utility State (Force Update)
    const [, forceUpdate] = useState(0);

    // Clipboard Hook
    const { copyText, pasteText, copySuccess, pasteSuccess } = useClipboard({ createNewDocument });

    // Keyboard Navigation Hook
    useKeyboardNavigation({
        isActive: viewMode === 'edit',
        suggestions,
        selectedSuggestion,
        setSelectedSuggestion,
        acceptSuggestion, // This function's stability depends on its own dependencies
        cursorPosition,
        setCursorPosition,
        segments: textManagerRef.current.getSegments(), // This will be stale if not re-evaluated; consider passing textManagerRef.current
        onSegmentSelect: handleSelection, // This function's stability
    });

    // Helper function for creating paragraph objects, used in createNewDocument and updateCurrentDocument
    const createParagraphsFromSegments = useCallback((segments: TextSegment[]): Paragraph[] => {
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
    }, [selectedSegments]); // Depends on selectedSegments for the isSelected property

    // Rebuild paragraphs in the current document
    const updateCurrentDocument = useCallback(() => {
        if (currentDocumentId) {
            setDocuments(prevDocs => prevDocs.map(doc => {
                if (doc.id === currentDocumentId) {
                    const segments = textManagerRef.current.getSegments();
                    const updatedParagraphs = createParagraphsFromSegments(segments);
                    return { ...doc, paragraphs: updatedParagraphs, lastModified: new Date() };
                }
                return doc;
            }));
        }
    }, [currentDocumentId, setDocuments, createParagraphsFromSegments, textManagerRef]);

    // Effect to update document content when rawText changes
    useEffect(() => {
        if (currentDocumentId) {
            updateCurrentDocument();
        }
    }, [rawText, currentDocumentId, updateCurrentDocument]); // Added currentDocumentId and updateCurrentDocument

    const handleLoadTemplate = () => {
        createNewDocument(template.content, 'Template Document');
        setTemplateSuccess(true);
        setTimeout(() => setTemplateSuccess(false), 2000);
    };

    const generateSuggestions = useCallback((segments: TextSegment[]): Suggestion[] => {
        return segments.map(segment => ({
            original: segment.original,
            rewritten: `AI suggestion for: "${segment.original.substring(0, 50)}..."`, // This is placeholder AI suggestion
            lineStart: segment.startLine,
            lineEnd: segment.endLine
        }));
    }, []);

    // Effect to update suggestions when rawText changes
    useEffect(() => {
        const newSuggestions = generateSuggestions(textManagerRef.current.getSegments());
        setSuggestions(newSuggestions);
        setSelectedSuggestion(newSuggestions.length > 0 ? 0 : -1);
    }, [rawText, generateSuggestions, textManagerRef]); // Added generateSuggestions and textManagerRef

    // Effect for markdown validation (debounced)
    useEffect(() => {
        const validate = async () => {
            const result = await validateMarkdown(textManagerRef.current.getFullWorkingText());
            if (!result.isValid) {
                setValidationErrors(result.errors.map(error =>
                    `${error.message} (line ${error.line}, column ${error.column})`
                ));
            } else {
                setValidationErrors([]);
            }
        };
        const handler = setTimeout(validate, 300);
        return () => clearTimeout(handler);
    }, [rawText, textManagerRef]); // Added textManagerRef

    // Function to handle segment selection/update
    const handleSelection = useCallback((segmentId: string, text: string) => {
        textManagerRef.current.updateWorkingCopy(segmentId, text);
        setRawText(textManagerRef.current.getFullWorkingText()); // Triggers other effects based on rawText
        setSelectedSegments(prev => new Set(Array.from(prev).concat(segmentId)));
    }, [textManagerRef, setRawText, setSelectedSegments]);

    // Effect to scroll the selected paragraph into view
    useEffect(() => {
        if (selectedParaRef.current) {
            selectedParaRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [cursorPosition, rawText]); // rawText might affect layout, so it's a reasonable dependency

    // Function to accept an AI suggestion
    const acceptSuggestion = useCallback((suggestion: Suggestion) => {
        const segments = textManagerRef.current.getSegments();
        const segment = segments.find(seg => seg.startLine === suggestion.lineStart);
        if (segment) {
            textManagerRef.current.updateWorkingCopy(segment.id, suggestion.rewritten);
            setRawText(textManagerRef.current.getFullWorkingText()); // Triggers other effects
        }
    }, [textManagerRef, setRawText]);

    const handleSetViewModeDocument = () => {
        setViewMode('document');
        forceUpdate(n => n + 1);
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
                onCopy={() => copyText(textManagerRef.current.getFullWorkingText())}
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
                        <Header
                            viewMode={viewMode}
                            onViewModeChange={(mode) => {
                                setViewMode(mode);
                                if (mode === 'document') {
                                    forceUpdate(n => n + 1);
                                }
                            }}
                            textIsEmpty={textManagerRef.current.getFullWorkingText().trim() === ''}
                            handleLoadTemplate={handleLoadTemplate}
                            templateSuccess={templateSuccess}
                            // Props for clipboard functionality using the hook
                            onPasteDocument={pasteText}
                            pasteDocumentSuccess={pasteSuccess}
                            validationErrors={validationErrors}
                        />
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
                                <DocumentView content={textManagerRef.current.getFullWorkingText()} />
                            ) : (
                                // Edit view - show the comparison interface
                                <EditView
                                    textManager={textManagerRef.current}
                                    cursorPosition={cursorPosition}
                                    selectedSegments={selectedSegments}
                                    onSegmentSelect={handleSelection}
                                    onSetViewModeDocument={handleSetViewModeDocument}
                                    onCopy={() => copyText(textManagerRef.current.getFullWorkingText())}
                                    copySuccess={copySuccess}
                                    selectedParaRef={selectedParaRef}
                                />
                            )}
                        </div>
                    </Flex>
                </Flex>
            </div>
        </Container>
    );
} 