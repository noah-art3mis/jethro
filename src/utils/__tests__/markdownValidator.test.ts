import { validateMarkdown, formatValidationErrors } from '../markdownValidator';

describe('MarkdownValidator', () => {
    it('validates empty document', async () => {
        const result = await validateMarkdown('');
        expect(result.isValid).toBe(false);
        expect(result.errors[0].message).toBe('Document is empty');
    });

    it('validates document with multiple h1 headings', async () => {
        const markdown = '# First heading\n\n# Second heading';
        const result = await validateMarkdown(markdown);
        expect(result.isValid).toBe(false);
        expect(result.errors[0].message).toContain('Multiple h1 headings');
    });

    it('validates correct markdown', async () => {
        const markdown = '# Main heading\n\nSome content';
        const result = await validateMarkdown(markdown);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('formats validation errors', () => {
        const errors = [
            { message: 'Test error', line: 1, column: 1 },
            { message: 'Another error', line: 2, column: 3 }
        ];
        const formatted = formatValidationErrors(errors);
        expect(formatted).toBe('Test error (line 1, column 1)\nAnother error (line 2, column 3)');
    });
}); 