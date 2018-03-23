
export default {
	fromHTML (html) {
		const tpl = document.createElement("div");
		tpl.innerHTML = html;
		return tpl.firstElementChild;
	},
	showModal ({fields, buttons, data}) {
		return `
${
	Object.keys(fields).map(key => {
		const field = fields[key];
		switch (field.type) {
			case "checkbox": {
				return `<label><input name="${field.text}" type="checkbox"/> ${field.caption}</label>`;
			}
			case "radio": {
				return `<label><input name="${field.text}" type="radio"/> ${field.caption}</label>`;
			}
			case "text": {
				return `<label><div>${field.text}</div><input name="${field.name}" type="text"/></label>`;
			}
			case "textarea": {
				return `<label><div>${field.text}</div><textarea name="${field.name}"></textarea></label>`;
			}
			case "select": {
				return `<label><div>${field.text}</div><select name="${field.name}">${(field.options || []).map(i => `<option value="${i.value}">${i.text}</option>`).join("")}</select></label>`;
			}
		}
	}).join("")
}
		`;
	},
	showNotification () {

	},
	hideMenu (closeAll) {
		const menu = document.querySelector(".xrb-menu");
		if (menu) {
			let allowClose = menu.onClose ? menu.onClose(closeAll) === false : true;
			if (allowClose) {
				menu.parentNode.removeChild(menu);
			}
		}
	},
	showMenu (options = {}) {
		const {items, header, parent, context, actions = {}} = options;
		this.hideMenu(true);
		const menu = this.fromHTML(`
			<div class="xrb-isolated xrb-menu">
				<div class="xrb-menu-header">
					<button type="button" data-action="back">back</button>
					<button type="button" data-action="close">close</button>
				</div>
${
	items.map((item, idx) => `
		<div class="xrb-menu-item" data-id="${idx}">
			${item.text}
		</div>
	`).join("")
}
			</div>
		`);
		document.body.appendChild(menu);
		menu.addEventListener("click", event => {
			const itemElement = event.target.closest(".xrb-menu-item");
			if (itemElement) {
				const item = items[itemElement.getAttribute("data-id")];
				item.click && item.click(options);
			}
			const actionElement = event.target.closest("data-action");
			if (actionElement) {
				const action = actionElement.getAttribute("data-action");
				if (actions[action]) {
					actions[action](options);
				}
				else if (action === "close") {
					this.hideMenu(true);
				}
				else if (action === "back") {
					this.hideMenu(false);
				}
			}
		});
		menu.onClose = options.onClose;
	},
};
