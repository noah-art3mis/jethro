import { TextManager } from '../textManager';

describe('TextManager', () => {
    it('creates segments from text', () => {
        const text = 'First paragraph\n\nSecond paragraph';
        const manager = new TextManager(text);
        const segments = manager.getSegments();
        
        expect(segments).toHaveLength(2);
        expect(segments[0].original).toBe('First paragraph');
        expect(segments[1].original).toBe('Second paragraph');
    });

    it('updates working copy', () => {
        const text = 'Original text';
        const manager = new TextManager(text);
        const segment = manager.getSegments()[0];
        
        manager.updateWorkingCopy(segment.id, 'Updated text');
        expect(manager.getFullWorkingText()).toBe('Updated text');
    });

    it('resets working copy', () => {
        const text = 'Original text';
        const manager = new TextManager(text);
        const segment = manager.getSegments()[0];
        
        manager.updateWorkingCopy(segment.id, 'Updated text');
        manager.resetWorkingCopy(segment.id);
        expect(manager.getFullWorkingText()).toBe('Original text');
    });

    it('does not move cursor below last segment', () => {
        const text = 'A\n\nB';
        const manager = new TextManager(text);
        manager.moveCursorDown(); // to 1
        const result = manager.moveCursorDown(); // should not move
        expect(result).toBe(false);
        expect(manager.getCursorPosition()).toBe(1);
    });

    it('does not move cursor above first segment', () => {
        const text = 'A\n\nB';
        const manager = new TextManager(text);
        const result = manager.moveCursorUp(); // should not move
        expect(result).toBe(false);
        expect(manager.getCursorPosition()).toBe(0);
    });

    it('gets segment by line number', () => {
        const text = 'A\nB\n\nC';
        const manager = new TextManager(text);
        const seg = manager.getSegmentByLineNumber(2);
        expect(seg?.original).toBe('A\nB');
    });

    it('resets all working copies', () => {
        const text = 'A\n\nB';
        const manager = new TextManager(text);
        const segs = manager.getSegments();
        manager.updateWorkingCopy(segs[0].id, 'X');
        manager.updateWorkingCopy(segs[1].id, 'Y');
        manager.resetAllWorkingCopies();
        expect(manager.getFullWorkingText()).toBe('A\n\nB');
    });
}); 