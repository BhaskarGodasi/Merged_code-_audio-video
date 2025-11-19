const crypto = require('crypto');

const campaignStatusFromDates = (startDate, endDate) => {
	const today = new Date();
	const start = new Date(startDate);
	const end = new Date(endDate);

	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
		return 'draft';
	}

	if (today < start) {
		return 'scheduled';
	}

	if (today > end) {
		return 'completed';
	}

	return 'active';
};

const generatePairingCode = () => crypto.randomBytes(4).toString('hex').toUpperCase();

const toPlain = (record) => (record ? record.get({ plain: true }) : null);

/**
 * Calculate Greatest Common Divisor (GCD) of two numbers using Euclidean algorithm
 */
const gcd = (a, b) => {
	if (b === 0) return a;
	return gcd(b, a % b);
};

/**
 * Calculate GCD of an array of numbers
 */
const gcdArray = (arr) => {
	if (arr.length === 0) return 1;
	if (arr.length === 1) return arr[0];
	
	let result = arr[0];
	for (let i = 1; i < arr.length; i++) {
		result = gcd(result, arr[i]);
	}
	return result;
};

/**
 * Generate ad play order using GCD logic
 * Creates a SINGLE loop sequence that will be repeated throughout the day
 * 
 * @param {Array} jingles - Array of jingle objects with { id, title, spots }
 * @returns {Object} - { playOrder: Array, gcd: Number, adCounts: Object, totalAds: Number }
 * 
 * Example: 
 * Input: [{ id: 1, title: 'Ad1', spots: 40 }, { id: 2, title: 'Ad2', spots: 60 }, { id: 3, title: 'Ad3', spots: 80 }]
 * GCD(40,60,80) = 20, so each ad appears: Ad1:2, Ad2:3, Ad3:4 times in the single loop
 * Output: Single loop with 9 ads total that repeats throughout the day
 */
const generateAdPlayOrder = (jingles) => {
	if (!jingles || jingles.length === 0) {
		return { playOrder: [], gcd: 0, adCounts: {}, totalAds: 0 };
	}

	// Extract spots values
	const spots = jingles.map(j => j.spots || j.percentage || 1);
	
	// Calculate GCD of all spots
	const gcdValue = gcdArray(spots);
	
	// Calculate how many times each ad appears in the SINGLE loop
	const adCounts = {};
	const adsWithCounts = jingles.map((jingle, index) => {
		const count = spots[index] / gcdValue;
		adCounts[jingle.title || jingle.id] = count;
		return {
			...jingle,
			count: count,
			remaining: count
		};
	});
	
	// Total ads in the single loop
	const totalAds = adsWithCounts.reduce((sum, ad) => sum + ad.count, 0);
	
	// Generate play order by interleaving ads to avoid back-to-back same ads
	const playOrder = [];
	let lastAdId = null;
	
	while (playOrder.length < totalAds) {
		// Find the ad with the highest remaining count that's different from last
		let selectedAd = null;
		let maxRemaining = 0;
		
		for (const ad of adsWithCounts) {
			if (ad.remaining > 0 && ad.id !== lastAdId && ad.remaining > maxRemaining) {
				selectedAd = ad;
				maxRemaining = ad.remaining;
			}
		}
		
		// If no different ad available (edge case), take any ad with remaining count
		if (!selectedAd) {
			for (const ad of adsWithCounts) {
				if (ad.remaining > 0) {
					selectedAd = ad;
					break;
				}
			}
		}
		
		if (selectedAd) {
			playOrder.push({
				jingleId: selectedAd.id,
				title: selectedAd.title,
				filename: selectedAd.filename || selectedAd.fileName,
			});
			selectedAd.remaining--;
			lastAdId = selectedAd.id;
		}
	}
	
	return {
		playOrder,
		gcd: gcdValue,
		adCounts,
		totalAds
	};
};

module.exports = {
	campaignStatusFromDates,
	generatePairingCode,
	toPlain,
	gcd,
	gcdArray,
	generateAdPlayOrder,
};
