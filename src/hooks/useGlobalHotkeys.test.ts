import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useGlobalHotkeys } from './useGlobalHotkeys';
import { useBuildOrderStore } from '@/stores/buildOrderStore';

const { mockListen } = vi.hoisted(() => ({
  mockListen: vi.fn(() => Promise.resolve(() => { })),
}));

vi.mock('@/lib/tauri', async () => {
  const actual = await vi.importActual('@/lib/tauri');
  return {
    ...actual,
    listen: mockListen,
  };
});

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('useGlobalHotkeys', () => {
  beforeEach(() => {
    mockListen.mockClear();
    useBuildOrderStore.setState({
      buildOrders: [
        {
          id: 'test-order',
          name: 'Test Order',
          civilization: 'English',
          description: 'Desc',
          difficulty: 'Beginner',
          enabled: true,
          steps: [{ id: 's1', description: 'Step 1' }],
          branches: [
            { id: 'b1', name: 'Branch 1', trigger: 'T1', startStepIndex: 0, steps: [] },
          ]
        }
      ],
      currentOrderIndex: 0,
      activeBranchId: null,
    });
  });

  it('should register branch hotkeys', async () => {
    renderHook(() => useGlobalHotkeys());

    await waitFor(() => {
      const eventNames = (mockListen.mock.calls as any[]).map(call => call[0]);
      expect(eventNames).toContain('hotkey-activate-branch-main');
      expect(eventNames).toContain('hotkey-activate-branch-1');
    });
  });

  it('should switch to main branch on hotkey', async () => {
    useBuildOrderStore.setState({ activeBranchId: 'b1' });
    renderHook(() => useGlobalHotkeys());

    await waitFor(() => {
      expect((mockListen.mock.calls as any[]).some(call => call[0] === 'hotkey-activate-branch-main')).toBe(true);
    });

    const mainListener = (mockListen.mock.calls as any[]).find(call => call[0] === 'hotkey-activate-branch-main')?.[1];
    act(() => {
      mainListener({ payload: {} });
    });

    expect(useBuildOrderStore.getState().activeBranchId).toBe(null);
  });

  it('should switch to branch 1 on hotkey', async () => {
    renderHook(() => useGlobalHotkeys());

    await waitFor(() => {
      expect((mockListen.mock.calls as any[]).some(call => call[0] === 'hotkey-activate-branch-1')).toBe(true);
    });

    const branch1Listener = (mockListen.mock.calls as any[]).find(call => call[0] === 'hotkey-activate-branch-1')?.[1];
    act(() => {
      branch1Listener({ payload: {} });
    });

    expect(useBuildOrderStore.getState().activeBranchId).toBe('b1');
  });
});
