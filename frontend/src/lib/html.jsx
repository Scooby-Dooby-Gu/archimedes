
import convert from 'react-attr-converter';

function parseFragment(htmlString) {
	const parser = new DOMParser();
	const doc = parser.parseFromString(htmlString, 'text/html');
	return doc.body;
}

function serialize(node) {
	return node.innerHTML;
}

const parser = {parseFragment, serialize}
const NODE_TYPE_TEXT = '#text';
const NODE_TYPE_COMMENT = '#comment';

/**
 * Returns an array of a node's child nodes.
 *
 * @export
 * @param {Node} rootNode
 * @param {Map} registeredComponents
 * @returns {Array}
 */
export function traverseNodeTree(rootNode, registeredComponents) {
	const nodeTree = [];

	for (let i = 0; i < rootNode.childNodes.length; i++) {
		nodeTree.push(convertNode(rootNode.childNodes[i], i, registeredComponents));
	}

	return (nodeTree.length === 1) ? nodeTree[0] : nodeTree;
}

/**
 * Converts a node.
 * If the node is of either type text or comment, the value will be returned.
 * Otherwise the node will be converted to a React element or component.
 *
 * @export
 * @param {Node} node
 * @param {Number} key
 * @param {Map} registeredComponents
 * @returns {String|Object}
 */
export function convertNode(node, key, registeredComponents) {
	if (node.nodeName === NODE_TYPE_TEXT || node.nodeName === NODE_TYPE_COMMENT) {
		return node.value || node.nodeValue;
	}

	const component = registeredComponents.get(node.nodeName.toLowerCase());
	const attributes = convertAttributes(node.attrs || node.attributes, key);
	const tagName = component ? component : node.tagName.toLowerCase();

	if (node.childNodes.length === 0) {
		return React.createElement(tagName, attributes);
	}

	const children = [];

	for (let i = 0; i < node.childNodes.length; i++) {
		children.push(convertNode(node.childNodes[i], i, registeredComponents));
	}

	return React.createElement(tagName, attributes, children);
}

/**
 * Convert the node's attributes to their React counterpart.
 *
 * @export
 * @param {Array} attrs
 * @param {Number} key
 * @returns {Object}
 */
export function convertAttributes(attrs, key) {
	const attributes = { key };

	if (!attrs) return attributes;

	for (let i = 0; i < attrs.length; i++) {
		const attrName = convert(attrs[i].name);
		attributes[attrName] = (attrName === 'style') ? convertStylesToObject(attrs[i].value) : attrs[i].value;
	}

	return attributes;
}

/**
 * Convert inline styles to the React version.
 *
 * @export
 * @param {String} styleString
 * @returns {Object}
 */
export function convertStylesToObject(styleString) {
	const styles = styleString.split(';').reduce((obj, styleDeclaration) => {
		if (styleDeclaration) {
			const parts = styleDeclaration.split(':');
			const key = parts[0].trim();
			const keyArray = Array.from(key);

			Array.from(key).forEach((char, index) => {
				if (char === '-') {
					keyArray[index + 1] = keyArray[index + 1].toUpperCase();
					keyArray[index] = null;
				}
			});

			obj[keyArray.join('')] = parts[1];
		}

		return obj;
	}, {});

	return styles;
}

/* global Map */

import React from 'react';

export function BaseConverter(parser) {
	const registeredComponents = new Map();

	return {
		/**
		 * Convert a html string to React elements or components.
		 *
		 * @param {String} htmlString
		 * @returns {Array|null}
		 */
		convert: htmlString => {
			if (typeof htmlString !== 'string') {
				return null;
			}

			const html = parser.parseFragment(htmlString);

			if (html.childNodes.length > 0) {
				return traverseNodeTree(html, registeredComponents);
			}

			return null;
		},

		/**
		 * Register a React component.
		 *
		 * @param {String} name
		 * @param {React.Component} componentClass
		 */
		registerComponent: (name, componentClass) => {
			registeredComponents.set(name.toLowerCase(), componentClass);
		}
	}
}

/**
 * Parse the html string with the specified parser.
 * If the html string has only one root node, the root node
 * will be converted to a React element. The child nodes will
 * be addes as innerHTML.
 *
 * If more than one root nodes are present, the root nodes will
 * be added as child nodes to a div element.
 *
 * Please note that React is not aware of the child nodes.
 * If you need React to be aware of the child nodes, you probably
 * want to use the non-static convert method.
 *
 * @export
 * @param {String} htmlString
 * @param {Object} parser
 * @returns {Node|null}
 */
export function baseConvertStatic(htmlString, parser) {
	if (typeof htmlString !== 'string') {
		return null;
	}

	const html = parser.parseFragment(htmlString);

	if (html.childNodes.length > 0) {
		let rootNode;

		if (html.childNodes.length === 1) {
			const node = html.childNodes[0];
			rootNode = React.createElement(node.nodeName.toLowerCase(), Object.assign({
				dangerouslySetInnerHTML: {
					__html: parser.serialize(node)
				}
			}, convertAttributes(node.attrs || node.attributes, 0)));
		} else {
			rootNode = React.createElement('div', { dangerouslySetInnerHTML: { __html: htmlString } });
		}

		return rootNode;
	}

	return null;
}


export const PreactHTMLConverter = () => BaseConverter(parser);
export const convertStatic = htmlString => baseConvertStatic(htmlString, parser);