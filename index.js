'use strict';

const $ = Document.prototype.querySelector.bind(document);

$('#import>input').addEventListener('change', function() {
	if(!this.files.length)
		return;
	const file = this.files[0];
	$('#filename').innerText = 'Imported ' + file.name;
	const reader = new FileReader();
	reader.addEventListener('load', function () {
		const raw = this.result;
		try {
			const schedule = parseSchedule(raw);
			handleSchedule(schedule);
		} catch(e) { return loadFail(e); }
	});
	reader.addEventListener('error', loadFail);
	reader.readAsText(file);
});

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

function loadFail(e) {
	console.error(e);
	$('#filename').innerText = 'Import Failed';
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