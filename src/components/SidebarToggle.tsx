import { Button } from '@radix-ui/themes';

interface SidebarToggleProps {
    isOpen: boolean;
    onClick: () => void;
}

export function SidebarToggle({ isOpen, onClick }: SidebarToggleProps) {
    return (
        <Button
            onClick={onClick}
            variant="soft"
            style={{
                backgroundColor: '#3d3d3d',
                color: '#dcddde',
                border: '1px solid #4d4d4d',
                padding: '0.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                width: '40px',
                height: '40px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexShrink: 0
            }}
        >
            <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                }}
            >
                <path
                    d="M6 12L10 8L6 4"
                    stroke="#dcddde"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </Button>
    );
} 