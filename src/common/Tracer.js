class Tracer {

	constructor() {
		this.traceOn = true;
	}
	internalTrace(text, style0, style1, logMethod) {
		if (this.traceOn) 
			logMethod(text, style0, style1);
	}
	getName(instance) {
		if (instance && instance.name) return instance.name;
		return '';
	}
	getTimeStamp () {
		return new Date().toLocaleTimeString('en-US');
	};
	getPrefix(instance) {
		const name = this.getName(instance);
		if(name)
			return `[${this.getTimeStamp()}, ${name}]`;
		else
			return `[${this.getTimeStamp()}]`;
	}
	log(m, instance = null) {
		const mm = this.getPrefix(instance);
		this.internalTrace(`%c ${mm}%c ${m}`, 'color:green;', 'color:blue;', console.log);
		return mm + m;
	}
	warn(m, instance = null) {
		const mm = `[${this.getTimeStamp()}, ${this.getName(instance)}]`;
		this.internalTrace(`%c ${mm}%c ${m}`, 'color:green;', 'color:blue;', console.warn);
		return mm + m;
	}
	error(m, instance = null) {
		const mm = `[${this.getTimeStamp()}, ${this.getName(instance)}]`;
		this.internalTrace(`%c ${mm}%c ${m}`, 'color:green;', 'color:red;', console.error);
		return mm + m;
	}
	throw (error, instance = null) {
		this.error(error.toString(), instance);
		throw error;
	}
	throwIfUndefined(parameter, parameterName, instance = null) {
		if(typeof(parameter) === 'undefined')
			this.throw(`Parameter ${parameterName} must be defined`, instance);
	}	
}

export default new Tracer();
