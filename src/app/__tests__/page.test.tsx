import { render, screen, fireEvent } from '@testing-library/react';
import Home from '../page';

describe('Home Page Logic', () => {
    it('renders without crashing', () => {
        render(<Home />);
        expect(screen.getByText(/Documents/i)).toBeInTheDocument();
    });

    it('can open and close the sidebar', () => {
        render(<Home />);
        const toggleButton = screen.getByRole('button');
        // Sidebar is open by default, click to close
        fireEvent.click(toggleButton);
        // Click again to open
        fireEvent.click(toggleButton);
    });

    it('creates a new document and switches to it', () => {
        render(<Home />);
        const newDocButton = screen.getByLabelText(/Create new document/i);
        fireEvent.click(newDocButton);
        expect(screen.getByText(/Untitled Document/i)).toBeInTheDocument();
    });

    it('switches view mode', () => {
        render(<Home />);
        const editButton = screen.getByText(/Edit/i);
        const docButton = screen.getByText(/Document/i);
        fireEvent.click(docButton);
        fireEvent.click(editButton);
    });
}); 