/* Copyright (c) 2012-2013 Casewise Systems Ltd (UK) - All rights reserved */



/*global cwAPI, jQuery */
(function(cwApi, $) {
    "use strict";
    // constructor
    var cwLayoutTimeline = function(options, viewSchema) {
        cwApi.extend(this, cwApi.cwLayouts.CwLayout, options, viewSchema); // heritage
        cwApi.registerLayoutForJSActions(this); // execute le applyJavaScript après drawAssociations

        this.hiddenNodes = [];
        this.externalFilters = [];
        this.nodeFiltered = [];
        this.popOut = [];
        this.specificGroup = [];
        this.directionList = [];
        this.groupToSelectOnStart = [];
        this.objects = {};
        this.layoutsByNodeId = {};
        this.init = true;
        this.stack = this.options.CustomOptions['stack'];
        if (this.stack === undefined) this.stack = false;
        this.multiLineCount = this.options.CustomOptions['multiLineCount'];
        this.getOption('hidden-nodes', 'hiddenNodes', ',');
        this.getOption('merged-nodes', 'mergedNodes', ',');
        this.getOption('node-as-timeElement', 'nodeAsTimeElement', ',');
        this.getOption('complementaryNode','complementaryNode',',');
        this.steps = JSON.parse(this.options.CustomOptions['steps']);
    };


    cwLayoutTimeline.prototype.getOption = function(options, name, splitter) {
        options = this.options.CustomOptions[options];
        this[name] = [];
        if (options) {
            var optionList = options.split(splitter);
            var optionSplit;
            for (var i = 0; i < optionList.length; i += 1) {
                if (optionList[i] !== "") {
                    this[name].push(optionList[i]);
                }
            }
        }
    };

    cwLayoutTimeline.prototype.getItemDisplayString = function(item) {
        var l, getDisplayStringFromLayout = function(layout) {
            return layout.displayProperty.getDisplayString(item);
        };
        if (item.nodeID === this.nodeID) {
            return this.displayProperty.getDisplayString(item);
        }
        if (!this.layoutsByNodeId.hasOwnProperty(item.nodeID)) {
            if (this.viewSchema.NodesByID.hasOwnProperty(item.nodeID)) {
                var layoutOptions = this.viewSchema.NodesByID[item.nodeID].LayoutOptions;
                this.layoutsByNodeId[item.nodeID] = new cwApi.cwLayouts[item.layoutName](layoutOptions, this.viewSchema);
            } else {
                return item.name;
            }
        }
        return getDisplayStringFromLayout(this.layoutsByNodeId[item.nodeID]);
    };

    cwLayoutTimeline.prototype.parseNode = function(child, callback) {
        for (var associationNode in child.associations) {
            if (child.associations.hasOwnProperty(associationNode)) {
                for (var i = 0; i < child.associations[associationNode].length; i += 1) {
                    var nextChild = child.associations[associationNode][i];
                    callback(nextChild, associationNode);
                }
            }
        }
    };


    cwLayoutTimeline.prototype.simplify = function(child, fatherID) {
        var childrenArray = [];
        var filterArray = [];
        var filtersGroup = [];
        var filteredFields = [];
        var groupFilter = {};
        var element, filterElement, groupFilter;
        var nextChild;
        var self = this;

        this.parseNode(child, function(nextChild, associationNode) {
            if (self.hiddenNodes.indexOf(associationNode) !== -1) { // jumpAndMerge when hidden
                childrenArray = childrenArray.concat(self.simplify(nextChild, fatherID));
            } else { // adding regular node
                element = {};
                element.content = cwAPI.getItemLinkWithName(nextChild).replace(nextChild.name, self.multiLine(self.getItemDisplayString(nextChild), self.multiLineCount));
                element.sort = nextChild.name;
                element.subgroupStack = self.stack;
                element.stack = self.stack;

                if (fatherID) element.id = nextChild.object_id + "_" + nextChild.objectTypeScriptName + "_" + fatherID;
                else element.id = nextChild.object_id + "_" + nextChild.objectTypeScriptName;
                element.objectTypeScriptName = nextChild.objectTypeScriptName;
                if (self.mergedNodes.indexOf(associationNode) !== -1) {
                    element.nestedGroups = [];
                    self.createTimelineItemsOfChildrens(nextChild, element);
                } else if (self.nodeAsTimeElement.indexOf(associationNode) === -1) {
                    element.children = self.simplify(nextChild, element.id);
                    if (element.children.length > 0) {
                        element.nestedGroups = [];
                        for (var k = 0; k < element.children.length; k += 1) {
                            element.nestedGroups.push(element.children[k].id);
                        }
                    }
                }

                childrenArray.push(element);
                if (self.timelineGroups.getIds().indexOf(element.id) === -1) {
                    self.timelineGroups.add(element);
                    self.createTimelineItems(nextChild, element.id, associationNode);
                }

            }
        });
        return childrenArray;
    };

    cwLayoutTimeline.prototype.pushTimeItem = function(timelineItem, child, step) {
        timelineItem.style = step.style;
        if (step.title) timelineItem.title = step.title;
        if (child.properties[step.start.toLowerCase()] && Date.parse(child.properties[step.start.toLowerCase()]) > 0) {
            timelineItem.start = new Date(child.properties[step.start.toLowerCase()]);

            if (child.properties[step.end.toLowerCase()] && Date.parse(child.properties[step.end.toLowerCase()]) > 0) {
                timelineItem.end = new Date(child.properties[step.end.toLowerCase()]);
            } else {
                timelineItem.end = new Date();
            }

            timelineItem.title = timelineItem.content + "(" + moment(timelineItem.start).format("DD/MM/YYYY") + "=>" + moment(timelineItem.end).format("DD/MM/YYYY") + ")";

            if (this.timelineItems.getIds().indexOf(timelineItem.id) === -1) {
                this.timelineItems.add(timelineItem);
            }
        }
    };

    cwLayoutTimeline.prototype.createTimelineItemsOfChildrens = function(child, element) {
        var s, step, nextChild, timelineItem, nestedElement;
        for (var associationNode in child.associations) {
            if (child.associations.hasOwnProperty(associationNode)) {
                if (this.steps.hasOwnProperty(associationNode)) {
                    for (s in this.steps[associationNode]) {
                        step = this.steps[associationNode][s];
                        nestedElement = {};
                        nestedElement.content = step.name;
                        nestedElement.id = element.id + "_" + step.name;
                        this.timelineGroups.add(nestedElement);
                        element.nestedGroups.push(nestedElement.id);

                        if (this.steps[associationNode].hasOwnProperty(s)) {
                            for (var i = 0; i < child.associations[associationNode].length; i += 1) {
                                nextChild = child.associations[associationNode][i];
                                timelineItem = {};
                                timelineItem.id = element.id + "_" + step.name + "#" + nextChild.objectTypeScriptName + "_" + nextChild.object_id;
                                timelineItem.group = nestedElement.id;
                                timelineItem.content = cwAPI.getItemLinkWithName(nextChild).replace(nextChild.name, this.multiLine(this.getItemDisplayString(nextChild), this.multiLineCount));
                                this.pushTimeItem(timelineItem,nextChild,step);
                            }
                        }
                    }
                }
            }
        }

    };



    cwLayoutTimeline.prototype.createTimelineItems = function(child, id, nodeID) {
        var nextChild, d, s, step, timelineItem = {},
            self = this;
        if (this.nodeAsTimeElement.indexOf(nodeID) !== -1) { // child object are the time entry
            this.parseNode(child, function(nextChild, associationNode) {
                if (self.steps.hasOwnProperty(associationNode)) {
                    for (s in self.steps[associationNode]) {
                        if (self.steps[associationNode].hasOwnProperty(s)) {
                            step = self.steps[associationNode][s];
                            timelineItem = {};
                            timelineItem.id = id + "_" + nextChild.name;
                            timelineItem.group = id;
                            timelineItem.content = cwAPI.getItemLinkWithName(nextChild).replace(nextChild.name,self.getItemDisplayString(nextChild));
                            self.pushTimeItem(timelineItem,nextChild,step);

                        }
                    }
                }
                self.createTimelineItems(nextChild, id, nodeID);
            });
        } else if (this.steps.hasOwnProperty(nodeID)) {
            for (s in this.steps[nodeID]) {
                if (this.steps[nodeID].hasOwnProperty(s)) {
                    step = this.steps[nodeID][s];
                    timelineItem = {};
                    timelineItem.id = id + "_" + step.name;
                    timelineItem.group = id;
                    timelineItem.content = step.name;
                    self.pushTimeItem(timelineItem,child,step);
                }
            }
        }
    };


    cwLayoutTimeline.prototype.multiLine = function(name, size) {
        if (size !== "" && size > 0) {
            var nameSplit = name.split(" ");
            var carry = 0;
            var multiLineName = "";
            for (var i = 0; i < nameSplit.length - 1; i += 1) {
                if (nameSplit[i].length > size || carry + nameSplit[i].length > size) {
                    multiLineName += nameSplit[i] + "\n";
                    carry = 0;
                } else {
                    carry += nameSplit[i].length + 1;
                    multiLineName += nameSplit[i] + " ";
                }
            }
            multiLineName = multiLineName + nameSplit[nameSplit.length - 1];

            return multiLineName;
        } else {
            return name;
        }


    };


    // obligatoire appeler par le system
    cwLayoutTimeline.prototype.drawAssociations = function(output, associationTitleText, object) {
        var cpyObj = $.extend({}, object);
        var assoNode = {};

        this.originalObject  = $.extend({}, object);
        var simplifyObject, i, assoNode = {} , isData = false;
        // keep the node of the layout
        assoNode[this.mmNode.NodeID] = object.associations[this.mmNode.NodeID];
        // complementary node
        this.complementaryNode.forEach(function(nodeID) {
            if(object.associations[nodeID]) {
                assoNode[nodeID] = object.associations[nodeID];
            }
        });

        cpyObj.associations = assoNode;     

        this.JSONobjects = cpyObj;
        output.push('<div class="cw-visible" id="cwLayoutTimeline_' + this.nodeID + '"></div>');
    };


    cwLayoutTimeline.prototype.applyJavaScript = function() {
        if (this.init) {
            this.init = false;
            var self = this;
            var libToLoad = [];

            if (cwAPI.isDebugMode() === true) {
                self.createTimeline();
            } else {
                libToLoad = ['modules/vis/vis.min.js'];
                // AsyncLoad
                cwApi.customLibs.aSyncLayoutLoader.loadUrls(libToLoad, function(error) {
                    if (error === null) {
                        self.createTimeline();
                    } else {
                        cwAPI.Log.Error(error);
                    }
                });
            }
        }
    };


    // Building network
    cwLayoutTimeline.prototype.createTimeline = function() {

        this.timelineGroups = new vis.DataSet();
        this.timelineItems = new vis.DataSet();
        this.simplify(this.JSONobjects, null);

        var timeLineContainer = document.getElementById("cwLayoutTimeline_" + this.nodeID);
        // initialize your network!/*# sourceMappingURL=bootstrap.min.css.map */

        var canvaHeight = window.innerHeight - document.getElementsByClassName("page-content")[0].offsetHeight - document.getElementsByClassName("page-title")[0].offsetHeight;


        function customOrder(a, b) {
            // order by id
            return b.start - a.start;
        }

        var options = {
            groupOrder: 'sort', // groupOrder can be a property name or a sorting function, 
            stack: this.stack,
            stackSubgroups: this.stack,
            orientation: 'both',
            verticalScroll: true,
            maxHeight: canvaHeight
        };

        if (this.stack == true) options.order = customOrder;

        this.timeLineUI = new vis.Timeline(timeLineContainer, this.timelineItems, this.timelineGroups, options);


        // Set first time bar
        this.timeLineUI.addCustomTime(new Date(), 'customTimeBar');

        this.timeLineUI.on('timechanged', function(properties) {
            var timeBar = document.getElementsByClassName(properties.id)[0];
            if (timeBar.childElementCount > 1) timeBar.removeChild(timeBar.lastChild);
            var div = document.createElement('div');
            div.innerText = properties.time;
            timeBar.append(div);
        });

    };

    cwLayoutTimeline.prototype.lookForObjects = function(id, scriptname, child) {
        var childrenArray = [];
        var element;
        var nextChild;
        if (child.objectTypeScriptName === scriptname && child.object_id == id) {
            return child;
        }
        for (var associationNode in child.associations) {
            if (child.associations.hasOwnProperty(associationNode)) {
                for (var i = 0; i < child.associations[associationNode].length; i += 1) {
                    nextChild = child.associations[associationNode][i];
                    element = this.lookForObjects(id, scriptname, nextChild);
                    if (element !== null) {
                        return element;
                    }
                }
            }
        }
        return null;
    };


    cwLayoutTimeline.prototype.openObjectPage = function(id, scriptname) {
        var object = this.lookForObjects(id, scriptname, this.originalObject);
        if (object) {
            location.href = this.singleLinkMethod(scriptname, object);
        }
    };

    cwLayoutTimeline.prototype.openPopOut = function(id, scriptname) {

        var object = this.lookForObjects(id, scriptname, this.originalObject);
        if (this.popOut[scriptname]) {
            cwApi.cwDiagramPopoutHelper.openDiagramPopout(object, this.popOut[scriptname]);
        }
    };



    cwApi.cwLayouts.cwLayoutTimeline = cwLayoutTimeline;
}(cwAPI, jQuery));