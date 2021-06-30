export function throttle(delay: number, callback: Function) {
	let timeoutID: NodeJS.Timeout;
	let cancelled = false;

	let lastExec = 0;

	function clearExistingTimeout(): void {
		if (timeoutID) {
			clearTimeout(timeoutID);
		}
	}

	function cancel() {
		clearExistingTimeout();
		cancelled = true;
	}

	function wrapper(...arguments_) {
		let self = this;
		let elapsed = Date.now() - lastExec;

		if (cancelled) {
			return;
		}

		function exec() {
			lastExec = Date.now();
			callback.apply(self, arguments_);
		}

		if (!timeoutID) {
			exec();
		}

		clearExistingTimeout();

		if (elapsed > delay) {
			exec();
		} else {
			timeoutID = setTimeout(exec, delay - elapsed);
		}
	}

	wrapper.cancel = cancel;

	return wrapper;
}
