'use strict';

const $ = Document.prototype.querySelector.bind(document);

$('#import>input').addEventListener('change', function() {
	if(!this.files.length)
		return;
	const file = this.files[0];
	loadSuccess(file.name);
	const reader = new FileReader();
	reader.addEventListener('load', function () { handleJSON(this.result); });
	reader.addEventListener('error', loadFail);
	reader.readAsText(file);
});
document.addEventListener('DOMContentLoaded', function() {
	const req = new XMLHttpRequest();
	req.addEventListener('readystatechange', function() {
		if(this.readyState === 4 && this.status === 200) {
			loadSuccess('default schedule');
			handleJSON(this.result);
		}
	});
	req.open('GET', 'schedule.json');
	req.send();
});

function handleJSON(json) {
	try {
		handleSchedule(parseSchedule(json))
	} catch(e) { return loadFail(e); }
}
function loadSuccess(name) { $('#filename').innerText = 'Imported ' + name; }
function loadFail(e) {
	console.error(e);
	$('#filename').innerText = 'Import Failed';
}

const padZeroLeft = (str, l = 2) => '0'.repeat(l - str.toString().length) + str;
function handleSchedule(schedule) {
	const next = schedule.next();
	if(next === null)
		return;
	else {
		const { lecture } = next, time = next.datetime.time;
		$('#name').innerText = lecture.name;
		$('#lecturer').innerText = lecture.lecturer;
		$('#location').innerText = lecture.location;
		$('#weekday').innerText = weekdays[lecture.weekday];
		$('#begin').innerText = `${time.hour}:${padZeroLeft(time.minute)}`;
	}
}

function parseSchedule(raw) {
	const schedule = new Schedule();
	for(const obj of JSON.parse(raw))
		schedule.addLecture(parseLecture(obj));
	return schedule;
}
function parseLecture(obj) {
	const { name, lecturer, location, weekday } = obj;
	const week_interval = new WeekInterval(...obj.week.map(i => i - 1));
	const period_interval = new PeriodInterval(...obj.period.map(i => periods[i - 1]));
	return new Lecture(name, lecturer, location, week_interval, weekday, period_interval);
}