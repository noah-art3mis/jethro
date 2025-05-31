'use client';

import { Container, Flex, Text, Button, Tooltip } from '@radix-ui/themes';
import Editor from '@monaco-editor/react';
import { useState, useRef, useEffect } from 'react';
import template from './template.json';
import { validateMarkdown, formatValidationErrors } from '../utils/markdownValidator';
import { TextManager, TextSegment } from '../utils/textManager';

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

    const handleLoadTemplate = () => {
        textManagerRef.current = new TextManager(template.content);
        setTemplateSuccess(true);
        setTimeout(() => setTemplateSuccess(false), 2000);
    };

    const handlePaste = async () => {
        try {
            // Try modern Clipboard API first
            try {
                const text = await navigator.clipboard.readText();
                console.log('Successfully read from clipboard using modern API');
                textManagerRef.current = new TextManager(text);
                setPasteSuccess(true);
                setTimeout(() => setPasteSuccess(false), 2000);
                return;
            } catch (modernError) {
                console.log('Modern clipboard API failed, trying fallback...');
            }

            // Fallback: Create a temporary textarea
            const textarea = document.createElement('textarea');
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.focus();

            // Try to paste
            const success = document.execCommand('paste');
            if (success) {
                const text = textarea.value;
                textManagerRef.current = new TextManager(text);
                setPasteSuccess(true);
                setTimeout(() => setPasteSuccess(false), 2000);
            } else {
                throw new Error('Paste command failed');
            }

            // Cleanup
            document.body.removeChild(textarea);
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

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (textManagerRef.current.moveCursorDown()) {
                    setCursorPosition(textManagerRef.current.getCursorPosition());
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (textManagerRef.current.moveCursorUp()) {
                    setCursorPosition(textManagerRef.current.getCursorPosition());
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
    }, [suggestions, selectedSuggestion]);

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

    const renderSegments = () => {
        const segmentsWithOpacity = textManagerRef.current.getSegmentsWithOpacity(fadeLength, cursorPosition);
        return segmentsWithOpacity.map(({ segment, opacity }, index) => {
            const isSelected = index === cursorPosition;
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
                            transition: 'opacity 0.3s ease',
                            marginBottom: '1rem',
                            maxWidth: 'calc(68ch * 2 + 2rem)',
                        }}
                    >
                        <div
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
                            }}
                        >
                            {segment.working}
                        </div>
                        <div
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
                            }}
                        >
                            {aiSuggestion}
                        </div>
                    </div>
                );
            } else {
                return (
                    <div
                        key={segment.id}
                        style={{
                            opacity,
                            transition: 'opacity 0.3s ease',
                            backgroundColor: 'transparent',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            marginBottom: '1rem',
                            color: '#e0bfae',
                            fontFamily: 'inherit',
                            fontSize: 16,
                            whiteSpace: 'pre-wrap',
                            maxWidth: '68ch',
                        }}
                    >
                        {segment.working}
                    </div>
                );
            }
        });
    };

    return (
        <Container size="4" style={{
            backgroundColor: '#1e1e1e',
            minHeight: '100vh',
            padding: '2rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <Flex direction="column" gap="4" style={{
                height: '100vh',
                maxWidth: '800px',
                width: '100%',
                margin: '0 auto',
                backgroundColor: '#1e1e1e'
            }}>
                <Flex justify="between" align="center" style={{ marginBottom: '1rem' }}>
                    <Text size="6" weight="bold" style={{
                        color: '#ffffff',
                        letterSpacing: '-0.02em',
                        background: 'linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>Parallax</Text>
                    <Flex gap="2" align="center">
                        {validationErrors.length > 0 && (
                            <Tooltip content={validationErrors.join('\n')}>
                                <Text size="2" style={{ color: '#ff6b6b' }}>
                                    ⚠️ {validationErrors.length} validation {validationErrors.length === 1 ? 'error' : 'errors'}
                                </Text>
                            </Tooltip>
                        )}
                        <Tooltip content={templateSuccess ? "Template loaded!" : "Load template content"}>
                            <Button
                                onClick={handleLoadTemplate}
                                variant="soft"
                                style={{
                                    backgroundColor: templateSuccess ? '#2e7d32' : '#2d2d2d',
                                    color: '#dcddde',
                                    border: '1px solid #3d3d3d',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {templateSuccess ? '✓ Template Loaded!' : '📝 Load Template'}
                            </Button>
                        </Tooltip>
                        <Tooltip content={pasteSuccess ? "Pasted!" : "Paste text from your clipboard (Ctrl+V)"}>
                            <Button
                                onClick={handlePaste}
                                variant="soft"
                                style={{
                                    backgroundColor: pasteSuccess ? '#2e7d32' : '#2d2d2d',
                                    color: '#dcddde',
                                    border: '1px solid #3d3d3d',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {pasteSuccess ? '✓ Pasted!' : '📋 Paste from Clipboard'}
                            </Button>
                        </Tooltip>
                        <Tooltip content={copySuccess ? "Copied!" : "Copy text to clipboard"}>
                            <Button
                                onClick={handleCopy}
                                variant="soft"
                                style={{
                                    backgroundColor: copySuccess ? '#2e7d32' : '#2d2d2d',
                                    color: '#dcddde',
                                    border: '1px solid #3d3d3d',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {copySuccess ? '✓ Copied!' : '📋 Copy to Clipboard'}
                            </Button>
                        </Tooltip>
                    </Flex>
                </Flex>

                <div
                    ref={containerRef}
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        width: '100%',
                        backgroundColor: '#1e1e1e',
                        borderRadius: '8px',
                        overflow: 'auto',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        position: 'relative',
                        padding: '1rem 0',
                    }}
                >
                    {renderSegments()}
                </div>
            </Flex>
        </Container>
    );
} 