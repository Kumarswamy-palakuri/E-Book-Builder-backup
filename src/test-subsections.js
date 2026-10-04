import { DEFAULT_CHAPTERS } from './data/defaultChapters.js';
import { getStoredChapters } from './utils/storage.js';

console.log('=== TEST 1: Default Chapter Subsections ===');
const allEmptySubs = DEFAULT_CHAPTERS.every(c => Array.isArray(c.subsections) && c.subsections.length === 0);
console.log('All 29 default chapters have empty subsections array:', allEmptySubs);
if (!allEmptySubs) {
  throw new Error('All default chapters must have empty subsections array');
}
const ch1 = DEFAULT_CHAPTERS.find(c => c.id === 'ch-1');
console.log('Chapter 1 Name:', ch1.name, '| Subsections count:', ch1.subsections.length);

console.log('\n=== TEST 2: Storage migration check ===');
const chapters = getStoredChapters();
const hasSubs = chapters.every(c => Array.isArray(c.subsections));
console.log('All chapters have subsections array:', hasSubs);
if (!hasSubs) {
  throw new Error('All chapters must have subsections array');
}

console.log('\n=== TEST 3: Dynamic Subsection Creation Simulation ===');
const sampleChapter = { ...ch1, subsections: [...(ch1.subsections || [])] };
const newSub = {
  id: `sub-${Date.now()}`,
  code: `${sampleChapter.order}.${sampleChapter.subsections.length + 1}`,
  name: 'Election & Votes Problems',
  teluguName: 'ఎన్నికలు & ఓట్ల సమస్యలు'
};
sampleChapter.subsections.push(newSub);
console.log('Added new subsection:', newSub.code, newSub.name);
console.log('New subsection count:', sampleChapter.subsections.length);

console.log('\nSUBSECTION VERIFICATION TESTS PASSED SUCCESSFULLY! ✅');
