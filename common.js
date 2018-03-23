export const detectEnv = () => {
/* global define, process */
	const isNode = (typeof global !== "undefined") && (Object.prototype.toString.call(global) === "[object global]");
	const isNodeProcess = isNode && !!process.env.NODE_UNIQUE_ID;
	const isWebWorker = !isNode && (typeof WorkerGlobalScope !== "undefined");
	const isServiceWorker = !isNode && (typeof ServiceWorkerGlobalScope !== "undefined");
	const isBrowser = !isNode && !isWebWorker && (typeof navigator !== "undefined") && (typeof document !== "undefined");
	const isBrowserWindow = isBrowser && !!window.opener;
	const isBrowserFrame = isBrowser && window.parent;
	const isAMD = typeof (define) === "function" && define.amd;
	const isThread = isNodeProcess || isWebWorker;
	return {isNode, isNodeProcess, isWebWorker, isServiceWorker, isBrowser, isBrowserWindow, isBrowserFrame, isAMD, isThread};
};

export const MODE = {
	DISABLED: "disabled",
	WRITE: "write",
	READ: "read",
};

export const file = {
	saveBlob (blob, fileName) {
		const a = document.createElement("a");
		a.style = "display: none";
		a.innerHTML = "save";
		const url = window.URL.createObjectURL(blob);
		document.body.appendChild(a);
		a.href = url;
		a.download = fileName;
		a.click();
		setTimeout(() => {
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		});
	},
	openFile () {
		const a = document.createElement("input");
		a.type = "file";
		document.body.appendChild(a);
		a.click();
		return new Promise((resolve, reject) => {
			a.style.position = "absolute";
			a.style.opacity = 0;
			a.style.width = 0;
			a.style.height = 0;
			a.style.overflow = "hidden";
			a.style.zIndex = -1;
			const clk = () => {
				reject();
				document.body.removeChild(a);
				document.body.removeEventListener("click", clk);
			};
			document.body.addEventListener("click", clk);
			a.addEventListener("change", () => {
				const reader = new FileReader();
				reader.onload = event => resolve(event.target.result);
				reader.readAsText(a.files);
				document.body.removeChild(a);
				document.body.removeEventListener("click", clk);
			});
		});
	},
	saveJSONFile (data, fileName) {
		return this.saveBlob(new Blob([JSON.stringify(data)], {type: "text/plain"}), fileName);
	},
	openJSONFile () {
		return this.openFile().then(data => JSON.parse(data));
	},
};


export class Deferred {
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
