// ORIGINALLY WRITTEN BY David Shlemayev
// Made for GEDS

/* jshint node: true, esversion: 6 */
/* jshint -W083 */

"use strict";

const threepoints = require("./threepoint-ownalgo-implementation");

module.exports = (SPEEDOFSOUND, // m/s
	GROUPING_DISTANCE, // Max. distance in meters between results to be considered a single node. This also gets converted to seconds and becomes max seconds between results
	MINIMUM_DISTANCE, // If two of the three samples in the threepoints algorithm are closer than this value then this threepoints calculation is discarded
	MAX_ERROR_FACTOR, // Threepoints results with error factors higher than this are discarded
	points) => {

	if (points.length < 3) {
		return {
			"error": "Not enough points"
		};
	}

	// Calculate the results of each combination of points
	let results = []; // [a, b, c, pos, time]

	// Calculate how much time it should take to calculate
	let calcTime = 0;
	for (let i = 0; i < points.length - 2; i++) {
		calcTime += 0.5 * (points.length - i - 2) * (points.length - i - 1);
	}

	console.log(`Calculating ${calcTime} units`);

	for (let a = 0; a < points.length - 2; a++) {
		for (let b = a + 1; b < points.length - 1; b++) {
			for (let c = b + 1; c < points.length; c++) {
				let result = threepoints(points[a], points[b], points[c], SPEEDOFSOUND, 150, 40);
				if (result) {
					//let aTime = points[a][2] - timeDistance(points[a], result[0], SPEEDOFSOUND);
					//let bTime = points[b][2] - timeDistance(points[b], result[0], SPEEDOFSOUND);
					//let cTime = points[c][2] - timeDistance(points[c], result[0], SPEEDOFSOUND);
					console.log(result[2]);
					results.push([a, b, c, result[0], /*(aTime + bTime + cTime) / 3*/ result[1]]);
				}
			}
		}
	}

	if (results.length === 0) {
		return {
			"error": "Not enough results"
		};
	}

	// Find similar results and group them into nodes
	let nodes = []; // [pos, time, results, points]

	for (let i = 0; i < results.length; i++) {
		let found = false;
		for (let j = 0; j < nodes.length; j++) {
			if (distance(results[i][3], nodes[j][0]) < GROUPING_DISTANCE && Math.abs(results[i][4] - nodes[j][1]) < GROUPING_DISTANCE / SPEEDOFSOUND) {
				found = true;
				nodes[j][2].push(i);
				let newPos = nodes[j][0];
				newPos[0] = (newPos[0] * (nodes[j][2].length - 1) + results[i][3][0]) / nodes[j][2].length;
				newPos[1] = (newPos[1] * (nodes[j][2].length - 1) + results[i][3][1]) / nodes[j][2].length;
				let newTime = (nodes[j][1] * (nodes[j][2].length - 1) + results[i][4]) / nodes[j][2].length;
				nodes[j][0] = newPos;
				nodes[j][1] = newTime;
			}
		}
		if (!found) {
			nodes.push([results[i][3], results[i][4], [i], []]);
		}
	}


	// Check for each point which node it probably corresponds to
	for (let i = 0; i < points.length; i++) {
		let refs = new Array(nodes.length).fill(0);
		for (let j = 0; j < nodes.length; j++) {
			for (let k = 0; k < nodes[j][2].length; k++) {
				let result = results[nodes[j][2][k]];
				if (result[0] == i || result[1] == i || result[2] == i) {
					refs[j]++;
				}
			}
		}

		let highestRef = 0;
		let highestRefIndex = -1;
		for (let j = 0; j < refs.length; j++) {
			if (refs[j] > highestRef) {
				highestRef = refs[j];
				highestRefIndex = j;
			}
		}

		if (highestRef === 0) { // This point isn't supporting any node
			continue;
		}

		nodes[highestRefIndex][3].push(i);
	}


	// Recalculate each node, based only on the points which correspond to it
	for (let i = 0; i < nodes.length; i++) {
		let results2 = [];
		for (let a = 0; a < nodes[i][3].length - 2; a++) {
			for (let b = a + 1; b < nodes[i][3].length - 1; b++) {
				for (let c = b + 1; c < nodes[i][3].length; c++) {
					let result = threepoints(points[nodes[i][3][a]], points[nodes[i][3][b]], points[nodes[i][3][c]], SPEEDOFSOUND);
					if (result) {
						let aTime = points[nodes[i][3][a]][2] - timeDistance(points[nodes[i][3][a]], result[0], SPEEDOFSOUND);
						let bTime = points[nodes[i][3][b]][2] - timeDistance(points[nodes[i][3][b]], result[0], SPEEDOFSOUND);
						let cTime = points[nodes[i][3][c]][2] - timeDistance(points[nodes[i][3][c]], result[0], SPEEDOFSOUND);
						results2.push([result[0], (aTime + bTime + cTime) / 3, result[2]]);
					}
				}
			}
		}
		if (results2.length === 0) {
			continue;
		}
		let xAvg = 0;
		let yAvg = 0;
		let tAvg = 0;
		let totalWeight = 0;

		results2.forEach((result) => {
			xAvg += result[0][0] * (1 / result[2]);
			yAvg += result[0][1] * (1 / result[2]);
			tAvg += result[1] * (1 / result[2]);
			totalWeight += (1 / result[2]);
		});

		xAvg /= totalWeight * results2.length;
		yAvg /= totalWeight * results2.length;
		tAvg /= totalWeight * results2.length;

		nodes[i][0] = [xAvg, yAvg];
		nodes[i][1] = tAvg;
	}

	// No need to return the threepoint results (node[2])
	nodes = nodes.map((node) => [node[0], node[1], node[3]]).filter((node) => node[2].length !== 0);
	nodes.sort((a, b) => a[2].length - b[2].lengthd);
	return nodes;
};

function timeDistance(a, b, SPEEDOFSOUND) {
	return distance(a, b) / SPEEDOFSOUND;
}

function distance(a, b) {
	return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}