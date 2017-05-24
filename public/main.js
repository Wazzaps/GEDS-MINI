/* jshint esversion: 6, browser: true */
/* jshint -W117 */
/* globals io, google */

(function () {
	"use strict";
	var socket = io();
	var markers = [];
	var map = new google.maps.Map(document.getElementById('map'), {
		center: {
			lat: 32.7667597,
			lng: 34.9572176
		},
		zoom: 15
	});

	let marker1 = new google.maps.Marker({
		position: {
			lat: 32.7697991,
			lng: 34.9537835
		},
		map: map,
		title: "Target"
	});

	/*let marker2 = new google.maps.Marker({
		position: {
			lat: 32.7767597,
			lng: 34.9572176
		},
		map: map,
		title: "Target"
	});*/

	function nullReplace(a, b) {
		if (a === null) {
			return b;
		}
		return a.toString();
	}

	socket.on("results", (results) => {
		if (results.error) {
			console.error(results.error);
		} else {
			console.log(results);
			markers.forEach((marker) => {
				marker.setMap(null);
			});
			markers = [];
			results.forEach((result) => {
				// 0 pos
				// 1 time
				// 2 is connections (unused right now)
				let marker = new google.maps.Marker({
					position: {
						lat: result[0][0],
						lng: result[0][1]
					},
					map: map,
					title: nullReplace(result[1], "unknown")
				});
			});
		}


	});
})();