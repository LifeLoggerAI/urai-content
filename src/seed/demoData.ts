export const demoSeed = {
  narratorPrompts: [
    { id: 'np-quiet-01', tone: 'calm', prompt: 'In the late-blue quiet, notice one true thing that stayed with you today.', quietHoursSafe: true, reflectionScript: 'What softened when you slowed down?', accessibilityCaption: 'Gentle narrator reflection prompt for quiet hours.' }
  ],
  ritualTemplates: [
    { id: 'ritual-dawn-breath', name: 'Dawn Breath Compass', instructions: ['Name today\'s intention', 'Take four long breaths', 'Mark one star on your map'], safetyClass: 'gentle', eligibilitySignals: ['user-consent-passive-capture-enabled'], reducedMotionAlternative: 'Static compass card with step-by-step text only.' }
  ],
  storyTemplates: [
    { id: 'story-seasonal-arc', era: 'seasonal-arc', beats: [{ title: 'Opening Sky', ttsText: 'You began this week with a clear horizon.', caption: 'Opening sky moment', startMs: 0, endMs: 3000 }], capcutMarkers: [{ label: 'opening', timestampMs: 0 }] }
  ],
  marketplaceItems: [
    { id: 'mkt-ritual-pack-01', title: 'Ritual Pack: Evening Reset', creatorId: 'creator-1', moderationStatus: 'approved', tier: 'paid', priceUsd: 7, entitlementKey: 'mkt-ritual-pack-01' }
  ],
  exportTemplates: [
    { id: 'export-weekly-recap', type: 'weekly-recap', title: 'Weekly Recap Card', sections: ['Sky', 'Map', 'Star', 'Insight', 'Share'], failureRetryCopy: 'Export paused. Your data is safe. Retry when connected.' }
  ]
};
