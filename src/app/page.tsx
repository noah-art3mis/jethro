'use client';

import { Container, Flex, Text } from '@radix-ui/themes';
import Editor from '@monaco-editor/react';
import { useState, useRef, useEffect } from 'react';

const DEFAULT_LEFT_TEXT = `# Welcome to JethroTwin! 📝

Start writing your text here. Each paragraph will get an AI suggestion automatically.

Press Tab to move through suggestions, and Enter to accept them.

Try adding or modifying paragraphs to see the AI suggestions update in real-time.`;

interface Suggestion {
    original: string;
    rewritten: string;
    lineStart: number;
    lineEnd: number;
}

export default function Home() {
    const [originalText, setOriginalText] = useState(DEFAULT_LEFT_TEXT);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [selectedSuggestion, setSelectedSuggestion] = useState<number>(-1);
    const leftEditorRef = useRef<any>(null);

    const splitIntoParagraphs = (text: string): string[] => {
        return text.split(/\n\s*\n/).filter(para => para.trim() !== '');
    };

    const generateSuggestions = (text: string) => {
        const paragraphs = splitIntoParagraphs(text);
        let lineCount = 1;
        return paragraphs.map(para => {
            const paraLineCount = para.split('\n').length;
            const suggestion: Suggestion = {
                original: para,
                // TODO: Replace with actual AI call
                rewritten: `AI suggestion for: "${para.substring(0, 50)}..."`,
                lineStart: lineCount,
                lineEnd: lineCount + paraLineCount - 1
            };
            lineCount += paraLineCount + 1; // +1 for the blank line between paragraphs
            return suggestion;
        });
    };

    // Update suggestions whenever text changes
    useEffect(() => {
        const newSuggestions = generateSuggestions(originalText);
        setSuggestions(newSuggestions);
        setSelectedSuggestion(newSuggestions.length > 0 ? 0 : -1);
    }, [originalText]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (suggestions.length === 0) return;

            if (e.key === 'Tab') {
                e.preventDefault();
                setSelectedSuggestion(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === 'Enter' && selectedSuggestion !== -1) {
                e.preventDefault();
                acceptSuggestion(suggestions[selectedSuggestion]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [suggestions, selectedSuggestion]);

    const acceptSuggestion = (suggestion: Suggestion) => {
        if (!leftEditorRef.current) return;

        const editor = leftEditorRef.current;
        const model = editor.getModel();
        if (!model) return;

        editor.executeEdits('accept-suggestion', [{
            range: {
                startLineNumber: suggestion.lineStart,
                startColumn: 1,
                endLineNumber: suggestion.lineEnd,
                endColumn: model.getLineMaxColumn(suggestion.lineEnd)
            },
            text: suggestion.rewritten
        }]);
    };

    return (
        <Container size="4">
            <Flex direction="column" gap="4" style={{ height: '100vh', padding: '1rem' }}>
                <Text size="5" weight="bold">JethroTwin</Text>

                <div className="editor-container">
                    <div>
                        <Editor
                            height="100%"
                            defaultLanguage="markdown"
                            theme="vs-dark"
                            value={originalText}
                            onChange={(value) => setOriginalText(value || '')}
                            onMount={(editor) => leftEditorRef.current = editor}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                wordWrap: 'on',
                                lineNumbers: 'on',
                                renderWhitespace: 'boundary',
                            }}
                        />
                    </div>

                    <div className="suggestions-panel">
                        <Flex direction="column" gap="3">
                            {suggestions.map((suggestion, index) => (
                                <div
                                    key={index}
                                    className={`suggestion-container ${index === selectedSuggestion ? 'selected' : ''}`}
                                >
                                    <Text size="2" color="gray">
                                        Paragraph {index + 1} (Lines {suggestion.lineStart}-{suggestion.lineEnd}):
                                    </Text>
                                    <div className="original-text">
                                        {suggestion.original}
                                    </div>
                                    <Text size="2" color="gray">Suggestion:</Text>
                                    <div className="suggestion-text">
                                        {suggestion.rewritten}
                                    </div>
                                    {index < suggestions.length - 1 && <hr className="separator" />}
                                </div>
                            ))}
                        </Flex>
                    </div>
                </div>
            </Flex>
        </Container>
    );
} 