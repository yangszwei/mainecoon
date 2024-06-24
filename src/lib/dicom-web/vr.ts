import type { DicomJson } from '@/lib/dicom-web';

/// DECODING FUNCTIONS

export function decodeValue(vr: string, encodedValue: string | ArrayBuffer[]) {
	let buffer;

	if (!encodedValue) {
		return null;
	}

	if (typeof encodedValue === 'string') {
		const decodedValue = atob(encodedValue);

		const byteArray = new Uint8Array(decodedValue.length);
		for (let i = 0; i < decodedValue.length; i++) {
			byteArray[i] = decodedValue.charCodeAt(i);
		}

		buffer = byteArray.buffer;
	} else {
		buffer = encodedValue[0];
	}

	switch (vr) {
		case 'OL':
			return new Uint32Array(buffer);
		case 'OF':
			return new Float32Array(buffer);
		case 'OD':
			return new Float64Array(buffer);
		default:
			return new TextDecoder().decode(buffer);
	}
}

/// FORMATTING FUNCTIONS

export function formatTime(value: string, precise = false): string {
	/**
	 * Checks if the given time can be a leap second. Leap seconds are inserted at the end of the last day of June or
	 * December.
	 */
	function isLeapSecond(hours: string, minutes: string): boolean {
		return hours === '23' && minutes === '59';
	}

	const tmValue = value.trim();
	const match = tmValue.match(/^(\d{2})(\d{2})(\d{2})(\.(\d{1,6}))?$/);

	if (match) {
		const [_, hours, minutes, seconds, , fractionalSeconds = ''] = match;

		const isValidTime =
			hours >= '00' &&
			hours <= '23' &&
			minutes >= '00' &&
			minutes <= '59' &&
			((seconds >= '00' && seconds <= '60') || (seconds === '60' && isLeapSecond(hours, minutes))) &&
			fractionalSeconds.length <= 6;

		if (isValidTime) {
			return `${hours}:${minutes}:${seconds}${precise && fractionalSeconds ? '.' + fractionalSeconds : ''}`;
		}
	}

	// If the format is invalid, return the original value
	return value;
}

export function formatDate(value: string): string {
	return value.replace(/(\d{4})(\d{2})(\d{2})/, '$1/$2/$3');
}

export function formatPersonName(value: any): string {
	return value.Alphabetic;
}

export function formatPatientSex(value: string): string {
	return { M: 'Male', F: 'Female', O: 'Other' }[value] || value;
}

export function formatValue(vr: string, value: string | number | DicomJson) {
	if (!value) return '';

	switch (vr) {
		case 'PN':
			return formatPersonName(value);
		case 'DA':
			return formatDate(value as string);
		case 'TM':
			return formatTime(value as string);
		default:
			return value.toString();
	}
}
