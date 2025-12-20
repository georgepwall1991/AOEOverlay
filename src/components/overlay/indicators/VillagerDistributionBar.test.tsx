import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { VillagerDistributionBar } from './VillagerDistributionBar';

describe('VillagerDistributionBar', () => {
  it('should not render if resources are missing', () => {
    const { container } = render(<VillagerDistributionBar />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render if total is 0', () => {
    const { container } = render(<VillagerDistributionBar resources={{ food: 0, wood: 0, gold: 0, stone: 0 }} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render bars with correct proportions', () => {
    const resources = { food: 10, wood: 10, gold: 0, stone: 0 };
    const { container } = render(<VillagerDistributionBar resources={resources} />);
    
    const bars = container.querySelectorAll('.h-full');
    expect(bars.length).toBe(2);
    
    // Proportions for 10/20 should be 50%
    expect((bars[0] as HTMLElement).style.width).toBe('50%');
    expect((bars[1] as HTMLElement).style.width).toBe('50%');
  });

  it('should render all four resource bars if present', () => {
    const resources = { food: 5, wood: 5, gold: 5, stone: 5 };
    const { container } = render(<VillagerDistributionBar resources={resources} />);
    
    const bars = container.querySelectorAll('.h-full');
    expect(bars.length).toBe(4);
    
    bars.forEach(bar => {
      expect((bar as HTMLElement).style.width).toBe('25%');
    });
  });
});
