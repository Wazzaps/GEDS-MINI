/* jshint node: true, esversion: 6 */

"use strict";

// Dependencies

const express = require("express"),
	http = require("http"),
	path = require("path"),
	finder = require("./event-finder"),
	sampleData = require("./sample-data-gen"),
	EventEmitter = require('events');

let app = express();
let httpServer = http.createServer(app);
let io = require("socket.io")(httpServer);

class ResultEmitter extends EventEmitter {}
const resultEmitter = new ResultEmitter();

// MAD parameters and variables
const SPEEDOFSOUND = 340.29; // m/s
const GROUPING_DISTANCE = 400; // Max. distance in meters between results to be considered a single node. This also gets converted to seconds and becomes max seconds between results
const MINIMUM_DISTANCE = 50; // If two of the three samples in the threepoints algorithm are closer than this value then this threepoints calculation is discarded
const MAX_ERROR_FACTOR = 60; // Threepoints results with error factors higher than this are discarded
const maxSecsForDataInput = 4; // seconds
let result;
let points = [];
app.use(express.static(path.join(__dirname, "public")));
app.set("views", __dirname + "/views");
app.set("view engine", "pug");


app.get("/", function (req, res) {
	res.render("index");
});

function calculate() {
	console.log("calculating");
	let recalcCenter = points.reduce((a, b) => [a[0] + (b[0] / points.length), a[1] + (b[1] / points.length)], [0, 0]);
	let newPts = points.map((pt) => [(pt[0] - recalcCenter[0]) * 111111, (pt[1] - recalcCenter[1]) * 111111 * Math.cos(recalcCenter[0] / 180 * Math.PI), pt[2]]);
	console.log(JSON.stringify(newPts, null, 2));
	console.log("-----------------");
	let output = finder(SPEEDOFSOUND, GROUPING_DISTANCE, MINIMUM_DISTANCE, MAX_ERROR_FACTOR, newPts);
	for (let i = 0; i < output.length; i++) {
		output[i][0] = [output[i][0][0] / 111111 + recalcCenter[0] * 0.99999, output[i][0][1] / Math.cos(recalcCenter[0] / 180 * Math.PI) / 111111 + recalcCenter[1] * 0.99999];
	}
	console.log(JSON.stringify(output, null, 2));
	console.log("done calculating");
	resultEmitter.emit("results", output);
}

function calculate2() {
	let threepoints = require("./threepoint-ownalgo-implementation");

	console.log("calculating 2");
	let recalcCenter = points.reduce((a, b) => [a[0] + (b[0] / points.length), a[1] + (b[1] / points.length)], [0, 0]);
	let newPts = points.map((pt) => [(pt[0] - recalcCenter[0]) * 111111, (pt[1] - recalcCenter[1]) * 111111 * Math.cos(recalcCenter[0] / 180 * Math.PI), pt[2]]);
	let results = [];

	for (let a = 0; a < newPts.length - 2; a++) {
		for (let b = a + 1; b < newPts.length - 1; b++) {
			for (let c = b + 1; c < newPts.length; c++) {
				let result = threepoints(newPts[a], newPts[b], newPts[c], SPEEDOFSOUND, MINIMUM_DISTANCE, MAX_ERROR_FACTOR);
				if (result) {
					results.push([[result[0][0] / 111111 + recalcCenter[0], result[0][1] / Math.cos(recalcCenter[0] / 180 * Math.PI) / 111111 + recalcCenter[1]], result[1], result[2]]);
				}
			}
		}
	}
	resultEmitter.emit("results", results);
	console.log("done calculating 2");
}

function calculate3() {
	console.log("calculating 3");
	resultEmitter.emit("results", points.map((pt) => [[pt[0], pt[1]], pt[2]]));
	console.log("done calculating 3");
}

function addData(lat, lng, t) {
	points.push([lat, lng, t]);
}

app.get("/test", function (req, res) {
	//res.end("Test data added"); // No information given
	let data = sampleData(32.7697991, 34.9537835, 1000, 25, 600, true, false);
	data.forEach((d) => {
		addData(d[0], d[1], d[2]);
	});
	calculate();
	res.end("Calculation done");
});

app.get("/calc", function (req, res) {
	calculate();
	res.end("Calculation done");
});

app.post("/mad", function (req, res) {
	res.end("200 OK"); // No information given
	console.log(req.query);
	console.log(req.body);
	console.log(req);
});

app.get("/", function (req, res) {
	res.render("index");
});

// 404 page

app.get("*", function (req, res) {
	res.end("404 Not found", 404);
});

// Socket.io
io.on("connection", (socket) => {
	function resultSender(results) {
		socket.emit("results", results);
	}

	resultEmitter.on("results", resultSender);

	socket.on("disconnect", () => {
		resultEmitter.removeListener("results", resultSender);
	});
});

httpServer.listen(process.env.PORT || 8080, function () {
	console.log('GEDS MINI started on port 8080');
});