/* Copyright (c) 2012-2013 Casewise Systems Ltd (UK) - All rights reserved */

/*global cwAPI, jQuery */
(function(cwApi, $) {
  "use strict";
  if (cwApi && cwApi.cwLayouts && cwApi.cwLayouts.cwLayoutTimeline) {
    var cwLayoutTimeline = cwApi.cwLayouts.cwLayoutTimeline;
  } else {
    // constructor
    var cwLayoutTimeline = function(options, viewSchema) {
      cwApi.extend(this, cwApi.cwLayouts.CwLayout, options, viewSchema); // heritage
      this.viewSchema = viewSchema;
      cwApi.registerLayoutForJSActions(this); // execute le applyJavaScript après drawAssociations
      this.construct(options);
    };
  }

  cwLayoutTimeline.prototype.construct = function(options) {
    try {
      this.config = JSON.parse(this.options.CustomOptions["configuration"]);
    } catch (e) {
      console.log(e);
      this.config = {
        nodes: {
          project_356153175: {
            isLane: true,
            steps: [],
          },
          projet_20027_523091472: {
            isLane: true,
            steps: [{ start: "startdate", end: "enddate", cds: "coucou : {name}", type: "range" }],
          },
        },
      };
    }

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
    this.stack = this.options.CustomOptions["stack"];
    if (this.stack === undefined) this.stack = false;
    this.getOption("hidden-nodes", "hiddenNodes", ",");
    this.getOption("merged-nodes", "mergedNodes", ",");
    this.getOption("node-as-timeElement", "nodeAsTimeElement", ",");
    this.getOption("complementaryNode", "complementaryNode", ",");
    this.steps = JSON.parse(this.options.CustomOptions["steps"]);
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
    return cwAPI.customLibs.utils.getItemDisplayString(this.viewSchema.ViewName, item);
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

  cwLayoutTimeline.prototype.simplify = function(child, father) {
    var childrenArray = [];
    var filterArray = [];
    var filtersGroup = [];
    var filteredFields = [];
    var groupFilter = {};
    var element, filterElement, groupFilter;
    var self = this;

    if (child && child.associations) {
      this.parseNode(child, function(nextChild, associationNode) {
        let config = self.config.nodes[nextChild.nodeID];
        if (self.hiddenNodes.indexOf(associationNode) !== -1) {
          // jumpAndMerge when hidden
          childrenArray = childrenArray.concat(self.simplify(nextChild, father));
        } else {
          // adding regular node
          element = {};
          element.content = self.getItemDisplayString(nextChild);
          element.sort = nextChild.name;

          if (father) element.id = nextChild.object_id + "_" + nextChild.objectTypeScriptName + "_" + father.id;
          else element.id = nextChild.object_id + "_" + nextChild.objectTypeScriptName;
          element.objectTypeScriptName = nextChild.objectTypeScriptName;
          if (config && config.isLane === true) {
            element.group = father;
            element.children = self.simplify(nextChild, element);
            if (element.children.length > 0) {
              element.nestedGroups = [];
              for (var k = 0; k < element.children.length; k += 1) {
                element.nestedGroups.push(element.children[k].id);
              }
            }
            self.timelineGroups.add(element);
            childrenArray.push(element);
            self.createTimelineItem(nextChild, element, element.id, config);
          } else {
            self.createTimelineItem(nextChild, element, father.id, config);
          }
        }
      });
    }
    return childrenArray;
  };

  cwLayoutTimeline.prototype.createTimelineItem = function(item, elem, group, config) {
    var self = this;
    if (config === undefined) return;
    config.steps.forEach(function(step) {
      let timelineItem = {};
      timelineItem.id = "timeElement_" + elem.id;
      timelineItem.group = group;
      timelineItem.content = cwAPI.customLibs.utils.getCustomDisplayString(step.cds, item);
      timelineItem.start = item.properties[step.start];
      timelineItem.end = item.properties[step.end];
      timelineItem.type = step.type;
      self.timelineItems.add(timelineItem);
    });
  };

  // obligatoire appeler par le system
  cwLayoutTimeline.prototype.drawAssociations = function(output, associationTitleText, object) {
    var cpyObj = $.extend({}, object);
    var assoNode = {};

    this.originalObject = $.extend({}, object);
    var simplifyObject,
      i,
      assoNode = {},
      isData = false;
    // keep the node of the layout
    assoNode[this.mmNode.NodeID] = object.associations[this.mmNode.NodeID];
    // complementary node
    this.complementaryNode.forEach(function(nodeID) {
      if (object.associations[nodeID]) {
        assoNode[nodeID] = object.associations[nodeID];
      }
    });
    cpyObj.nodeID = this.nodeID;
    cpyObj.associations = assoNode;

    this.JSONobjects = cpyObj;
    output.push('<div class="cw-visible cwLayoutTimelineButtons" id="cwLayoutTimelineButtons_' + this.nodeID + '">');
    if (cwApi.currentUser.PowerLevel === 1) output.push('<a class="btn page-action no-text fa fa-cogs" id="cwTimelineButtonsExpertMode' + this.nodeID + '" title="Expert mode"></i></a>');
    output.push('<a class="btn page-action no-text fa fa-arrows-alt" id="cwTimelineButtonsFit' + this.nodeID + '" title="' + $.i18n.prop("deDiagramOptionsButtonFitToScreen") + '"></a>');
    output.push('<a class="btn page-action no-text fa fa-download" id="cwTimelineButtonsDownload' + this.nodeID + '" title="' + $.i18n.prop("download") + '"></a>');
    output.push("</div>");
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
        libToLoad = ["modules/vis/vis.min.js"];
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

  // Expert Mode Button Event
  cwLayoutTimeline.prototype.enableExpertModeButtonEvent = function() {
    var expertButton = document.getElementById("cwTimelineButtonsExpertMode" + this.nodeID);
    if (expertButton) {
      expertButton.addEventListener("click", this.manageExpertMode.bind(this));
    }
  };

  // Building network
  cwLayoutTimeline.prototype.createTimeline = function() {
    this.timelineGroups = new vis.DataSet();
    this.timelineItems = new vis.DataSet();
    this.simplify(this.JSONobjects, null);
    this.enableExpertModeButtonEvent();
    var timeLineContainer = document.getElementById("cwLayoutTimeline_" + this.nodeID);

    // set height
    var titleReact = document.querySelector("#cw-top-bar").getBoundingClientRect();
    var topBarReact = document.querySelector(".page-top").getBoundingClientRect();
    var canvaHeight = window.innerHeight - titleReact.height - topBarReact.height;

    function customOrder(a, b) {
      // order by id
      return b.start - a.start;
    }

    var options = {
      groupOrder: "sort", // groupOrder can be a property name or a sorting function,
      stack: this.stack,
      stackSubgroups: this.stack,
      orientation: "both",
      verticalScroll: true,
      maxHeight: canvaHeight,
    };

    if (this.stack == true) options.order = customOrder;

    this.timeLineUI = new vis.Timeline(timeLineContainer, this.timelineItems, this.timelineGroups, options);

    // Set first time bar
    this.timeLineUI.addCustomTime(new Date(), "customTimeBar");

    this.timeLineUI.on("timechanged", function(properties) {
      var timeBar = document.getElementsByClassName(properties.id)[0];
      if (timeBar.childElementCount > 1) timeBar.removeChild(timeBar.lastChild);
      var div = document.createElement("div");
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
})(cwAPI, jQuery);
