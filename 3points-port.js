// ORIGINALLY WRITTEN BY Igor Porevkin in C
// PORTED TO JS BY David Shlemayev
// Made for GEDS

module.exports = function (a, b, c) {
	const SOUND_SPEED = 340; // m/sec
	const MIN_DIST = 100;
	const MAX_TIME_OFFSET = 91; //sec  about 30 km

	var dCoordX = 0,
		dCoordY = 0;
	var dMinLocationError = 0,
		dMinLocationTime = 0;
	var dMinPosLocationError = 0,
		dMinPosLocationTime = 0;
	var dMinNegLocationError = 0,
		dMinNegLocationTime = 0;


	var dExpCoordX = 0,
		dExpCoordY = 0;
	var dExpPosCoordX = 0,
		dExpPosCoordY = 0;
	var dExpNegCoordX = 0,
		dExpNegCoordY = 0;

	function ExpCoordinate(dCoordX1, dCoordY1,
		dCoordX2, dCoordY2,
		dCoordX3, dCoordY3,
		dTime1, dTime2, dTime3) {
		var sIdx = 0;
		var dXOffset = 0,
			dYOffset = 0;
		var dRotateAngle2 = 0,
			dRotateAngle3 = 0;
		var dShftX2 = 0,
			dShftY2 = 0,
			dShftX3 = 0,
			dShftY3 = 0;
		var dNewX2 = 0,
			dNewX3 = 0;
		var dRelTime2 = 0,
			dRelTime3 = 0;
		var dTimeOffset = 0;
		var dStartTime = 0;
		var dEndTime = 0;
		var dTimeStep = 0;
		var dExpOffsetCoordX = 0,
			dExpOffsetCoordY = 0;
		var dExpResCoordX = 0,
			dExpResCoordY = 0;
		var dDistance12 = Math.sqrt(Math.pow((dCoordX2 - dCoordX1), 2) + Math.pow((dCoordY2 - dCoordY1), 2));
		var dDistance13 = Math.sqrt(Math.pow((dCoordX3 - dCoordX1), 2) + Math.pow((dCoordY3 - dCoordY1), 2));
		var dDistance23 = Math.sqrt(Math.pow((dCoordX3 - dCoordX2), 2) + Math.pow((dCoordY3 - dCoordY2), 2));

		dMinLocationError = 10000000000;
		dMinPosLocationError = 10000000000;
		dMinNegLocationError = 10000000000;
		dMinLocationTime = MAX_TIME_OFFSET * 2;
		dMinPosLocationTime = MAX_TIME_OFFSET * 2;
		dMinNegLocationTime = MAX_TIME_OFFSET * 2;

		if ((dDistance12 < MIN_DIST) ||
			(dDistance13 < MIN_DIST) ||
			(dDistance23 < MIN_DIST)) {
			return false;
		}
		if ((dDistance12 > dDistance13) && (dDistance12 > dDistance23)) {
			if ((dDistance12 * 0.95) > (dDistance13 + dDistance23))
				return false;
		}
		if ((dDistance13 > dDistance12) && (dDistance13 > dDistance23)) {
			if ((dDistance13 * 0.95) > (dDistance12 + dDistance23))
				return false;
		}
		if ((dDistance23 > dDistance12) && (dDistance23 > dDistance13)) {
			if ((dDistance23 * 0.95) > (dDistance12 + dDistance13))
				return false;
		}


		dXOffset = -dCoordX1;
		dYOffset = -dCoordY1;


		if ((Math.abs(dCoordY2 - dCoordY1)) < (Math.abs(dCoordX2 - dCoordX1))) {
			dRotateAngle2 = -Math.atan(((dCoordY2 - dCoordY1)) / ((dCoordX2 - dCoordX1)));
		} else {
			dRotateAngle2 = Math.atan(((dCoordX2 - dCoordX1)) / ((dCoordY2 - dCoordY1)));
			dRotateAngle2 = (Math.PI / 2 + dRotateAngle2);
		}

		if ((Math.abs(dCoordY3 - dCoordY1)) < (Math.abs(dCoordX3 - dCoordX1))) {
			dRotateAngle3 = -Math.atan(((dCoordY3 - dCoordY1)) / ((dCoordX3 - dCoordX1)));
		} else {
			dRotateAngle3 = Math.atan(((dCoordX3 - dCoordX1)) / ((dCoordY3 - dCoordY1)));
			dRotateAngle3 = (Math.PI / 2 + dRotateAngle3);
		}

		dShftX2 = dCoordX2 + dXOffset;
		dShftY2 = dCoordY2 + dYOffset;
		dShftX3 = dCoordX3 + dXOffset;
		dShftY3 = dCoordY3 + dYOffset;

		dNewX2 = dShftX2 * Math.cos(dRotateAngle2) - dShftY2 * Math.sin(dRotateAngle2);
		dNewX3 = dShftX3 * Math.cos(dRotateAngle3) - dShftY3 * Math.sin(dRotateAngle3);

		dRelTime2 = dTime2 - dTime1;
		dRelTime3 = dTime3 - dTime1;

		dTimeStep = MAX_TIME_OFFSET / 256;
		for (dTimeOffset = 0; dTimeOffset < MAX_TIME_OFFSET; dTimeOffset += dTimeStep) {
			FindCoordinates(dTimeOffset, dNewX2, dNewX3,
				dRotateAngle2, dRotateAngle3,
				dRelTime2, dRelTime3);
		}
		for (sIdx = 0; sIdx < 3; sIdx++) {
			if ((dMinLocationTime - dTimeStep) < 0)
				dStartTime = 0;
			else dStartTime = (dMinLocationTime - dTimeStep);
			dEndTime = dMinLocationTime + dTimeStep;
			dTimeStep /= 64;

			for (dTimeOffset = dStartTime; dTimeOffset < dEndTime; dTimeOffset += dTimeStep) {
				FindCoordinates(dTimeOffset, dNewX2, dNewX3,
					dRotateAngle2, dRotateAngle3,
					dRelTime2, dRelTime3);
			}
			dTimeStep *= 64;
			if ((dMinPosLocationTime - dTimeStep) < 0)
				dStartTime = 0;
			else dStartTime = (dMinPosLocationTime - dTimeStep);
			dEndTime = dMinPosLocationTime + dTimeStep;
			dTimeStep /= 64;

			for (dTimeOffset = dStartTime; dTimeOffset < dEndTime; dTimeOffset += dTimeStep) {
				FindCoordinates(dTimeOffset, dNewX2, dNewX3,
					dRotateAngle2, dRotateAngle3,
					dRelTime2, dRelTime3);
			}
			dTimeStep *= 64;
			if ((dMinNegLocationTime - dTimeStep) < 0)
				dStartTime = 0;
			else dStartTime = (dMinNegLocationTime - dTimeStep);
			dEndTime = dMinNegLocationTime + dTimeStep;
			dTimeStep /= 64;

			for (dTimeOffset = dStartTime; dTimeOffset < dEndTime; dTimeOffset += dTimeStep) {
				FindCoordinates(dTimeOffset, dNewX2, dNewX3,
					dRotateAngle2, dRotateAngle3,
					dRelTime2, dRelTime3);
			}




		}


		if (dMinLocationError <= 100) {
			dExpResCoordX = dExpCoordX;
			dExpResCoordY = dExpCoordY;
		} else if ((dMinPosLocationError <= 100) && (dMinNegLocationError > 100)) {
			dExpResCoordX = dExpPosCoordX;
			dExpResCoordY = dExpPosCoordY;
		} else if ((dMinPosLocationError > 100) && (dMinNegLocationError <= 100)) {
			dExpResCoordX = dExpNegCoordX;
			dExpResCoordY = dExpNegCoordY;
		} else if ((dMinPosLocationError <= 100) && (dMinNegLocationError <= 100)) {
			if (dMinPosLocationTime <= dMinNegLocationTime) {
				dExpResCoordX = dExpPosCoordX;
				dExpResCoordY = dExpPosCoordY;
			} else {
				dExpResCoordX = dExpNegCoordX;
				dExpResCoordY = dExpNegCoordY;
			}
		} else {
			return false;
		}


		dExpOffsetCoordX = dExpResCoordX * Math.cos(-dRotateAngle2) - dExpResCoordY * Math.sin(-dRotateAngle2);
		dExpOffsetCoordY = dExpResCoordX * Math.sin(-dRotateAngle2) + dExpResCoordY * Math.cos(-dRotateAngle2);

		dCoordX = dExpOffsetCoordX - dXOffset;
		dCoordY = dExpOffsetCoordY - dYOffset;
		return true;
	}


	function FindCoordinates(dTimeOffset, dNewX2, dNewX3,
		dRotateAngle2, dRotateAngle3,
		dRelTime2, dRelTime3) {
		var dYpow2 = 0;
		var dExpCoordX1 = 0,
			dExpCoordX2 = 0;
		var dExpCoordY1_1 = 0,
			dExpCoordY1_2 = 0,
			dExpCoordY2_1 = 0,
			dExpCoordY2_2 = 0;
		var dExpCmpCoordX2_1 = 0,
			dExpCmpCoordY2_1 = 0,
			dExpCmpCoordX2_2 = 0,
			dExpCmpCoordY2_2 = 0;
		//    var dLocationError = 0;
		dExpCoordX1 = (-SOUND_SPEED * SOUND_SPEED * dRelTime2 * dRelTime2 -
				2 * SOUND_SPEED * SOUND_SPEED * dRelTime2 * dTimeOffset +
				dNewX2 * dNewX2) /
			(2 * dNewX2);

		dYpow2 = (SOUND_SPEED * SOUND_SPEED *
			dTimeOffset * dTimeOffset -
			dExpCoordX1 * dExpCoordX1);
		if (dYpow2 > 0) {
			dExpCoordY1_1 = Math.sqrt(dYpow2);
			dExpCoordY1_2 = -dExpCoordY1_1;

			dExpCoordX2 = (-SOUND_SPEED * SOUND_SPEED * dRelTime3 * dRelTime3 -
					2 * SOUND_SPEED * SOUND_SPEED * dRelTime3 * dTimeOffset +
					dNewX3 * dNewX3) /
				(2 * dNewX3);

			dYpow2 = (SOUND_SPEED * SOUND_SPEED *
				dTimeOffset * dTimeOffset -
				dExpCoordX2 * dExpCoordX2);

			if (dYpow2 > 0) {
				dExpCoordY2_1 = Math.sqrt(dYpow2);
				dExpCoordY2_2 = -dExpCoordY2_1;

				dExpCmpCoordX2_1 = dExpCoordX2 * Math.cos(dRotateAngle2 - dRotateAngle3) - dExpCoordY2_1 * Math.sin(dRotateAngle2 - dRotateAngle3);
				dExpCmpCoordY2_1 = dExpCoordX2 * Math.sin(dRotateAngle2 - dRotateAngle3) + dExpCoordY2_1 * Math.cos(dRotateAngle2 - dRotateAngle3);

				dExpCmpCoordX2_2 = dExpCoordX2 * Math.cos(dRotateAngle2 - dRotateAngle3) - dExpCoordY2_2 * Math.sin(dRotateAngle2 - dRotateAngle3);
				dExpCmpCoordY2_2 = dExpCoordX2 * Math.sin(dRotateAngle2 - dRotateAngle3) + dExpCoordY2_2 * Math.cos(dRotateAngle2 - dRotateAngle3);

				SetCoordinates(dTimeOffset, dExpCoordX1, dExpCoordY1_1, dExpCmpCoordX2_1, dExpCmpCoordY2_1);
				SetCoordinates(dTimeOffset, dExpCoordX1, dExpCoordY1_2, dExpCmpCoordX2_1, dExpCmpCoordY2_1);
				SetCoordinates(dTimeOffset, dExpCoordX1, dExpCoordY1_1, dExpCmpCoordX2_2, dExpCmpCoordY2_2);
				SetCoordinates(dTimeOffset, dExpCoordX1, dExpCoordY1_2, dExpCmpCoordX2_2, dExpCmpCoordY2_2);

			}
		}
	}


	function SetCoordinates(dTimeOffset, dX1, dY1, dX2, dY2) {
		var dLocationError = 0;
		dLocationError = Math.pow((dX1 - dX2), 2) + Math.pow((dY1 - dY2), 2);

		if ((dY1 > 0) && (dY2 > 0)) {
			if (dLocationError < dMinPosLocationError) {
				dMinPosLocationError = dLocationError;
				dMinPosLocationTime = dTimeOffset;
				dExpPosCoordX = (dX1 + dX2) / 2;
				dExpPosCoordY = (dY1 + dY2) / 2;
			}
		} else if ((dY1 < 0) && (dY2 < 0)) {
			if (dLocationError < dMinNegLocationError) {
				dMinNegLocationError = dLocationError;
				dMinNegLocationTime = dTimeOffset;
				dExpNegCoordX = (dX1 + dX2) / 2;
				dExpNegCoordY = (dY1 + dY2) / 2;
			}
		} else if (dLocationError < dMinLocationError) {
			dMinLocationError = dLocationError;
			dMinLocationTime = dTimeOffset;
			dExpCoordX = (dX1 + dX2) / 2;
			dExpCoordY = (dY1 + dY2) / 2;
		}
	}



	if (ExpCoordinate(a[0], a[1], b[0], b[1], c[0], c[1], a[2], b[2], c[2])) {
		return {
			"success": true,
			"position": [dCoordX, dCoordY]
		};
	} else {
		return {
			"success": false,
			"errorMsg": ""
		};
	}
};