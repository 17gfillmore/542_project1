const htmlAnchor = function(volume) {
    return `<a name="v${volume.id}" />`;
};

const htmlDiv = function (parameters) {
    let classString = "";
    let contentString = "";
    let idString = "";

    if (parameters.classKey !== undefined) {
        classString = ` class="${parameters.classKey}"`;
    }
    if (parameters.content !== undefined) {
        contentString = parameters.content;
    }
    if (parameters.id !== undefined) {
        idString = ` id="${parameters.id}"`;
    }

    return `<div${idString}${classString}>${contentString}</div>`;
};

const htmlElement = function (tagName, content, classValue) {
    let classString = "";

    if (classValue !== undefined) {
        classString = ` class="${classValue}"`;
    }

    return `<${tagName}${classString}>${content}</${tagName}>`;
};

const htmlLink = function (parameters) {
    let classString = '';
    let contentString = '';
    let hrefString = '';
    let idString = '';
    
    if (parameters.classKey !== undefined) {
        classString = ` class="${parameters.classKey}"`;
    }
    if (parameters.content !== undefined) {
        contentString = parameters.content;
    }
    if (parameters.href !== undefined) {
        hrefString = ` href="${parameters.href}"`;
    }
    if (parameters.id !== undefined) {
        idString = ` id="${parameters.id}"`;
    }
    if (parameters.title !== undefined) {
        titleString = ` title="${parameters.title}"`;
    }

    return `<a${idString}${classString}${hrefString}>${contentString}</a>`;
};

export { htmlAnchor, htmlDiv, htmlElement, htmlLink }