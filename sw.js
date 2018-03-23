
const MODE = {
	DISABLED: "disabled",
	WRITE: "write",
	READ: "read",
};


class Deferred {
	constructor () {
		this.promise = new Promise((resolve, reject) => {
			this.ctrl = {resolve, reject};
		});
	}
	resolve () {
		return this.ctrl.resolve();
	}
	reject () {
		return this.ctrl.reject();
	}
}

const ctrl = {
	wait: {},
	playing: true,
	mode: MODE.DISABLED,
	data: {
		ignore: {},
	},
	clearIgnored (url) {
		return url;
	},
	stop () {
		this.playingCtrl = new Deferred();
		this.playing = this.playingCtrl.promise;
	},
	play () {
		if (this.playingCtrl) {
			this.playingCtrl.resolve();
		}
	},
	async match (request, client) {
		const url = this.clearIgnored(request.url);
		const method = request.method;
		const matches = this.data[`${method}:${url}`] || [];
		if (matches.length) {
			const match = await new Promise(resolve => {
				const channel = new MessageChannel();
				channel.port1.onmessage = event => {
					console.log("match from client", event.data);
					resolve(event.data.value);
				};
				client.postMessage({matches, request: {method, url}}, [channel.port2]);
			});
			if (!match) {
				return fetch(request);
			}
			else {
				return new Response(match.body, match.response);
			}
		}
		else {
			return fetch(request);
		}
	},
	async add (response, request) {
		const url = this.clearIgnored(request.url);
		const method = request.method;
		this.data[`${method}:${url}`] = this.data[`${method}:${url}`] || [];
		const matches = this.data[`${method}:${url}`];
		const body = await response.text();
		const requestBody = await request.text();
		const requestHeaders = {};
		for (const [key, value] of request.headers.entries()) {
			requestHeaders[key] = value;
		}
		const responseHeaders = {};
		for (const [key, value] of response.headers.entries()) {
			responseHeaders[key] = value;
		}


		if (!matches.find(i => i.request.body === body)) {
			matches.push({
				body,
				response: {
					ok: response.ok,
					status: response.status,
					statusText: response.statusText,
					headers: responseHeaders,
				},
				request: {
					body: requestBody,
					headers: requestHeaders,
				},
			});
		}
	},
};

self.addEventListener("message", (event) => {
	console.log("service worker message", event.data);
	if (event.data) {
		const d = event.data;
		if (d.mode) {
			ctrl.mode = d.mode;
		}
		if (d.data) {
			ctrl.data = d.data || {};
			ctrl.data.ignore = ctrl.data.ignore || {};
		}
		if (d.get) {
			const client = event.ports[0];
			return client.postMessage({value: ctrl[d.get]});
		}
		if (d.set) {
			ctrl[d.set] = d.value;
		}
	}
});

/* global clients */
self.addEventListener("install", (event) => {

});

self.addEventListener("fetch", (event) => {
	event.respondWith((async () => {
		await Promise.resolve(ctrl.playing);
		switch (ctrl.mode) {
			case MODE.READ: {
				const request = event.request.clone();
				const client = await clients.get(event.clientId);
				return ctrl.match(request, client);
			}
			case MODE.WRITE: {
				return fetch(event.request).then(response => {
					ctrl.add(response.clone(), event.request.clone());
					return response;
				});
			}
			default: {
				return fetch(event.request);
			}
		}
	})());

});
