export interface TextSegment {
    id: string;
    original: string;
    working: string;
    startLine: number;
    endLine: number;
}

export class TextManager {
    private segments: TextSegment[] = [];
    private nextId: number = 0;
    private cursorPosition: number = -1;

    constructor(text: string) {
        this.segments = this.segmentText(text);
        if (this.segments.length > 0) {
            this.cursorPosition = 0;
        }
    }

    private segmentText(text: string): TextSegment[] {
        const paragraphs = text.split(/\n\s*\n/).filter(para => para.trim() !== '');
        let lineCount = 1;
        
        return paragraphs.map(para => {
            const paraLineCount = para.split('\n').length;
            const segment: TextSegment = {
                id: `segment-${this.nextId++}`,
                original: para,
                working: para,
                startLine: lineCount,
                endLine: lineCount + paraLineCount - 1
            };
            lineCount += paraLineCount + 1;
            return segment;
        });
    }

    public getSegments(): TextSegment[] {
        return this.segments;
    }

    public getSegmentById(id: string): TextSegment | undefined {
        return this.segments.find(segment => segment.id === id);
    }

    public getCurrentSegment(): TextSegment | undefined {
        return this.segments[this.cursorPosition];
    }

    public moveCursorDown(): boolean {
        if (this.cursorPosition < this.segments.length - 1) {
            this.cursorPosition++;
            return true;
        }
        return false;
    }

    public moveCursorUp(): boolean {
        if (this.cursorPosition > 0) {
            this.cursorPosition--;
            return true;
        }
        return false;
    }

    public getCursorPosition(): number {
        return this.cursorPosition;
    }

    public getSegmentsWithOpacity(fadeLength: number = 8, cursorPosition?: number): { segment: TextSegment; opacity: number }[] {
        const cursor = cursorPosition !== undefined ? cursorPosition : this.cursorPosition;
        return this.segments.map((segment, index) => {
            if (index <= cursor) {
                return { segment, opacity: 1 };
            } else {
                // Calculate opacity based on distance from cursor and fadeLength
                const distance = index - cursor;
                const opacity = Math.max(0, 1 - (distance / fadeLength));
                return { segment, opacity };
            }
        });
    }

    public updateWorkingCopy(id: string, newText: string): void {
        const segment = this.getSegmentById(id);
        if (segment) {
            segment.working = newText;
        }
    }

    public getFullWorkingText(): string {
        return this.segments.map(segment => segment.working).join('\n\n');
    }

    public getFullOriginalText(): string {
        return this.segments.map(segment => segment.original).join('\n\n');
    }

    public resetWorkingCopy(id: string): void {
        const segment = this.getSegmentById(id);
        if (segment) {
            segment.working = segment.original;
        }
    }

    public resetAllWorkingCopies(): void {
        this.segments.forEach(segment => {
            segment.working = segment.original;
        });
    }

    public getSegmentByLineNumber(lineNumber: number): TextSegment | undefined {
        return this.segments.find(segment => 
            lineNumber >= segment.startLine && lineNumber <= segment.endLine
        );
    }
} 