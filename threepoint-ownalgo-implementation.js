// DAVID SHLEMAYEV
// secondlifedvi@gmail.com
// (C) 2016

// TODO:
// - Add early exit if error factor low enough

"use strict";
function analyzer(A, B, C, SPEED_OF_SOUND, MINIMUM_DISTANCE, MAX_ERROR_FACTOR) {
	// Check that the noise suseptability is low, by not accepting close points and points that almost form a line
	let distanceAB = distance(A, B);
	let distanceAC = distance(A, C);
	let distanceBC = distance(B, C);

	// Check if too close
	if (distanceAB < MINIMUM_DISTANCE ||
		distanceAC < MINIMUM_DISTANCE ||
		distanceBC < MINIMUM_DISTANCE) {
		return false;
	}

	// Check for lines
	if (distanceAB > distanceAC && distanceAB > distanceBC /*AB longest*/ && distanceAB * 0.95 > distanceAC + distanceBC) {
		return false;
	}
	if (distanceAC > distanceAB && distanceAC > distanceBC /*AC longest*/ && distanceAC * 0.95 > distanceAB + distanceBC) {
		return false;
	}
	if (distanceBC > distanceAB && distanceBC > distanceAC /*BC longest*/ && distanceBC * 0.95 > distanceAB + distanceAC) {
		return false;
	}

	// Map it so 'a' is the earliest point 
	let a;
	let b;
	let c;
	if (A[2] < B[2] && A[2] < C[2]) {
		// A is earliest
		a = [A[0], A[1], A[2]];
		b = [B[0], B[1], B[2]];
		c = [C[0], C[1], C[2]];
	} else if (B[2] < A[2] && B[2] < C[2]) {
		// B is earliest
		a = [B[0], B[1], B[2]];
		b = [A[0], A[1], A[2]];
		c = [C[0], C[1], C[2]];
	} else if (C[2] < A[2] && C[2] < B[2]) {
		// C is earliest
		a = [C[0], C[1], C[2]];
		b = [A[0], A[1], A[2]];
		c = [B[0], B[1], B[2]];
	}

	// Move all points so 'a' is [0, 0, 0]
	var xOffset = a[0];
	var yOffset = a[1];
	var tOffset = a[2];

	a = [0, 0, 0];

	b[0] -= xOffset;
	b[1] -= yOffset;

	c[0] -= xOffset;
	c[1] -= yOffset;

	// Rotate points so B is along the X axis using rotation matrix
	var rotateAngleB;
	var rotateAngleC;
	if ((Math.abs(b[1] - a[1])) < (Math.abs(b[0] - a[0]))) {
		rotateAngleB = -Math.atan(((b[1] - a[1])) / ((b[0] - a[0])));
	} else {
		rotateAngleB = Math.atan(((b[1] - a[1])) / ((b[0] - a[0])));
		rotateAngleB = (Math.PI / 2 + rotateAngleB);
	}

	if ((Math.abs(c[1] - a[1])) < (Math.abs(c[0] - a[0]))) {
		rotateAngleC = -Math.atan(((c[1] - a[1])) / ((c[0] - a[0])));
	} else {
		rotateAngleC = Math.atan(((c[1] - a[1])) / ((c[0] - a[0])));
		rotateAngleC = (Math.PI / 2 + rotateAngleC);
	}

	b[0] = b[0] * Math.cos(rotateAngleB) - b[1] * Math.sin(rotateAngleB);
	c[0] = c[0] * Math.cos(rotateAngleC) - c[1] * Math.sin(rotateAngleC);

	// Make the A point occur on time 0, and subtract from the other points too
	b[2] -= tOffset;
	c[2] -= tOffset;

	// Binary search the point with the least error factor
	let lo = 0;
	let hi = 20;
	let iterations = 10000;
	let lowestEF = 99999999;
	let lowestEFTime = 0;
	let lowestEFPoint = [0, 0];
	let lowestEFSide = false; // false = torwards lower, true = torwards higher

	for (let i = 0; i < iterations; i++) {
		let points1 = getPoints(a, b, c, (lo + hi * 3) / 4, SPEED_OF_SOUND);
		let points2 = getPoints(a, b, c, (lo * 3 + hi) / 4, SPEED_OF_SOUND);
		let EF1 = points1 && points1.map((pt) => {
			return getEF(pt, c, (lo + hi * 3) / 4)
		});
		1
		let EF2 = points2 && points2.map((pt) => {
			return getEF(pt, c, (lo * 3 + hi) / 4)
		});

		if (EF1 && EF1[0] < lowestEF) {
			lowestEF = EF1[0];
			lowestEFTime = (lo + hi * 3) / 4;
			lowestEFPoint = points1[0];
			lowestEFSide = true;
		}
		if (EF1 && EF1[1] < lowestEF) {
			lowestEF = EF1[1];
			lowestEFTime = (lo + hi * 3) / 4;
			lowestEFPoint = points1[1];
			lowestEFSide = true;
		}
		if (EF2 && EF2[0] < lowestEF) {
			lowestEF = EF2[0];
			lowestEFTime = (lo * 3 + hi) / 4;
			lowestEFPoint = points2[0];
			lowestEFSide = false;
		}
		if (EF2 && EF2[1] < lowestEF) {
			lowestEF = EF2[1];
			lowestEFTime = (lo * 3 + hi) / 4;
			lowestEFPoint = points2[1];
			lowestEFSide = false;
		}

		if (lowestEFSide) {
			lo = (lo + hi) / 2;
		} else {
			hi = (lo + hi) / 2;
		}
	}

	if (lowestEF < MAX_ERROR_FACTOR) {
		return [[lowestEFPoint[0] + xOffset, lowestEFPoint[1] + yOffset], lowestEFTime + tOffset, lowestEF];
	} else {
		return false;
	}
}

if (module && module.exports) {
	module.exports = analyzer;
}

function getPoints(a, b, c, time, SPEED_OF_SOUND) {
	let x = (Math.pow((b[2] + time) * SPEED_OF_SOUND, 2) - Math.pow(time * SPEED_OF_SOUND, 2) - Math.pow(b[0], 2)) / b[0];
	if (x < 0) {
		return false;
	}
	let y = Math.sqrt(Math.pow(time * SPEED_OF_SOUND, 2) - x * x);
	return [[x, y], [x, -y]];
}

function getEF(pt, c, time) { // Get error factor
	return Math.abs(Math.sqrt(Math.pow(pt[0] - c[0], 2) + Math.pow(pt[1] - c[1], 2)) - (c[2] + time))
}

function distance(a, b) {
	return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}
