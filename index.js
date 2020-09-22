'use strict';

const $ = Document.prototype.querySelector.bind(document);

document.addEventListener('DOMContentLoaded', function() {
	const req = new XMLHttpRequest();
	req.addEventListener('readystatechange', function() {
		if(this.readyState === 4 && this.status === 200) {
			loadSuccess('default schedule');
			handleJSON(this.responseText);
		}
	});
	req.open('GET', 'schedule.json');
	req.send();
});

function handleJSON(json) {
	try {
		handleSchedule(parseSchedule(json));
	} catch(e) { loadFail(e); }
}
function loadSuccess(name) { }
function loadFail(e) { console.error(e); }

const padZeroLeft = (str, l = 2) => '0'.repeat(l - str.toString().length) + str;
function handleSchedule(schedule) {
	const next = schedule.next();
	if(next === null) {
		$('#upnext').classList.add('clear');
		return;
	} else {
		$('#upnext').classList.remove('clear');
		$('#name').innerText = next.name;
		$('#lecturer').innerText = next.lecturer;
		$('#location').innerText = next.location;
		const weekdate = next.next().weekdate;
		const today = WeekDate.now();
		console.log(weekdate, today);
		const day_delta = weekdate.valueOf() - today.valueOf();
		const week_delta = weekdate.week - today.week;
		$('#day').innerText =
			day_delta === 0 ? 'Today' :
			day_delta === 1 ? 'Tomorrow' :
			((day, week) =>
				week === 0 ? day :
				week === 1 ? 'Next ' + day :
				day + ' after ' + week + ' weeks'
			)(weekdays[weekdate.day], week_delta);
		const begin = next.period_interval.begin.begin, end = next.period_interval.end.end;
		$('#period').innerText = `${begin.hour}:${padZeroLeft(begin.minute)}-${end.hour}:${padZeroLeft(end.minute)}`;
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