// Test the GCD algorithm implementation
const { gcd, gcdArray, generateAdPlayOrder } = require('./utils/helpers');

console.log('=== Testing GCD Algorithm (Single Loop) ===\n');

// Test 1: Basic GCD
console.log('Test 1: Basic GCD');
console.log('gcd(40, 60) =', gcd(40, 60)); // Expected: 20
console.log('gcd(60, 80) =', gcd(60, 80)); // Expected: 20
console.log('gcd(40, 80) =', gcd(40, 80)); // Expected: 40
console.log();

// Test 2: GCD Array
console.log('Test 2: GCD Array');
console.log('gcdArray([40, 60, 80]) =', gcdArray([40, 60, 80])); // Expected: 20
console.log('gcdArray([10, 20, 30]) =', gcdArray([10, 20, 30])); // Expected: 10
console.log('gcdArray([12, 18, 24]) =', gcdArray([12, 18, 24])); // Expected: 6
console.log();

// Test 3: Generate Ad Play Order (Example from voice.xml)
console.log('Test 3: Generate Ad Play Order - SINGLE LOOP');
const jingles = [
	{ id: 1, title: 'Ad1', filename: 'ad1.wav', spots: 40 },
	{ id: 2, title: 'Ad2', filename: 'ad2.wav', spots: 60 },
	{ id: 3, title: 'Ad3', filename: 'ad3.wav', spots: 80 },
];

const result = generateAdPlayOrder(jingles);
console.log('Input:', jingles.map(j => `${j.title}:${j.spots}`).join(', '));
console.log('GCD:', result.gcd);
console.log('Total Ads in Single Loop:', result.totalAds);
console.log('Ad Counts in Loop:', result.adCounts);
console.log();

// Display the single loop sequence
console.log('Single Loop Sequence (repeats throughout the day):');
console.log(result.playOrder.map(ad => ad.title).join(' → '));
console.log();

// Display full sequence with position numbers
console.log('Full Play Order:');
result.playOrder.forEach((ad, index) => {
	console.log(`${index + 1}. ${ad.title}`);
});
console.log();

// Verify counts match expected
const actualCounts = {};
result.playOrder.forEach(ad => {
	actualCounts[ad.title] = (actualCounts[ad.title] || 0) + 1;
});
console.log('Verification - Occurrences in single loop:');
console.log('Ad1:', actualCounts.Ad1, '(expected: 40/20 = 2)');
console.log('Ad2:', actualCounts.Ad2, '(expected: 60/20 = 3)');
console.log('Ad3:', actualCounts.Ad3, '(expected: 80/20 = 4)');
console.log();

// Check for back-to-back same ads
console.log('Checking for back-to-back same ads...');
let hasBackToBack = false;
for (let i = 1; i < result.playOrder.length; i++) {
	if (result.playOrder[i].title === result.playOrder[i - 1].title) {
		console.log(`⚠️  Found back-to-back: Position ${i} and ${i + 1} both have ${result.playOrder[i].title}`);
		hasBackToBack = true;
	}
}
if (!hasBackToBack) {
	console.log('✓ No back-to-back same ads found!');
}
console.log();

// Test 4: Different scenario
console.log('Test 4: Different Scenario');
const jingles2 = [
	{ id: 1, title: 'Commercial1', filename: 'c1.wav', spots: 30 },
	{ id: 2, title: 'Commercial2', filename: 'c2.wav', spots: 45 },
];

const result2 = generateAdPlayOrder(jingles2);
console.log('Input:', jingles2.map(j => `${j.title}:${j.spots}`).join(', '));
console.log('GCD:', result2.gcd);
console.log('Total Ads in Single Loop:', result2.totalAds);
console.log('Ad Counts in Loop:', result2.adCounts);
console.log('Single Loop Sequence:', result2.playOrder.map(ad => ad.title).join(' → '));
console.log();

console.log('=== Explanation ===');
console.log('The single loop sequence will REPEAT throughout the playback window.');
console.log('Daily minimum plays: Each ad will play at least its spot count.');
console.log('Example: If the loop plays 10 times in a day:');
console.log('  - Ad1 (2x per loop): 2 × 10 = 20 plays (meets 40 spot minimum? No, needs 2 full cycles)');
console.log('  - Ad2 (3x per loop): 3 × 10 = 30 plays');
console.log('  - Ad3 (4x per loop): 4 × 10 = 40 plays');
console.log('The system will repeat the loop until ALL ads meet their minimum spot count.');
