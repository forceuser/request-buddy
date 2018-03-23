import {MODE, file} from "./common.js";
import ui from "./ui.js";

navigator.serviceWorker
	.register("./sw.js", {type: "module"})
	.then(registration => {
		const sw = registration.active;
		const ctrl = {
			async get (name) {
				return new Promise(resolve => {
					const channel = new MessageChannel();
					channel.port1.onmessage = event => {
						console.log("client get", name, event.data);
						resolve(event.data.value);
					};
					sw.postMessage({get: name}, [channel.port2]);
				});
			},
			set (name, value) {
				sw.postMessage({
					set: name,
					value,
				});
			},
		};
		ctrl.get("mode").then(mode => {
			ctrl.mode = mode;
		});


		window.addEventListener("message", event => {
			console.log("window message", event.data);
			const d = event.data;
			if (d) {
				if (d.matches) {
					if (d.matches.length === 1) {
						event.ports[0].postMessage({value: d.matches[0]});
					}
					else {
						let matchSet = false;
						ui.showMenu({
							onClose () {
								if (!matchSet) {
									event.ports[0].postMessage({value: null});
								}
							},
							header: `${d.request.method}:${d.request.url}`,
							items: d.matches.map(match => {
								return {
									text: `<div>${match.description || match.body}</div>`,
									click: () => {
										matchSet = true;
										event.ports[0].postMessage({value: match});
										ui.hideMenu(true);
									},
								};
							}),
						});
					}
				}
			}
		});

		document.addEventListener("keydown", event => {
			if (event.ctrlKey && event.altKey && event.code === "KeyD") {
				event.stopPropagation();
				event.preventDefault();

				const getItems = (() => [
					{text: "Открыть файл", click () {
						file.openJSONFile().then(data => {
							ctrl.set("data", data);
						});
						ui.hideMenu(true);
					}},
					{text: "Сохранить файл", click () {
						ctrl.get("data").then(data => {
							ui.hideMenu(true);
							file.saveJSONFile(data);
						});
					}},
					{text: `Режим: <b>${ctrl.mode}</b>`, click () {
						ctrl.mode = ctrl.mode === MODE.READ ? MODE.WRITE : ctrl.mode === MODE.WRITE ? MODE.DISABLED : MODE.READ;
						ctrl.set("mode", ctrl.mode);
						ui.showMenu({items: getItems()});
					}},
				]);
				ui.showMenu({items: getItems()});
			}
		});

	});
