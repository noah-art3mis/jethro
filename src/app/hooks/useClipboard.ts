import { useState, useCallback } from 'react';

interface UseClipboardProps {
  createNewDocument: (content: string, title: string) => void;
}

interface UseClipboardReturn {
  copyText: (text: string) => Promise<void>;
  pasteText: () => Promise<void>;
  copySuccess: boolean;
  pasteSuccess: boolean;
}

export function useClipboard({ createNewDocument }: UseClipboardProps): UseClipboardReturn {
  const [copySuccess, setCopySuccess] = useState(false);
  const [pasteSuccess, setPasteSuccess] = useState(false);

  const copyText = useCallback(async (text: string) => {
    try {
      try {
        await navigator.clipboard.writeText(text);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        return;
      } catch (modernError) {
        // Fallback for older browsers or environments without navigator.clipboard
      }
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed'; // Make it invisible
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      if (success) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } else {
        throw new Error('Copy command failed');
      }
      document.body.removeChild(textarea);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy to clipboard. Please try using Ctrl+C (Cmd+C on Mac) to copy directly.');
      setCopySuccess(false); // Ensure state is reset on error
    }
  }, []);

  const pasteText = useCallback(async () => {
    try {
      let text = '';
      try {
        text = await navigator.clipboard.readText();
      } catch (modernError) {
        // Fallback for older browsers or environments without navigator.clipboard
        const textarea = document.createElement('textarea');
        textarea.style.position = 'fixed'; // Make it invisible
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        const success = document.execCommand('paste');
        if (success) {
          text = textarea.value;
        } else {
          throw new Error('Paste command failed');
        }
        document.body.removeChild(textarea);
      }
      createNewDocument(text, 'Pasted Document');
      setPasteSuccess(true);
      setTimeout(() => setPasteSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to paste text: ', err);
      alert('Failed to read from clipboard. Please try using Ctrl+V (Cmd+V on Mac) to paste directly.');
      setPasteSuccess(false); // Ensure state is reset on error
    }
  }, [createNewDocument]);

  return { copyText, pasteText, copySuccess, pasteSuccess };
}
