/* jshint node: true, esversion: 6 */

"use strict";

module.exports = function (boomX, boomY, boomT, sampleCount, diameter, convertToAngles, print) {
	let samples = [];
	for (let i = 0; i < sampleCount; i++) {
		samples.push([(Math.random() - 0.5) * diameter, (Math.random() - 0.5) * diameter]);
	}

	if (print)
		console.log(`Generating MAD data for [${boomX}, ${boomY}] at ${boomT}.`);

	for (let i = 0; i < samples.length; i++) {
		let x = samples[i][0];
		let y = samples[i][1];
		let t = boomT + distance(samples[i][0], samples[i][1], boomX, boomY) / 340.29;
		if (convertToAngles) {
			x = boomX + x / 111111;
			y = boomY + y / (111111 * Math.cos(boomX / 180 * Math.PI));
		}
		samples[i][0] = x;
		samples[i][1] = y;
		samples[i][2] = t;
		if (print) {
			console.log("Microphone at " + x + ", " + y + " heard at " + t);
		}
	}

	return samples;
};

function distance(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}