'use client';

import { Container, Flex, Text } from '@radix-ui/themes';
import Editor from '@monaco-editor/react';
import { useState, useRef, useEffect } from 'react';

const DEFAULT_LEFT_TEXT = `# Welcome to JethroTwin! 📝

The authors of an article linking scores on a “wokeness” scale and mental health issues are  blaming political bias for the retraction of their paper in March following post-publication peer review. 

The article, “Do Conservatives Really Have an Advantage in Mental Health? An Examination of Measurement Invariance,” appeared in the Scandinavian Journal of Psychology last August. It has been cited twice, according to Clarivate’s Web of Science, one being the retraction notice. 

“Following publication of this article, concerns were raised by third parties about the conclusions drawn by the authors based on the data provided,” according to the March 26 notice. After investigating, the publisher and the journal “concluded that the article contains major errors involving methods, theory, and normatively biased language,” which “bring into doubt the conclusions drawn by the authors,” the notice stated. The authors disagreed with the decision.

In a blog post, one author, Emil Kirkegaard, called the journal’s action “my first politically motivated retraction.” Kirkegaard’s studies and writings are provocative, on topics including race and IQ.

“I think the journal’s behavior was fairly typical of academia, and not in a good way,” Kirkegaard told us. “Lots of research shows that politically unfavored research is held to higher standards,” he wrote in an email. He added he was “surprised they published our study to begin with.” 

The paper fell to a practice known as post-publication peer review, which can be controversial. The apparent necessity of post-publication peer review for some papers raises questions about how well publishers ensure the quality of the initial peer review process and editorial decision-making, and which papers earn the extra scrutiny.

After receiving concerns, the editors of the Scandinavian Journal of Psychology “sought post-publication peer review to gain other expert opinions as they reevaluated the paper,” said a spokesperson for Wiley, the journal’s publisher. “In this case, both of the new peer reviewers validated the initial concerns surrounding the paper’s methods, theory, and language, and also raised additional questions,” the spokesperson said, leading to the decision to retract the paper. 

Kirkegaard “is perhaps best known for his provocative writing on genetics and race,” Ashley Smart wrote in an article published on Undark the same day as the retraction notice. Among Kirkegaard’s writings, Smart noted, was a blog post asserting “that the hereditarian hypothesis of intelligence — roughly, the idea that races or ancestry groups differ in average intelligence in ways that are substantially attributable to genetics — is ‘almost certainly true.’”

One of Kirkegaard’s recent papers, “Stereotypes of the Intelligence of Nations,” found Americans’ stereotypes about the intelligence of people from different countries “correlated at .78 with measured national IQ s.” 

In a blog post responding to the Undark article, Kirkegaard called it a “hit piece,” but acknowledged, “Smart did his homework.” 

Soon after the Scandinavian Journal of Psychology published Kirkegaard’s study on “wokeness” and mental health, Leonid Schneider contacted the journal’s editor in chief and Wiley, he wrote in a blog post on For Better Science. He noted the retraction in an April post. 

According to emails Kirkegaard published, the retraction followed an investigation in which two reviewers evaluated the article in light of “concerns raised by third parties.” 

The other author of the retracted article, Edward Dutton, told us the post-publication reviewers were “nominated because they were biased to the far left and would give the desired result.” The issues they raised “were extremely minor and almost inconsequential cavils such as the difference between ‘left-wing’ and ‘woke’ or between ‘religious’ and ‘spiritual,’” he said. 

One of the reviewers “accused us of citing white supremacist literature, when we did no such thing,” Dutton said. “They were simply making up issues to complain about.” 

A Wiley spokesperson did not directly answer our question about the role a paper’s topic or public pressure play in commissioning post-publication peer review. The publisher does not track how often such reviews are commissioned, the spokesperson said. 

The decision to use post-publication peer review “is very case-dependent,” the spokesperson said. The process “can be particularly relevant” when an editor needs “a more specialized subject matter expert” to re-evaluate a paper due to its topic, the spokesperson said, or “when there are concerns about the completeness of the initial peer review, and we need another expert opinion to know whether the paper can stand.” 

The post-publication review did identify a coding problem, which Kirkegaard said “should have been found earlier.” He fixed it, plus another “more important” problem he found upon looking at the dataset again, he said, but “the results didn’t change much.”

“I think these kinds of errors are fairly common in science coding,” Kirkegaard said. “As you probably know, peer review is generally superficial and even if the code and data is provided, reviewers do not generally download the code and data and run things themselves. This is only done when there is some motivating factor. In this case, political hostility, but in other cases it may be fraud concerns.”

The editors and Wiley invited the authors to revise and resubmit the paper for reconsideration, but Kirkegaard and Dutton said they do not plan to do so. 

“The paper has been published,” Dutton said, “and any reasonable academic will see that it’s been retracted for political reasons and will cite it even though it’s been retracted.” 

Like Retraction Watch? You can make a tax-deductible contribution to support our work, follow us on X or Bluesky, like us on Facebook, follow us on LinkedIn, add us to your RSS reader, or subscribe to our daily digest. If you find a retraction that’s not in our database, you can let us know here. For comments or feedback, email us at team@retractionwatch.com.
`;

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