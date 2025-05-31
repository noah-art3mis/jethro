import { render, screen, fireEvent } from '@testing-library/react';
import { SidebarToggle } from '../SidebarToggle';

describe('SidebarToggle', () => {
    it('renders correctly', () => {
        render(<SidebarToggle isOpen={true} onClick={() => { }} />);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
        const handleClick = jest.fn();
        render(<SidebarToggle isOpen={true} onClick={handleClick} />);
        const button = screen.getByRole('button');
        fireEvent.click(button);
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('rotates arrow based on isOpen prop', () => {
        const { rerender } = render(<SidebarToggle isOpen={true} onClick={() => { }} />);
        const svg = screen.getByRole('button').querySelector('svg');
        expect(svg).toHaveStyle({ transform: 'rotate(180deg)' });

        rerender(<SidebarToggle isOpen={false} onClick={() => { }} />);
        expect(svg).toHaveStyle({ transform: 'rotate(0deg)' });
    });
}); 