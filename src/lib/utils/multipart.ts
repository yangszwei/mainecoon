/**
 * Converts a Uint8Array to a String.
 *
 * @param arr Array that should be converted
 * @param offset Array offset in case only subset of array items should be extracted (default: 0)
 * @param limit Maximum number of array items that should be extracted (defaults to length of array)
 * @returns The converted string
 */
export function uint8ArrayToString(arr: Uint8Array, offset: number = 0, limit?: number): string {
	offset = offset || 0;
	limit = limit || arr.length - offset;
	let str = '';
	for (let i = offset; i < offset + limit; i++) {
		str += String.fromCharCode(arr[i]);
	}
	return str;
}

/**
 * Converts a String to a Uint8Array.
 *
 * @param str String that should be converted
 * @returns The converted Uint8Array
 */
export function stringToUint8Array(str: string): Uint8Array {
	const arr = new Uint8Array(str.length);
	for (let i = 0; i < str.length; i++) {
		arr[i] = str.charCodeAt(i);
	}
	return arr;
}

/**
 * Identifies the boundary in a multipart/related message header.
 *
 * @param header Message header
 * @returns The identified boundary or undefined if none found
 */
function identifyBoundary(header: string): string | undefined {
	const parts = header.split('\r\n');
	for (let part of parts) {
		if (part.startsWith('--')) {
			return part;
		}
	}
}

/**
 * Checks whether a given token is contained by a message at a given offset.
 *
 * @param message Message content
 * @param token Substring that should be present
 * @param offset Offset in message content from where search should start
 * @returns Whether message contains token at offset
 */
export function containsToken(message: Uint8Array, token: Uint8Array, offset: number = 0): boolean {
	if (offset + token.length > message.length) {
		return false;
	}

	for (let i = 0; i < token.length; i++) {
		if (token[i] !== message[offset + i]) {
			return false;
		}
	}
	return true;
}

/**
 * Finds a given token in a message at a given offset.
 *
 * @param message Message content
 * @param token Substring that should be found
 * @param offset Message body offset from where search should start
 * @param maxSearchLength Optional maximum search length
 * @returns The index of the token if found, or -1 if not found
 */
export function findToken(
	message: Uint8Array,
	token: Uint8Array,
	offset: number = 0,
	maxSearchLength?: number,
): number {
	const searchLength = maxSearchLength ? Math.min(offset + maxSearchLength, message.length) : message.length;

	for (let i = offset; i < searchLength; i++) {
		// If the first value of the message matches
		// the first value of the token, check if
		// this is the full token.
		if (message[i] === token[0] && containsToken(message, token, i)) {
			return i;
		}
	}
	return -1;
}

/** Encoded Multipart data. */
export interface MultipartEncodedData {
	data: ArrayBuffer;
	boundary: string;
}

/**
 * Encode one or more DICOM datasets into a single body, so it can be sent using the Multipart Content-Type.
 *
 * @param datasets Array containing each file to be encoded in the multipart body, passed as ArrayBuffers.
 * @param boundary Optional string to define a boundary between each part of the multipart body.
 * @param contentType The content type of the data being sent. Default is 'application/dicom'.
 * @returns The Multipart encoded data containing the data itself and the boundary string used to divide it.
 */
export function multipartEncode(
	datasets: ArrayBuffer[],
	boundary: string = guid(),
	contentType: string = 'application/dicom',
): MultipartEncodedData {
	const contentTypeString = `Content-Type: ${contentType}`;
	const header = `\r\n--${boundary}\r\n${contentTypeString}\r\n\r\n`;
	const footer = `\r\n--${boundary}--`;
	const headerArray = stringToUint8Array(header);
	const footerArray = stringToUint8Array(footer);
	const headerLength = headerArray.length;
	const footerLength = footerArray.length;

	let length = 0;

	const contentArrays = datasets.map((datasetBuffer) => {
		const contentArray = new Uint8Array(datasetBuffer);
		length += headerLength + contentArray.length + footerLength;
		return contentArray;
	});

	const multipartArray = new Uint8Array(length);
	let position = 0;

	contentArrays.forEach((contentArray) => {
		multipartArray.set(headerArray, position);
		multipartArray.set(contentArray, position + headerLength);
		position += headerLength + contentArray.length;
	});

	multipartArray.set(footerArray, position);

	return {
		data: multipartArray.buffer,
		boundary,
	};
}

/**
 * Decode a Multipart encoded ArrayBuffer and return the components as an Array.
 *
 * @param response Data encoded as a 'multipart/related' message
 * @returns An array of ArrayBuffers containing each part of the multipart message
 */
export function multipartDecode(response: ArrayBuffer): ArrayBuffer[] {
	const message = new Uint8Array(response);
	const maxSearchLength = 1000;

	const separator = stringToUint8Array('\r\n\r\n');
	const headerIndex = findToken(message, separator, 0, maxSearchLength);
	if (headerIndex === -1) {
		throw new Error('Response message has no multipart mime header');
	}

	const header = uint8ArrayToString(message, 0, headerIndex);
	const boundaryString = identifyBoundary(header);
	if (!boundaryString) {
		throw new Error('Header of response message does not specify boundary');
	}

	const boundary = stringToUint8Array(boundaryString);
	const components: ArrayBuffer[] = [];

	let offset = headerIndex + separator.length;
	let boundaryIndex: number;

	while ((boundaryIndex = findToken(message, boundary, offset)) !== -1) {
		const spacingLength = 2;
		const length = boundaryIndex - offset - spacingLength;
		const data = response.slice(offset, offset + length);
		components.push(data);

		const boundaryEnd = findToken(message, separator, boundaryIndex + 1, maxSearchLength);
		if (boundaryEnd === -1) break;
		offset = boundaryEnd + separator.length;
	}

	return components;
}

/**
 * Create a random GUID
 *
 * @returns A random GUID as a string
 */
export function guid(): string {
	function s4(): string {
		return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
	}
	return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}
