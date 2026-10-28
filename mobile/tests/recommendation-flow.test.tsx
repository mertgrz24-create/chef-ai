import React from 'react';
import { beforeEach, describe, it, expect, jest } from '@jest/globals';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
const mockApi = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockState = { offline: false, aiAllowed: true, config: { capabilities: { ai: true, billing: false, privateRecipes: true, idempotency: true } }, membership: null as import('@/lib/release/contracts').Membership | null, track: jest.fn<() => Promise<void>>().mockResolvedValue(), refreshMembership: jest.fn<() => Promise<null>>().mockResolvedValue(null) };
jest.mock('@/lib/api', () => ({ ...jest.requireActual<typeof import('@/lib/release/request')>('@/lib/release/request'), apiFetch: (...args: unknown[]) => mockApi(...args) }));
jest.mock('@/lib/release/state', () => ({ useRelease: () => mockState }));
jest.mock('@/lib/auth', () => ({ useAuth: () => ({ session: { user: { id: 'a', email: 'fixture@example.test' } } }) }));
jest.mock('expo-router', () => ({ router: { navigate: jest.fn() }, useFocusEffect: (callback: () => void) => require('react').useEffect(callback, [callback]) }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@/components/ui', () => {
    const { View, Text, Pressable, TextInput } = require('react-native');
    const Container = ({ children }: {
        children: React.ReactNode;
    }) => <View>{children}</View>;
    const Button = ({ label, onPress, disabled, loading }: {
        label: string;
        onPress: () => void;
        disabled?: boolean;
        loading?: boolean;
    }) => <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled || loading} onPress={() => { onPress(); }}><Text>{label}</Text></Pressable>;
    return { Screen: Container, Ticket: Container, BusyState: ({label}:{label:string})=><Text>{label}</Text>, EmptyState: Container, ScreenScroll: Container, MotionView: jest.requireActual<typeof import('@/components/ui/motion-view')>('@/components/ui/motion-view').MotionView, SectionLabel: ({ children }: {
            children: React.ReactNode;
        }) => <Text>{children}</Text>, Card: Container, Button, Chip: Button, PressableScale: ({onPress, nativeRef, ...props}: {onPress?:()=>void; nativeRef?:unknown; children?:React.ReactNode}) => { void nativeRef; return <Pressable {...props} onPress={()=>{onPress?.()}}/> },
        Row: ({ title }: {
            title: string;
        }) => <Text>{title}</Text>, Skeleton: () => null, LoadingRows: () => null,
        Notice: ({ title, description }: {
            title: string;
            description?: string;
        }) => <View><Text>{title}</Text><Text>{description ?? ''}</Text></View>,
        ScreenHeader: ({ title, action }: {
            title: string; action?: React.ReactNode;
        }) => <View><Text>{title}</Text>{action}</View>, Field: ({ label, ...props }: {
            label: string;
        }) => <TextInput accessibilityLabel={label} {...props}/>,
        RecipeTicket: ({ recipe }: {
            recipe: {
                name: string;
            };
        }) => <Text>{'Detail: ' + recipe.name}</Text> };
});
import Today from '@/app/(app)/index';
import PantryScreen from '@/app/(app)/pantry';
import Cook from '@/app/(app)/cook';
import { RecipeActions } from '@/components/release/recipe-actions';
import { KitchenDataProvider, useKitchen } from '@/lib/release/kitchen-data';
import { PantryEditor } from '@/components/release/pantry-editor';
import { QuotaStatus } from '@/components/release/quota-status';
import type { PantryItem } from '@/lib/types';
import { ApiError } from '@/lib/api';
const pantry: PantryItem = { id: '00000000-0000-4000-8000-000000000001', name: 'tomato', quantity: '2', expiry_date: '2099-01-01', created_at: '', revision: 0 };
const saved = { id: '00000000-0000-4000-8000-000000000002', name: 'Fixture soup', ingredients: ['tomato'], instructions: 'Simmer.', macros: null, is_public: false, created_at: '' };
beforeEach(() => { mockApi.mockReset(); mockState.aiAllowed = true; mockState.offline = false; mockState.membership = null; mockState.refreshMembership.mockClear(); });
describe('C — Today with AI enabled', () => {
    it('opens, filters, opens a detail and returns with zero AI calls or extra downloads', async () => {
        mockApi.mockImplementation(async (path, options) => {
            if (options && (options as {
                method?: string;
            }).method && (options as {
                method: string;
            }).method !== 'GET')
                throw Error('AI/write forbidden');
            if (path === '/api/pantry')
                return { items: [pantry] };
            if (path === '/api/recipes/history')
                return { recipes: [saved] };
            if (path === '/api/meal-plan')
                throw new ApiError('absent', 404);
            throw Error('Unexpected endpoint ' + path);
        });
        const ui = await render(<KitchenDataProvider><Today /></KitchenDataProvider>);
        await waitFor(() => expect(ui.getByText('Fixture soup')).toBeTruthy());
        expect(mockApi).toHaveBeenCalledTimes(3);
        await fireEvent.press(ui.getByLabelText('30 minutes or less'));
        expect(ui.getByText('Time information is unavailable for your existing recipes.')).toBeTruthy();
        await fireEvent.press(ui.getByLabelText('Based on my pantry'));
        await fireEvent.press(ui.getByLabelText('View recipe: Fixture soup'));
        expect(ui.getByText('Detail: Fixture soup')).toBeTruthy();
        await fireEvent.press(ui.getByLabelText('Close recipe details'));
        expect(mockApi).toHaveBeenCalledTimes(3);
        expect(mockApi.mock.calls.every(([p]) => ['/api/pantry', '/api/recipes/history', '/api/meal-plan'].includes(String(p)))).toBe(true);
        await ui.unmount();
    });
    it.each([true, false])('works with zero rights and AI permission %s', async (enabled) => {
        mockState.aiAllowed = enabled;
        const quota = { used: 10, limit: 10, resetsAt: '2026-11-01T00:00:00Z' };
        mockState.membership = { plan: 'free', status: 'active', expiresAt: null, quotas: { recipes: quota, scans: quota, plans: quota } };
        mockApi.mockImplementation(async (path) => path === '/api/pantry' ? { items: [pantry] } : path === '/api/recipes/history' ? { recipes: [saved] } : { plan: null });
        const ui = await render(<KitchenDataProvider><Today /></KitchenDataProvider>);
        await waitFor(() => expect(ui.getByText('Fixture soup')).toBeTruthy());
        expect(mockApi).toHaveBeenCalledTimes(3);
        await fireEvent.press(ui.getByLabelText('View recipe: Fixture soup'));
        expect(ui.getByText('Detail: Fixture soup')).toBeTruthy();
        await fireEvent.press(ui.getByLabelText('Close recipe details'));
        expect(mockApi).toHaveBeenCalledTimes(3);
        expect(mockState.membership.quotas.recipes.used).toBe(10);
        await ui.unmount();
    });
});
describe('D — pantry editing', () => {
    it('waits for the server and sends the original revision', async () => {
        let finish!: (v: unknown) => void;
        mockApi.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
        const onSaved = jest.fn(), ui = await render(<PantryEditor item={pantry} offline={false} onSaved={onSaved} onCancel={() => { }}/>);
        await fireEvent.changeText(ui.getByLabelText('Ingredient'), 'tomatoes');
        await fireEvent.press(ui.getByLabelText('Save changes'));
        expect(onSaved).not.toHaveBeenCalled();
        expect(JSON.parse((mockApi.mock.calls[0][1] as {
            body: string;
        }).body)).toMatchObject({ name: 'tomatoes', expectedRevision: 0 });
        await act(async () => { finish({ item: { ...pantry, name: 'tomatoes', revision: 1 } }); });
        expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ revision: 1 }));
        await ui.unmount();
    });
    it('keeps edits after a conflict and does not claim successful saving', async () => {
        mockApi.mockRejectedValue(new ApiError('changed', 409, 'revision_conflict'));
        const onSaved = jest.fn(), ui = await render(<PantryEditor item={pantry} offline={false} onSaved={onSaved} onCancel={() => { }}/>);
        await fireEvent.changeText(ui.getByLabelText('Quantity'), '3');
        await fireEvent.press(ui.getByLabelText('Save changes'));
        await waitFor(() => expect(ui.getByText('This ingredient changed elsewhere. Reload its revision and review your entries.')).toBeTruthy());
        expect(ui.getByLabelText('Quantity').props.value).toBe('3');
        expect(onSaved).not.toHaveBeenCalled();
        await ui.unmount();
    });
});
it('E visibility refreshes server quotas even when billing is disabled', async () => {
    const ui = await render(<QuotaStatus kind="recipes"/>);
    await waitFor(() => expect(mockState.refreshMembership).toHaveBeenCalledTimes(1));
    expect(ui.getByText('Usage could not be verified. No allowance is assumed.')).toBeTruthy();
    await ui.unmount();
});
it('C recipe saving invalidates existing suggestions only after confirmed save', async () => {
    let current!: ReturnType<typeof useKitchen>['store'];
    function Probe() { current = useKitchen().store; return null; }
    mockApi.mockResolvedValue({ recipe: saved });
    const ui = await render(<KitchenDataProvider><Probe /><RecipeActions result={{ recipe: 'fixture', structured: saved, macros: null }}/></KitchenDataProvider>);
    await act(async () => { mockApi.mockResolvedValueOnce({ recipes: [saved] }); await current.load('recipes'); });
    expect(current.snapshot().recipes.loaded).toBe(true);
    await fireEvent.press(ui.getByLabelText('Save recipe'));
    await waitFor(() => expect(current.snapshot().recipes.loaded).toBe(false));
    expect(mockApi.mock.calls.some(([path]) => path === '/api/recipes/save')).toBe(true);
    await ui.unmount();
});

