function onOpen() {
}
function onEdit() {
}
function onInstall() {
}
function doGet() {
}
function doPost() {
}
function sayHello() {
}/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
/*!************************!*\
  !*** ./build/index.js ***!
  \************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   doGet: () => (/* binding */ doGet),
/* harmony export */   doPost: () => (/* binding */ doPost),
/* harmony export */   onEdit: () => (/* binding */ onEdit),
/* harmony export */   onInstall: () => (/* binding */ onInstall),
/* harmony export */   onOpen: () => (/* binding */ onOpen),
/* harmony export */   sayHello: () => (/* binding */ sayHello)
/* harmony export */ });
function sayHello() {
    const name = Session.getActiveUser().getEmail().split("@")[0];
    SpreadsheetApp.getActiveSpreadsheet().toast(`Hello, ${name}! 👋`, "Greeting");
}
function onOpen(_e) {
    SpreadsheetApp.getUi()
        .createMenu("🔧 Example Menu")
        .addItem("Say Hello", "sayHello")
        .addToUi();
}
function onEdit(_e) {
    console.log(_e);
}
function onInstall(_e) {
    console.log(_e);
}
function doGet(_e) {
    console.log(_e);
}
function doPost(_e) {
    console.log(_e);
}

__webpack_require__.g.onOpen = __webpack_exports__.onOpen;
__webpack_require__.g.onEdit = __webpack_exports__.onEdit;
__webpack_require__.g.onInstall = __webpack_exports__.onInstall;
__webpack_require__.g.doGet = __webpack_exports__.doGet;
__webpack_require__.g.doPost = __webpack_exports__.doPost;
__webpack_require__.g.sayHello = __webpack_exports__.sayHello;
/******/ })()
;