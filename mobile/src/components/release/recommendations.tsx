import { useRef, useState, type ComponentRef } from 'react';
import { Modal, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Chip, LoadingRows, Notice, RecipeTicket, SectionLabel, ScreenScroll, MotionView, PressableScale } from '@/components/ui';
import { useKitchen } from '@/lib/release/kitchen-data';
import { recommendations, type RecommendationMode } from '@/lib/release/recommendations';
import { macrosSchema } from '@/lib/release/contracts';
import { t, useLocale } from '@/lib/release/locale';
import { useRelease } from '@/lib/release/state';
import { useReducedMotion } from '@/theme/use-reduced-motion';
import { useModalFocus } from '@/theme/use-modal-focus';
import { STAGGER } from '@/theme/motion';
export function Recommendations() {
    useLocale();
    const { offline } = useRelease(), { store, snapshot } = useKitchen();
    const [mode, setMode] = useState<RecommendationMode>('pantry'), [selected, setSelected] = useState<string | null>(null);
    const result = recommendations(snapshot.recipes.data ?? [], snapshot.plan.data, snapshot.pantry.data ?? [], mode, new Date(`${snapshot.day}T12:00:00`));
    const error = snapshot.pantry.error || snapshot.recipes.error || snapshot.plan.error;
    const waiting = [snapshot.pantry, snapshot.recipes, snapshot.plan].some(part => part.loading && !part.loaded && !part.data);
    const reduced = useReducedMotion();
    const trigger = useRef<ComponentRef<typeof View>>(null), cardRefs = useRef(new Map<string, ComponentRef<typeof View>>());
    const {heading: headingRef, onShow: onModalShow, onDismiss: onModalDismiss} = useModalFocus(!!selected, trigger);
    const detail = result.items.find(item => item.key === selected);
    const messages: Record<string, string> = { no_content: 'Create and save your first recipe in Cook to find it here.', unknown_time: 'Time information is unavailable for your existing recipes.', no_quick: 'No existing recipes with verified times are 30 minutes or less.', no_matches: 'No ingredient matches found. Your saved recipes are still available.' };
    return <View className="mt-6">
    <SectionLabel>{t('What can I cook today?')}</SectionLabel>
    <Text className="mb-3 font-sans text-label text-muted">{t('From your latest 20 private recipes and this week’s menu. No new AI generation.')}</Text>
    <View className="mb-4 flex-row flex-wrap gap-2">
      <Chip label={t('Based on my pantry')} active={mode === 'pantry'} onPress={() => setMode('pantry')}/>
      <Chip label={t('30 minutes or less')} active={mode === 'quick'} onPress={() => setMode('quick')}/>
    </View>
    {waiting ? <LoadingRows /> : null}
    {error ? <Notice title={t('Some suggestions could not load')} description={t('Previously loaded content is kept. Retry to refresh it.')} action={offline ? undefined : { label: t('Try again'), onPress: store.refresh }}/> : null}
    {!snapshot.pantry.data?.length && snapshot.pantry.loaded ? <View className="mb-3"><Text className="mb-2 font-sans text-body-sm text-secondary">{t('Add ingredients to compare these recipes with your pantry.')}</Text><Button label={t('Open pantry')} variant="ghost" onPress={() => router.navigate('/pantry')}/></View> : null}
    {!waiting && !error && !result.items.length ? <Notice title={t(messages[result.empty])}/> : null}
    {result.items.map((item, index) => <MotionView key={item.key} transitionKey={mode} delay={index * STAGGER} style={{marginBottom:12}}><PressableScale nativeRef={node=>{ if(node)cardRefs.current.set(item.key,node);else cardRefs.current.delete(item.key); }} accessibilityLabel={`${t('View recipe')}: ${item.recipe.name}`} onPress={()=>{trigger.current=cardRefs.current.get(item.key)??null;setSelected(item.key)}} className="rounded-2xl bg-panel p-4">
      <Text className="font-sans text-label text-muted">{t(item.source === 'saved' ? 'Saved recipe' : 'This week’s menu')}{item.minutes === null ? '' : ` · ${item.minutes} ${t('min')}`}</Text>
      <Text className="my-2 font-display text-display-sm text-pantry">{item.recipe.name}</Text>
      {item.matches > 0 ? <Text className="mb-3 font-sans text-body-sm text-secondary">{t('%{count} ingredients appear in your pantry. Quantities are not compared.', { count: item.matches })}</Text> : <Text className="mb-3 font-sans text-body-sm text-muted">{t('No pantry match is claimed for this recipe.')}</Text>}
      <Text className="font-sans-bold text-label text-pantry">{t('View recipe')} →</Text>
    </PressableScale></MotionView>)}
    <Button label={t('Saved recipes')} variant="ghost" onPress={() => router.navigate('/saved-recipes')}/>
    <View className="mt-2"><Button label={t('Create a new recipe with AI')} onPress={() => router.navigate('/cook')}/></View>
    <Modal visible={!!detail} animationType={reduced ? 'none' : 'slide'} presentationStyle="pageSheet" onShow={onModalShow} onDismiss={onModalDismiss} onRequestClose={() => setSelected(null)}>
      <View style={{flex:1}} accessibilityViewIsModal><ScreenScroll><View ref={headingRef} accessible accessibilityRole="header" accessibilityLabel={detail?.recipe.name}><Text className="mb-3 font-sans-bold text-body text-pantry">{detail?.recipe.name}</Text></View><Button label={t('Close recipe details')} variant="ghost" onPress={() => setSelected(null)}/>{detail && snapshot.pantry.loaded && !snapshot.pantry.error && snapshot.pantry.data ? <View className="my-4 rounded-2xl bg-panel p-4">
        <Text className="mb-2 font-sans text-label text-muted">{t('Pantry names are compared; quantities are not. Check your supplies before cooking.')}</Text>
        {detail.matchedIngredients.length ? <><Text accessibilityRole="header" className="mt-2 font-sans-bold text-body text-pantry">{t('Found in your pantry')}</Text>{detail.matchedIngredients.map((line, index) => <Text key={`matched-${index}`} className="mt-1 font-sans text-body-sm text-secondary">{line}</Text>)}</> : null}
        {detail.reviewIngredients.length ? <><Text accessibilityRole="header" className="mt-3 font-sans-bold text-body text-pantry">{t('Check these ingredients')}</Text>{detail.reviewIngredients.map((line, index) => <Text key={`review-${index}`} className="mt-1 font-sans text-body-sm text-secondary">{line}</Text>)}</> : null}
      </View> : null}{detail ? <RecipeTicket recipe={detail.recipe} macros={macrosSchema.safeParse(detail.macros).success ? macrosSchema.parse(detail.macros) : null}/> : null}</ScreenScroll></View>
    </Modal>
  </View>;
}