it('C polish keeps a deleting ingredient until server confirmation and rejects rapid duplicate deletion', async () => {
    let finish!: (value: unknown) => void;
    mockApi.mockResolvedValueOnce({ items: [pantry] }).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const ui = await render(<PantryScreen />);
    await waitFor(() => expect(ui.getByLabelText('Remove tomato')).toBeTruthy());
    await fireEvent.press(ui.getByLabelText('Remove tomato'));
    await fireEvent.press(ui.getByLabelText('Removing tomato'));
    expect(mockApi).toHaveBeenCalledTimes(2);
    expect(ui.getByText('tomato')).toBeTruthy();
    expect(ui.queryByText('tomato removed.')).toBeNull();
    await act(async () => finish(null));
    await waitFor(() => expect(ui.queryByText('tomato')).toBeNull());
    expect(ui.getByText('tomato removed.')).toBeTruthy();
    await ui.unmount();
});
it('C polish preserves an ingredient after failed deletion and emits no success', async () => {
    mockApi.mockResolvedValueOnce({ items: [pantry] }).mockRejectedValueOnce(new ApiError('offline', 0));
    const ui = await render(<PantryScreen />);
    await waitFor(() => expect(ui.getByLabelText('Remove tomato')).toBeTruthy());
    await fireEvent.press(ui.getByLabelText('Remove tomato'));
    await waitFor(() => expect(ui.getByText('Couldn’t remove tomato. Please try again.')).toBeTruthy());
    expect(ui.getByText('tomato')).toBeTruthy();
    expect(ui.queryByText('tomato removed.')).toBeNull();
    await ui.unmount();
});

