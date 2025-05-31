import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Parallax - AI-Powered Text Editor',
    description: 'A modern text editor with LLM integration and parallel comparison view',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <Theme appearance="dark" accentColor="blue" grayColor="slate" scaling="95%">
                    {children}
                </Theme>
            </body>
        </html>
    );
} 