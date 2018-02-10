"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var classNames = require("classnames");
function Toggler(props) {
    var claassName = classNames("ReactDraggableTree_toggler", {
        "ReactDraggableTree_toggler-visible": props.visible,
        "ReactDraggableTree_toggler-collapsed": props.collapsed,
    });
    return React.createElement("div", { className: claassName, onClick: props.onClick });
}
exports.Toggler = Toggler;