it('D Cook result and saved feedback do not wait for motion or duplicate generation/save writes', async () => {
    let recipeDone!: (value: unknown) => void, saveDone!: (value: unknown) => void;
    mockApi.mockImplementation(async (path, options) => {
        if (path === '/api/pantry') return {items:[pantry]};
        if (path === '/api/recipes') return new Promise(resolve=>{recipeDone=resolve});
        if (path === '/api/recipes/save') return new Promise(resolve=>{saveDone=resolve});
        throw Error('Unexpected endpoint '+path+' '+String(options));
    });
    const ui = await render(<Cook />);
    await waitFor(()=>expect(ui.getByLabelText('tomato')).toBeTruthy());
    await fireEvent.press(ui.getByLabelText('tomato'));
    await fireEvent.press(ui.getByLabelText('Generate recipe'));
    await fireEvent.press(ui.getByLabelText('Generate recipe'));
    expect(mockApi.mock.calls.filter(([p])=>p==='/api/recipes')).toHaveLength(1);
    await act(async()=>recipeDone({recipe:'Fixture',structured:saved,macros:null,resultId:'fixture-result'}));
    await waitFor(()=>expect(ui.getByText('Detail: Fixture soup')).toBeTruthy());
    await fireEvent.press(ui.getByLabelText('Save recipe'));
    await fireEvent.press(ui.getByLabelText('Save recipe'));
    expect(mockApi.mock.calls.filter(([p])=>p==='/api/recipes/save')).toHaveLength(1);
    expect(ui.getByText('Not saved yet')).toBeTruthy();
    await act(async()=>saveDone({recipe:saved}));
    await waitFor(()=>expect(ui.getByText('✓ Saved')).toBeTruthy());
    expect(mockApi.mock.calls.filter(([p])=>p==='/api/recipes')).toHaveLength(1);
    await ui.unmount();
});

it('B empty recommendations offer Cook navigation without automatically generating or downloading again', async () => {
    const {router}=jest.requireMock<typeof import('expo-router')>('expo-router');
    mockApi.mockImplementation(async path=>path==='/api/pantry'?{items:[]}:path==='/api/recipes/history'?{recipes:[]}:{plan:null});
    const ui=await render(<KitchenDataProvider><Today /></KitchenDataProvider>);
    await waitFor(()=>expect(ui.getByText('Create and save your first recipe in Cook to find it here.')).toBeTruthy());
    await fireEvent.press(ui.getByLabelText('Create a new recipe with AI'));
    expect(router.navigate).toHaveBeenCalledWith('/cook');
    expect(mockApi).toHaveBeenCalledTimes(3);
    expect(mockApi.mock.calls.every(([,options])=>!options||(options as {method?:string}).method===undefined)).toBe(true);
    await ui.unmount();
});
