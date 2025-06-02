import { useState, useEffect } from 'react';

// Define Document and Paragraph interfaces
// In a larger app, these might live in a dedicated types file (e.g., src/app/types.ts)
export interface Paragraph {
    id: string;
    original: string;
    current: string;
    aiSuggested: string;
    isSelected: boolean; // This was part of Paragraph in page.tsx's createParagraphsFromSegments
}

export interface Document {
    id: string;
    title: string;
    paragraphs: Paragraph[];
    lastModified: Date;
}

export function useLocalStorageDocuments(): [Document[], React.Dispatch<React.SetStateAction<Document[]>>] {
    const [documents, setDocuments] = useState<Document[]>([]);

    // Load documents from localStorage on mount
    useEffect(() => {
        const savedDocuments = localStorage.getItem('documents');
        if (savedDocuments) {
            try {
                const parsedDocs = JSON.parse(savedDocuments).map((doc: any) => ({
                    ...doc,
                    paragraphs: doc.paragraphs || [], // Ensure paragraphs exist
                    lastModified: new Date(doc.lastModified)
                }));
                setDocuments(parsedDocs);
            } catch (error) {
                console.error("Failed to parse documents from localStorage", error);
                // Optionally, clear corrupted data or set to default
                localStorage.removeItem('documents');
                setDocuments([]);
            }
        }
    }, []); // Empty dependency array ensures this runs only on mount

    // Save documents to localStorage whenever they change
    useEffect(() => {
        // Prevents overwriting with empty array on initial load if localStorage was empty
        if (documents.length > 0 || localStorage.getItem('documents') !== null) {
            localStorage.setItem('documents', JSON.stringify(documents));
        }
    }, [documents]); // This effect runs whenever the documents state changes

    return [documents, setDocuments];
}
