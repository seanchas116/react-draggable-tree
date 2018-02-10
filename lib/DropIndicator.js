"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var classNames = require("classnames");
var DropIndicator = /** @class */ (function (_super) {
    __extends(DropIndicator, _super);
    function DropIndicator() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = {
            type: 'none',
            index: 0,
            depth: 0
        };
        return _this;
    }
    DropIndicator.prototype.render = function () {
        var _a = this.state, type = _a.type, index = _a.index, depth = _a.depth;
        var _b = this.props, rowHeight = _b.rowHeight, indent = _b.indent;
        var offset = index * rowHeight;
        var dropOverStyle = {
            left: '0',
            top: offset + "px",
            width: '100%',
            height: rowHeight + "px"
        };
        var dropBetweenStyle = {
            top: offset - 1 + "px",
            height: '0',
            left: (depth + 1) * indent + "px",
            width: "calc(100% - " + (depth + 1) * indent + "px)"
        };
        return (React.createElement("div", null,
            React.createElement("div", { className: classNames('ReactDraggableTree_dropOver', this.props.dropOverClassName), hidden: type !== 'over', style: dropOverStyle }),
            React.createElement("div", { className: classNames('ReactDraggableTree_dropBetween', this.props.dropBetweenClassName), hidden: type !== 'between', style: dropBetweenStyle })));
    };
    return DropIndicator;
}(React.Component));
exports.DropIndicator = DropIndicator;
