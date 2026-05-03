import { exportTemplateSchema, marketplaceItemSchema, narratorPromptSchema, ritualTemplateSchema, storyTemplateSchema } from '../schemas/content.js';
import { demoSeed } from './demoData.js';

demoSeed.narratorPrompts.forEach((item) => narratorPromptSchema.parse(item));
demoSeed.ritualTemplates.forEach((item) => ritualTemplateSchema.parse(item));
demoSeed.storyTemplates.forEach((item) => storyTemplateSchema.parse(item));
demoSeed.marketplaceItems.forEach((item) => marketplaceItemSchema.parse(item));
demoSeed.exportTemplates.forEach((item) => exportTemplateSchema.parse(item));

console.log('Seed data validated.');
