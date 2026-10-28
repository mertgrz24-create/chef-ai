import React from 'react';
import { it, expect, jest } from '@jest/globals';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
const mockFetch = jest.fn<(...args: unknown[]) => Promise<unknown>>();
jest.mock('@/lib/auth', () => ({ useAuth: () => ({ session: { user: { id: 'fixture-owner' } } }) }));
jest.mock('@/lib/api', () => ({ apiFetch: (...args: unknown[]) => mockFetch(...args), publicFetch: async () => ({ capabilities: { billing: false }, maintenance: false }) }));
jest.mock('@react-native-community/netinfo', () => ({ __esModule: true, default: { addEventListener: () => () => { } } }));
import { ReleaseProvider, useRelease } from '@/lib/release/state';
function Probe() { const { membership } = useRelease(); return <Text>{membership ? String(membership.quotas.recipes.limit - membership.quotas.recipes.used) : 'unknown'}</Text>; }
it('E: real ReleaseProvider reads free server allowances with billing disabled', async () => {
    const quota = { used: 10, limit: 10, resetsAt: '2026-11-01T00:00:00Z' };
    mockFetch.mockResolvedValue({ plan: 'free', status: 'active', expiresAt: null, quotas: { recipes: quota, scans: { ...quota, used: 0 }, plans: { ...quota, used: 0 } } });
    const ui = await render(<ReleaseProvider><Probe /></ReleaseProvider>);
    await waitFor(() => expect(ui.getByText('0')).toBeTruthy());
    expect(mockFetch).toHaveBeenCalledWith('/api/billing/status', {}, expect.anything());
    await ui.unmount();
});
