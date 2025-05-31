import { remark } from 'remark';
import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';

interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

interface ValidationError {
    message: string;
    line?: number;
    column?: number;
}

export async function validateMarkdown(text: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    
    try {
        // Parse the markdown
        const processor = remark();
        const ast = await processor.parse(text);
        
        // Basic structure validation
        if (!ast.children || ast.children.length === 0) {
            errors.push({
                message: 'Document is empty',
                line: 1,
                column: 1
            });
        }

        // Validate heading structure
        let hasMainHeading = false;
        visit(ast, 'heading', (node) => {
            if (node.depth === 1) {
                if (hasMainHeading) {
                    errors.push({
                        message: 'Multiple h1 headings found. Only one main heading is allowed.',
                        line: node.position?.start.line,
                        column: node.position?.start.column
                    });
                }
                hasMainHeading = true;
            }
        });

        // Validate link references
        const linkRefs = new Set<string>();
        visit(ast, 'linkReference', (node) => {
            if (node.identifier) {
                if (linkRefs.has(node.identifier)) {
                    errors.push({
                        message: `Duplicate link reference: ${node.identifier}`,
                        line: node.position?.start.line,
                        column: node.position?.start.column
                    });
                }
                linkRefs.add(node.identifier);
            }
        });

        // Validate code blocks
        visit(ast, 'code', (node) => {
            if (node.lang && !node.value) {
                errors.push({
                    message: `Empty code block with language specified: ${node.lang}`,
                    line: node.position?.start.line,
                    column: node.position?.start.column
                });
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    } catch (error) {
        return {
            isValid: false,
            errors: [{
                message: `Failed to parse markdown: ${error instanceof Error ? error.message : 'Unknown error'}`,
                line: 1,
                column: 1
            }]
        };
    }
}

// Helper function to get a formatted error message
export function formatValidationErrors(errors: ValidationError[]): string {
    return errors.map(error => {
        const location = error.line && error.column 
            ? `(line ${error.line}, column ${error.column})`
            : '';
        return `${error.message} ${location}`;
    }).join('\n');
} 