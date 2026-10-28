import { randomUUID } from 'node:crypto'
import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { beforeEach, expect, it, jest } from '@jest/globals';
import { AiRecoveryProvider, useRecoveredAi } from '@/components/release/ai-recovery';
import { clearPendingAi, startPendingAi } from '@/lib/release/ai-recovery';
const pointerKey=randomUUID()
const mockApi = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockNavigate = jest.fn(), mockInvalidate = jest.fn(), mockRefresh = jest.fn();
jest.mock('@/lib/api', () => ({ apiFetch: (...args: unknown[]) => mockApi(...args), ApiError: class extends Error {
    } }));
jest.mock('expo-router', () => ({ router: { navigate: (...args: unknown[]) => mockNavigate(...args) } }));
jest.mock('@/lib/release/state', () => ({ useRelease: () => ({ refreshMembership: mockRefresh }) }));
jest.mock('@/lib/release/kitchen-data', () => ({ useKitchenInvalidation: () => mockInvalidate }));
jest.mock('@/components/ui', () => {
    const { View, Text, Pressable } = jest.requireActual<typeof import('react-native')>('react-native');
    return { Notice: ({ title, description }: {
            title: string;
            description?: string;
        }) => <View><Text>{title}</Text><Text>{description}</Text></View>, Button: ({ label, onPress, disabled }: {
            label: string;
            onPress: () => void;
            disabled?: boolean;
        }) => <Pressable accessibilityRole="button" disabled={disabled} onPress={() => { onPress(); }}><Text>{label}</Text></Pressable> };
});
function Consumer() {
    const recovered = useRecoveredAi('recipes'), [name, setName] = useState('');
    useEffect(() => { if (recovered?.result) {
        queueMicrotask(() => { setName(String((recovered.result?.response as {
            recipe: string;
        }).recipe)); recovered.consume(); });
    } }, [recovered]);
    return <Text>{name}</Text>;
}
beforeEach(async () => {
    await clearPendingAi('fixture-owner');
    mockApi.mockReset();
    mockNavigate.mockClear();
    mockInvalidate.mockClear();
    mockRefresh.mockClear();
    await startPendingAi('fixture-owner', { operation: 'recipes', key: pointerKey, startedAt: Date.now() });
});
it('opens a recovered recipe through the existing Cook route with only a status read', async () => {
    mockApi.mockResolvedValue({ state: 'completed', status: 200, response: { recipe: 'Existing soup', structured: null, macros: null } });
    const screen = await render(<AiRecoveryProvider owner="fixture-owner"><Consumer /></AiRecoveryProvider>);
    await act(async () => { fireEvent.press(screen.getByText('Check existing result')); });
    await waitFor(() => expect(screen.getByText('Existing soup')).toBeTruthy());
    expect(mockNavigate).toHaveBeenCalledWith('/cook');
    expect(mockApi).toHaveBeenCalledTimes(1);
    expect(mockApi).toHaveBeenCalledWith('/api/mobile/ai-status?operation=recipes', expect.anything(), expect.anything());
});
it('shows a refund only when confirmed by the server, not for a missing result', async () => {
    await clearPendingAi('fixture-owner');
    await startPendingAi('fixture-owner', { operation: 'recipes', key: pointerKey, startedAt: Date.now() - 301000 });
    mockApi.mockResolvedValue({ state: 'not_found' });
    const screen = await render(<AiRecoveryProvider owner="fixture-owner"><Text>App</Text></AiRecoveryProvider>);
    await act(async () => { fireEvent.press(screen.getByText('Check existing result')); });
    await waitFor(() => expect(screen.getByText('No operation was found. A usage credit refund has not been confirmed.')).toBeTruthy());
    expect(mockNavigate).not.toHaveBeenCalled();
});
it('a verified failed operation reports the refund and refreshes usage', async () => {
    mockApi.mockResolvedValue({ state: 'completed', status: 504, response: { code: 'ai_result_unavailable', creditReturned: true } });
    const screen = await render(<AiRecoveryProvider owner="fixture-owner"><Text>App</Text></AiRecoveryProvider>);
    await act(async () => { fireEvent.press(screen.getByText('Check existing result')); });
    await waitFor(() => expect(screen.getByText('The AI operation did not complete. Your usage credit was returned.')).toBeTruthy());
    expect(mockRefresh).toHaveBeenCalledTimes(1);
});
it('cannot display another account’s pending operation', async () => {
    const screen = await render(<AiRecoveryProvider owner="different-owner"><Text>App</Text></AiRecoveryProvider>);
    expect(screen.queryByText('Check existing result')).toBeNull();
    expect(mockApi).not.toHaveBeenCalled();
});
