type ThrottleResponse = <T>(...args: T[]) => void;

export function throttle(delay: number, callback: Function): ThrottleResponse {
	let timeoutID: NodeJS.Timeout;
	let cancelled = false;

	let lastExec = 0;

	const clearExistingTimeout = (): void => {
		if (timeoutID) {
			clearTimeout(timeoutID);
		}
	};

	const cancel = (): void => {
		clearExistingTimeout();
		cancelled = true;
	};

	const wrapper = <T>(...args: T[]) => {
		const elapsed = Date.now() - lastExec;

		if (cancelled) {
			return;
		}

		const exec = () => {
			lastExec = Date.now();
			callback.apply(this, args);
		};

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
