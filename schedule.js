{
	'use strict';

	class Schedule {
		constructor() {
			if(arguments.length === 1 && arguments[0] instanceof Schedule)
				return arguments[0];
			this.lectures = new Set();
		}
		/** @param {Lecture} lecture */
		addLecture(lecture) { this.lectures.add(lecture); }
		next() {
			let lectures = [...this.lectures]
				.map(lecture => ({ lecture, datetime: lecture.next() }))
				.filter(({ datetime }) => datetime);
			lectures.sort(({ datetime: a }, { datetime: b }) => a.compare(b));
			return lectures[0] || null;
		}
	}

	const mod = n => i => i - Math.floor(i / n) * n;
	const mod7 = mod(7);

	class Lecture {
		constructor(name = '', lecturer = '', location = '', week_interval, weekday = 0, period_interval) {
			if(arguments.length === 1 && arguments[0] instanceof Lecture)
				return arguments[0];
			this.name = name.toString();
			this.lecturer = lecturer.toString();
			this.location = location.toString();
			this.week_interval = new WeekInterval(week_interval);
			this.weekday = mod7(parseInt(weekday));
			this.period_interval = new PeriodInterval(period_interval);
		}
		atWeek(n) {
			if(n < this.week_interval.begin.index || n > this.week_interval.end.index)
				return null;
			return new DateTime(new WeekDate(n, this.weekday), this.period_interval.begin.begin);
		}
		begin() {
			const weekdate = new WeekDate(this.week_interval.begin.valueOf(), this.weekday);
			const time = this.period_interval.begin.begin;
			return new DateTime(weekdate, time);
		}
		next() {
			if(!this.hasntEnded())
				return null;
			const now = DateTime.now();
			const week = WeekDate.now().week;
			const this_week = this.atWeek(week);
			return this_week.compare(now) === 1 ? this_week : this.atWeek(week + 1);
		}
		end() {
			const weekdate = new WeekDate(this.week_interval.end.valueOf(), this.weekday);
			const time = this.period_interval.end.end;
			return new DateTime(weekdate, time);
		}
		hasntEnded() { return DateTime.now().compare(this.end()) === -1; }
		active() {
			const now = WeekDate.now();
			return this.begin().compare(now) + this.end().compare(now) === 0;
		}
		activated() { return DateTime.now().compare(this.end()) === 1; }
	};

	const unify = n => n && (n > 0 ? 1 : -1);
	class Comparable {
		constructor() {}
		checkInt(interval) { return interval.check(this); }
		compare(comparable) { return unify(this.valueOf() - comparable.valueOf()); }
	}
	// Not all Interval's are Comparable, but JavaScript does not support multi-deriving
	class Interval extends Comparable {
		constructor(begin, end) {
			if(arguments.length === 1 && arguments[0] instanceof (this.__proto__.constructor || Interval))
				return arguments[0];
			super();
			this.begin = begin;
			this.end = end || begin;
		}
		check(comparable) {
			return (this.begin.compare(comparable) + this.end.compare(comparable)) / 2;
		}
		valueOf() { return this.begin.valueOf(); }
	}

	class WeekInterval extends Interval {
		constructor(begin, end) {
			if(arguments.length === 1 && arguments[0] instanceof WeekInterval)
				return arguments[0];
			super(new Week(begin), new Week(end));
		}
	}
	class Week extends Comparable {
		constructor(week = 0) {
			if(arguments.length === 1 && arguments[0] instanceof Week)
				return arguments[0];
			super();
			this.index = parseInt(week);
		}
		valueOf() { return this.index; }
		dist(week) { return Math.abs(this - week); }
	}
	// A continuous group of Period's that a Lecture lasts
	class PeriodInterval extends Interval {
		constructor(begin, end) {
			if(arguments.length === 1 && arguments[0] instanceof PeriodInterval)
				return arguments[0];
			super(new Period(begin), new Period(end));
		}
	}
	// Minimal time unit of Lecture's
	class Period extends Interval {
		constructor(begin, end) {
			if(arguments.length === 1 && arguments[0] instanceof Period)
				return arguments[0];
			super(new Time(begin), new Time(end));
		}
	}

	// First day of the first week
	const base = new Date('9/6/2020');
	class DateTime extends Comparable {
		constructor(weekdate, time = new Time()) {
			if(arguments.length === 1 && arguments[0] instanceof DateTime)
				return arguments[0];
			super();
			this.weekdate = new WeekDate(weekdate);
			this.time = new Time(time);
		}
		toDate() {
			const date = new Date();
			date.setFullYear(base.getFullYear(), base.getMonth(), base.getDate() + this.weekdate.valueOf());
			const time = this.time;
			date.setHours(time.hour, time.minute, time.second, time.millisecond);
			return date;
		}
		valueOf() { return this.toDate(); }
	}
	DateTime.now = () => Time.now().bind(WeekDate.now());
	// Date expression that is based on relative week days to the base date
	class WeekDate extends Comparable {
		constructor(week = 0, day = 0) {
			if(arguments.length === 1 && arguments[0] instanceof WeekDate)
				return arguments[0];
			super();
			this.week = parseInt(week);
			this.day = parseInt(day);
		}
		valueOf() { return this.week * 7 + this.day; }
	}
	WeekDate.fromDate = date => {
		const day_delta = Math.floor((date - base) / 1000 / 60 / 60 / 24);
		const week = Math.floor(day_delta / 7);
		const day = day_delta % 7;
		return new WeekDate(week, day);
	}
	WeekDate.now = () => WeekDate.fromDate(new Date());
	// Hour to millisecond regardless of date
	class Time extends Comparable {
		constructor(hour = 0, minute = 0, second = 0, millisecond = 0) {
			if(arguments.length === 1 && arguments[0] instanceof Time)
				return arguments[0];
			super();
			this.hour = parseInt(hour);
			this.minute = parseInt(minute);
			this.second = parseInt(second);
			this.millisecond = parseInt(millisecond);
		}
		valueOf() { return ((this.hour * 60 + this.minute) * 60 + this.second) * 1000 + this.millisecond; }
		bind(weekdate) { return new DateTime(weekdate, this); }
	}
	Time.now = () => (date => new Time(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()))(new Date());

	const exportModule = module => Object.defineProperties(window, Object.getOwnPropertyDescriptors(module));
	exportModule({ Schedule, Lecture, WeekInterval, PeriodInterval, Period, Time});
}