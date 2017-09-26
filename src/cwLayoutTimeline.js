/* Copyright (c) 2012-2013 Casewise Systems Ltd (UK) - All rights reserved */



/*global cwAPI, jQuery */
(function (cwApi, $) {
    "use strict";
    // constructor
    var cwLayoutTimeline = function (options, viewSchema) {
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
        this.multiLineCount = this.options.CustomOptions['multiLineCount'];
        this.getspecificGroupList(this.options.CustomOptions['specificGroup']);        
        this.getPopOutList(this.options.CustomOptions['popOutList']);
        this.getHiddenNodeList(this.options.CustomOptions['hidden-nodes']);

        this.timelineGroups = new vis.DataSet();
        this.timelineItems = new vis.DataSet();


        this.steps = {
            "step1" : {
                "name" : "step1",
                "start" : "WHENCREATED",
                "end" : "GOLIVEDATE"
            },
            "step2" : {
                "name" : "step2",
                "start" : "GOLIVEDATE",
                "end" : "ENDDATE"
            }
        };
    };


    cwLayoutTimeline.prototype.getPopOutList = function(options) {
        if(options) {
            var optionList = options.split("#");
            var optionSplit;

            for (var i = 0; i < optionList.length; i += 1) {
                if(optionList[i] !== "") {
                    var optionSplit = optionList[i].split(",");
                    this.popOut[optionSplit[0]] = optionSplit[1];
                }
            }
        }
    };

    cwLayoutTimeline.prototype.getGroupToSelectOnStart = function(options) {
        if(options) {
            this.groupToSelectOnStart = options.split(",");
        }
    };

    cwLayoutTimeline.prototype.getdirectionList = function(options) {
        if(options) {
            var optionList = options.split("#");
            var optionSplit;

            for (var i = 0; i < optionList.length; i += 1) {
                if(optionList[i] !== "") {
                    var optionSplit = optionList[i].split(",");
                    this.directionList[optionSplit[0]] = optionSplit[1];
                }
            }
        }
    };

    cwLayoutTimeline.prototype.getspecificGroupList = function(options) {
        if(options) {
            var optionList = options.split("#");
            var optionSplit;

            for (var i = 0; i < optionList.length; i += 1) {
                if(optionList[i] !== "") {
                    var optionSplit = optionList[i].split(",");
                    this.specificGroup[optionSplit[0]] = optionSplit[1];
                }
            }
        }
    };

    cwLayoutTimeline.prototype.getHiddenNodeList = function(options) {
        if(options) {

            var optionList = options.split(",");
            var optionSplit;
            for (var i = 0; i < optionList.length; i += 1) {
                if(optionList[i] !== "") {
                    this.hiddenNodes.push(optionList[i]);
                }
            }
        }
    };


    cwLayoutTimeline.prototype.getItemDisplayString = function(item){
        var l, getDisplayStringFromLayout = function(layout){
            return layout.displayProperty.getDisplayString(item);
        };
        if (item.nodeID === this.nodeID){
            return this.displayProperty.getDisplayString(item);
        }
        if (!this.layoutsByNodeId.hasOwnProperty(item.nodeID)){
            if (this.viewSchema.NodesByID.hasOwnProperty(item.nodeID)){
                var layoutOptions = this.viewSchema.NodesByID[item.nodeID].LayoutOptions;
                this.layoutsByNodeId[item.nodeID] = new cwApi.cwLayouts[item.layoutName](layoutOptions, this.viewSchema);
            } else {
                return item.name;
            }
        }
        return getDisplayStringFromLayout(this.layoutsByNodeId[item.nodeID]);
    };

    cwLayoutTimeline.prototype.simplify = function (child,father,hiddenNode) {
        var childrenArray = [];
        var filterArray = [];
        var filtersGroup = [];
        var filteredFields = [];
        var groupFilter = {};
        var element,filterElement,groupFilter;
        var nextChild;
        var self = this;
        for (var associationNode in child.associations) {
            if (child.associations.hasOwnProperty(associationNode)) {
                for (var i = 0; i < child.associations[associationNode].length; i += 1) {
                    nextChild = child.associations[associationNode][i];
                    if(this.hiddenNodes.indexOf(associationNode) !== -1) { // jumpAndMerge when hidden
                        childrenArray = childrenArray.concat(this.simplify(nextChild,father,true));
                    } else { // adding regular node
                        element = {}; 
                        element.content = cwAPI.getItemLinkWithName(nextChild);//this.multiLine(this.getItemDisplayString(nextChild),this.multiLineCount);
                        element.id = nextChild.object_id + "_" + nextChild.objectTypeScriptName;
                        element.objectTypeScriptName = nextChild.objectTypeScriptName;
                        element.children = this.simplify(nextChild,element);
                        element.nestedGroups = [];
                        for (var k = 0; k < element.children.length; k += 1) {
                            nestedGroups.push(element.children[k].id);
                        }
                        childrenArray.push(element);  
                        this.timelineGroups.add(element);
                        this.createTimelineItems(nextChild,element.id);
                    }
                }
            } 
        }

        return childrenArray;
    };


    cwLayoutTimeline.prototype.createTimelineItems = function(object,id) {
        var s,step,timelineItem = {};
        for(s in this.steps) {
            if (this.steps.hasOwnProperty(s)) {
                step = this.steps[s];
                timelineItem.id = id + "_" + step.name;
                timelineItem.group = id;
                timelineItem.content = step.name;
                if(object.properties[step.start.toLowerCase()]) {
                    timelineItem.start = object.properties[step.start.toLowerCase()];

                    if(object.properties[step.end.toLowerCase()]) {
                        timelineItem.end = object.properties[step.end.toLowerCase()];
                    } else {
                        timelineItem.end = new Date();            
                    }           
                    this.timelineItems.add(timelineItem);
                }
            }
        }
    };


    cwLayoutTimeline.prototype.multiLine = function(name,size) {
        if(size !== "" && size > 0) {
            var nameSplit = name.split(" "); 
            var carry = 0;
            var multiLineName = "";
            for (var i = 0; i < nameSplit.length -1; i += 1) {
                if(nameSplit[i].length > size || carry + nameSplit[i].length > size) {
                    multiLineName += nameSplit[i] + "\n";
                    carry = 0;
                } else {
                    carry += nameSplit[i].length + 1;
                    multiLineName += nameSplit[i] + " ";
                }
            }
            multiLineName = multiLineName + nameSplit[nameSplit.length - 1];

            return multiLineName ;            
        } else {
            return name;
        }


    };


    // obligatoire appeler par le system
    cwLayoutTimeline.prototype.drawAssociations = function (output, associationTitleText, object) {
        this.simplify(object);
        output.push('<div id="cwLayoutTimeline_' + this.nodeID + '"></div>');
    };


    cwLayoutTimeline.prototype.applyJavaScript = function () {
        if(this.init) {
            this.init = false;
            var self = this;
            var libToLoad = [];

            if(cwAPI.isDebugMode() === true) {
                self.createTimeline();
            } else {
                libToLoad = ['modules/vis/vis.min.js'];
                // AsyncLoad
                cwApi.customLibs.aSyncLayoutLoader.loadUrls(libToLoad,function(error){
                    if(error === null) {
                        self.createTimeline();     
                    } else {
                        cwAPI.Log.Error(error);
                    }
                });
            }
        }
    };


// Building network
    cwLayoutTimeline.prototype.createTimeline = function () {  

        var timeLineContainer = document.getElementById("cwLayoutTimeline_" + this.nodeID);
        // initialize your network!/*# sourceMappingURL=bootstrap.min.css.map */

        var canvaHeight  = window.innerHeight - document.getElementsByClassName("page-content")[0].offsetHeight - document.getElementsByClassName("page-title")[0].offsetHeight;

        var options = {
            groupOrder: 'content',  // groupOrder can be a property name or a sorting function, 
            stack: false,
            orientation: 'both',
            verticalScroll: true,
            maxHeight: canvaHeight
        };
        this.timeLineUI = new vis.Timeline(timeLineContainer, this.timelineItems, this.timelineGroups,options);


        // Set first time bar
        this.timeLineUI.addCustomTime(new Date(), 'customTimeBar');

        this.timeLineUI.on('timechanged', function (properties) {
            var timeBar = document.getElementsByClassName(properties.id)[0];
            if(timeBar.childElementCount > 1) timeBar.removeChild(timeBar.lastChild);
            var div = document.createElement('div');
            div.innerText = properties.time;
            timeBar.append(div);
        });

    };

    cwLayoutTimeline.prototype.lookForObjects = function (id,scriptname,child) {
        var childrenArray = [];
        var element;
        var nextChild;
        if(child.objectTypeScriptName === scriptname && child.object_id == id) {
            return child;
        }
        for (var associationNode in child.associations) {
            if (child.associations.hasOwnProperty(associationNode)) {
                for (var i = 0; i < child.associations[associationNode].length; i += 1) {
                    nextChild = child.associations[associationNode][i];
                    element = this.lookForObjects(id,scriptname,nextChild);
                    if(element !== null) {
                        return element;
                    } 
                }
            }
        }
        return null;
    };


    cwLayoutTimeline.prototype.openObjectPage = function(id,scriptname) {
        var object = this.lookForObjects(id,scriptname,this.originalObject);
        if(object) {
            location.href = this.singleLinkMethod(scriptname, object);
        }
    };

    cwLayoutTimeline.prototype.openPopOut = function(id,scriptname) {

        var object = this.lookForObjects(id,scriptname,this.originalObject);
        if(this.popOut[scriptname]) {
            cwApi.cwDiagramPopoutHelper.openDiagramPopout(object,this.popOut[scriptname]);
        }
    };



    cwApi.cwLayouts.cwLayoutTimeline = cwLayoutTimeline;
}(cwAPI, jQuery));