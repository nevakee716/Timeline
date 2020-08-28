/* Copyright (c) 2012-2013 Casewise Systems Ltd (UK) - All rights reserved */

/*global cwAPI, jQuery */
(function (cwApi, $) {
  "use strict";
  if (cwApi && cwApi.cwLayouts && cwApi.cwLayouts.cwLayoutTimeline) {
    var cwLayoutTimeline = cwApi.cwLayouts.cwLayoutTimeline;
  } else {
    // constructor
    var cwLayoutTimeline = function (options, viewSchema) {
      cwApi.extend(this, cwApi.cwLayouts.CwLayout, options, viewSchema); // heritage
      this.viewSchema = viewSchema;
      cwApi.registerLayoutForJSActions(this); // execute le applyJavaScript après drawAssociations
      this.construct(options);
    };
  }

  cwLayoutTimeline.prototype.construct = function (options) {
    try {
      this.config = JSON.parse(this.options.CustomOptions["configuration"]);
    } catch (e) {
      console.log(e);
    }
  };

  cwLayoutTimeline.prototype.getOption = function (options, name, splitter) {
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

  cwLayoutTimeline.prototype.getItemDisplayString = function (item) {
    return cwAPI.customLibs.utils.getItemDisplayString(this.viewSchema.ViewName, item);
  };

  cwLayoutTimeline.prototype.parseNode = function (child, callback) {
    for (var associationNode in child.associations) {
      if (child.associations.hasOwnProperty(associationNode)) {
        for (var i = 0; i < child.associations[associationNode].length; i += 1) {
          var nextChild = child.associations[associationNode][i];
          callback(nextChild, associationNode);
        }
      }
    }
  };

  cwLayoutTimeline.prototype.simplify = function (child, father, level) {
    var childrenArray = [];
    var filterArray = [];
    var filtersGroup = [];
    var filteredFields = [];
    var groupFilter = {};
    var element, filterElement, groupFilter;
    var self = this;

    if (child && child.associations) {
      this.parseNode(child, function (nextChild, associationNode) {
        let config = self.config.nodes[nextChild.nodeID];
        if (config === undefined) config = {};
        if (config.isHidden) {
          // jumpAndMerge when hidden
          childrenArray = childrenArray.concat(self.simplify(nextChild, father, level));
        } else {
          // adding regular node
          element = {};
          element.content = self.getItemDisplayString(nextChild);
          element.sort = nextChild.name;
          element.treeLevel = level;
          element.steps = [];
          element.childrenSteps = [];
          element.children = [];

          if (father) element.id = nextChild.object_id + "_" + nextChild.objectTypeScriptName + "_" + father.id;
          else element.id = nextChild.object_id + "_" + nextChild.objectTypeScriptName;
          element.objectTypeScriptName = nextChild.objectTypeScriptName;

          if (config && config.isLane === true) {
            if (config.sortProp) element.sort = nextChild.properties[config.sortProp];
            if (config.isCollapse) element.showNested = false;
            element.group = father;
            if (config.specificLane === "" || config.specificLane === undefined) element.children = self.simplify(nextChild, element, level + 1);
            if (element.children.length > 0) {
              element.nestedGroups = [];
              for (var k = 0; k < element.children.length; k += 1) {
                element.nestedGroups.push(element.children[k].id);
              }
            }

            if (config && config.specificLane != "" && config.specificLane) {
              var element2 = {};
              element2.content = self.getItemDisplayString(nextChild);
              element2.sort = nextChild.name;
              element2.treeLevel = level + 1;
              element2.steps = [];
              element2.childrenSteps = [];
              element2.children = [];
              if (config.isCollapse) element2.showNested = false;
              element2.id = element.id + "_" + config.specificLane;
              element2.group = element.id;
              element2.content = config.specificLane;
              element2.children = self.simplify(nextChild, element2, level + 2);
              if (element2.children.length > 0) {
                element2.nestedGroups = [];
                for (var k = 0; k < element2.children.length; k += 1) {
                  element2.nestedGroups.push(element2.children[k].id);
                }
              }
              if (element2.childrenSteps.length > 0) {
                if (self.timelineGroups.get(element2.id) === null) self.timelineGroups.add(element2);

                if (element.nestedGroups === undefined) element.nestedGroups = [];
                element.nestedGroups.push(element2.id);
              }
            }

            if (self.timelineGroups.get(element.id) === null) self.timelineGroups.add(element);
            self.createTimelineItem(nextChild, element, element.id, config, level);
            childrenArray.push(element);
          } else {
            //father.children = self.simplify(nextChild, father, level);
            let arr = [];

            self.createTimelineItem(nextChild, element, father.id, config, level);
            arr = self.simplify(nextChild, father, level);

            childrenArray = childrenArray.concat(arr);
            if (father && father.childrenSteps) father.childrenSteps = father.childrenSteps.concat(element.steps);
          }
        }
      });
    }
    return childrenArray;
  };

  cwLayoutTimeline.prototype.getEndDate = function (config, item, elem, level) {
    if (item.properties[config.endProp] == "1899-12-30T00:00:00") {
      if (config.endPropEmptyValue === "today") return new Date();
      else if (config.endPropEmptyValue === "today5y") return new Date(new Date().setFullYear(new Date().getFullYear() + 5));
      else return null;
    }
    let max = new Date(item.properties[config.endProp]);
    if (config.extendEndDate) {
      //endate need to be check depend of childrenStep and step of children
      elem.children.forEach(function (c) {
        c.steps.forEach(function (s) {
          if (s.end > max && config.extendEndDateSteps.indexOf(s.cid) !== -1) max = s.end;
        });
      });
      elem.childrenSteps.forEach(function (s) {
        if (s.end > max && config.extendEndDateSteps.indexOf(s.cid) !== -1) max = s.end;
      });
    }
    if (this.maxDate === undefined || max > this.maxDate) this.maxDate = max;
    return max;
  };

  cwLayoutTimeline.prototype.createTimelineItem = function (item, elem, group, config, level) {
    var self = this;
    if (config === undefined) return;
    for (let step in config.steps) {
      if (
        config.steps.hasOwnProperty(step) &&
        config.steps[step].startProp &&
        item.properties[config.steps[step].startProp] != "1899-12-30T00:00:00" &&
        (config.steps[step].endProp || config.steps[step].type === "point" || config.steps[step].type === "box")
      ) {
        let timelineItem = {};
        let displayStep = true;
        timelineItem.id = "timeElement_" + elem.id + "_" + step;
        timelineItem.group = group;
        if (config.steps[step].cds === "" || config.steps[step].cds == undefined) {
          timelineItem.content = "";
        } else {
          timelineItem.content = cwAPI.customLibs.utils.getCustomDisplayString(config.steps[step].cds, item);
        }
        timelineItem.cid = step;
        timelineItem.start = new Date(item.properties[config.steps[step].startProp]);
        if (this.minDate === undefined || timelineItem.start < this.minDate) this.minDate = timelineItem.start;

        if (config.steps[step].sortProp) timelineItem.sort = item.properties[config.sortProp];
        else timelineItem.sort = timelineItem.start;
        if (config.steps[step].endProp) {
          timelineItem.end = this.getEndDate(config.steps[step], item, elem);
          if (timelineItem.end === null) displayStep = false;
        }

        if (config.steps[step].tooltip !== undefined && config.steps[step].tooltip !== "") {
          timelineItem.title = cwAPI.customLibs.utils.getCustomDisplayString(config.steps[step].tooltip + "<@@><##>", item);
        }

        // set colours
        if (
          config.steps[step].enableColorMapping &&
          cwApi.customLibs &&
          cwApi.customLibs.utils &&
          cwApi.customLibs.utils.getCustomLayoutConfiguration
        ) {
          let CLCconfig = cwApi.customLibs.utils.getCustomLayoutConfiguration("property");
          if (
            CLCconfig.hasOwnProperty(item.objectTypeScriptName) &&
            CLCconfig[item.objectTypeScriptName].hasOwnProperty(config.steps[step].colorMapProp)
          ) {
            CLCconfig = CLCconfig[item.objectTypeScriptName][config.steps[step].colorMapProp];
            if (CLCconfig.hasOwnProperty(item.properties[config.steps[step].colorMapProp + "_id"])) {
              CLCconfig = CLCconfig[item.properties[config.steps[step].colorMapProp + "_id"]];
            }
          } else {
            let i = -1;
            if (item.properties[config.steps[step].colorMapProp] == cwApi.cwConfigs.UndefinedValue)
              item.properties[config.steps[step].colorMapProp] = $.i18n.prop("global_undefined");

            let o = CLCconfig.hardcoded.some(function (m) {
              i++;
              return m.value == item.properties[config.steps[step].colorMapProp];
            });
            if (o) {
              CLCconfig = CLCconfig.hardcoded[i];
            }
          }

          let bg = tinycolor(CLCconfig.iconColor);
          // while (bg.toHsl().s > 0.3) bg.desaturate(10);
          while (bg.toHsl().l < 0.85) bg.lighten(10);
          config.steps[step].backgroundColor = bg.toHexString();
          config.steps[step].textColor = CLCconfig.valueColor ? CLCconfig.valueColor : CLCconfig.iconColor;
          config.steps[step].borderColor = CLCconfig.iconColor;

          if (config.steps[step].type == "point") {
            timelineItem.content =
              '<i class="iconDotTimeline ' +
              CLCconfig.icon +
              '" style="color:' +
              CLCconfig.iconColor +
              '"aria-hidden="true"></i>' +
              timelineItem.content;
          }
        }

        // default color
        if (config.steps[step].textColor === undefined) {
          config.steps[step].textColor = "#FFFFFF";
        }
        if (config.steps[step].backgroundColor === undefined) {
          config.steps[step].backgroundColor = "#26276d";
        }
        if (config.steps[step].borderColor === undefined) {
          config.steps[step].borderColor = "#26276d";
        }

        if (config.steps[step].backgroundTransparent === undefined) {
          config.steps[step].backgroundTransparent = 100;
        }

        let t = (config.steps[step].backgroundTransparent * 255) / 100;
        t = t.toString(16);
        if (t.length === 1) t = "0" + t;
        let bColor = config.steps[step].backgroundColor + t;
        let bWidth = config.steps[step].type === "point" ? "0px" : "1px";
        timelineItem.style =
          "color: " +
          config.steps[step].textColor +
          "; background-color: " +
          bColor +
          "; border: solid " +
          bWidth +
          " " +
          config.steps[step].borderColor +
          ";";

        if (config.steps[step].type === "extbackground") {
          timelineItem.type = "background";
          timelineItem.className = "extbackground";
          //timelineItem.style = "color: " + config.steps[step].textColor + "; background-color: " + bColor + "; border: solid 1px " + config.steps[step].borderColor + ";";
          timelineItem.style =
            "color: " +
            config.steps[step].textColor +
            "; background-color: " +
            bColor +
            "; outline-offset : -1px; outline: solid 2px " +
            config.steps[step].borderColor +
            ";";
        } else if (config.steps[step].type === "extbackground2") {
          timelineItem.type = "background";
          timelineItem.className = "extbackground";
          timelineItem.style =
            "color: " +
            config.steps[step].textColor +
            "; background-color: " +
            bColor +
            "; border: solid 1px " +
            config.steps[step].borderColor +
            ";";
          //timelineItem.style = "color: " + config.steps[step].textColor + "; background-color: " + bColor + "; outline-offset : -2px; outline: solid 2px " + config.steps[step].borderColor + ";";
        } else timelineItem.type = config.steps[step].type;
        timelineItem.className = timelineItem.className + " " + level;
        if (displayStep && self.timelineItems.get(timelineItem.id) === null) {
          elem.steps.push(timelineItem);
          self.timelineItems.add(timelineItem);
        }
      }
    }
  };

  cwLayoutTimeline.prototype.manageComplementaryNode = function () {
    var assoNode = {};
    // keep the node of the layout
    assoNode[this.mmNode.NodeID] = this.originalObject.associations[this.mmNode.NodeID];
    // complementary node
    for (let associationNode in this.originalObject.associations) {
      if (
        this.originalObject.associations.hasOwnProperty(associationNode) &&
        this.config.nodes &&
        this.config.nodes[associationNode] &&
        this.config.nodes[associationNode].isComplementaryNode
      ) {
        assoNode[associationNode] = this.originalObject.associations[associationNode];
      }
    }
    this.JSONobjects.associations = assoNode;
  };

  // obligatoire appeler par le system
  cwLayoutTimeline.prototype.drawAssociations = function (output, associationTitleText, object) {
    this.originalObject = object;
    this.JSONobjects = $.extend({}, object);
    this.JSONobjects.nodeID = this.nodeID;
    this.manageComplementaryNode();

    if (cwApi.customLibs.utils === undefined || cwAPI.customLibs.utils.version === undefined || cwAPI.customLibs.utils.version < 2.4) {
      output.push("<h2> Please Install Utils library 2.4 or higher</h2>");
      return;
    }

    output.push('<div class="cw-visible cwLayoutTimelineButtons" id="cwLayoutTimelineButtons_' + this.nodeID + '">');
    if (cwApi.currentUser.PowerLevel === 1)
      output.push('<a class="btn page-action no-text fa fa-cogs" id="cwTimelineButtonsExpertMode' + this.nodeID + '" title="Expert mode"></i></a>');
    output.push(
      '<a class="btn page-action no-text fa fa-arrows-alt" id="cwTimelineButtonsFit' +
        this.nodeID +
        '" title="' +
        $.i18n.prop("deDiagramOptionsButtonFitToScreen") +
        '"></a>'
    );
    //output.push('<a class="btn page-action no-text fa fa-download" id="cwTimelineButtonsDownload' + this.nodeID + '" title="' + $.i18n.prop("download") + '"></a>');
    output.push(
      '<a class="btn page-action no-text fa fa-cubes" id="cwTimelineButtonsStack' + this.nodeID + '" title="' + $.i18n.prop("stack") + '"></a>'
    );
    output.push("</div>");
    output.push('<div class="cw-visible" id="cwLayoutTimeline_' + this.nodeID + '"></div>');
  };

  cwLayoutTimeline.prototype.applyJavaScript = function () {
    var self = this;
    var libToLoad = [];

    if (cwAPI.isDebugMode() === true) {
      self.createTimeline();
    } else {
      libToLoad = ["modules/vis/vis.min.js", "modules/jsTree/jstree.min.js"];
      // AsyncLoad
      cwApi.customLibs.aSyncLayoutLoader.loadUrls(libToLoad, function (error) {
        if (error === null) {
          self.createTimeline();
        } else {
          cwAPI.Log.Error(error);
        }
      });
    }
  };

  // Expert Mode Button Event
  cwLayoutTimeline.prototype.enableExpertModeButtonEvent = function () {
    var expertButton = document.getElementById("cwTimelineButtonsExpertMode" + this.nodeID);
    if (expertButton) {
      expertButton.addEventListener("click", this.manageExpertMode.bind(this));
    }
  };

  cwLayoutTimeline.prototype.enableStackButtonEvent = function () {
    var stackButton = document.getElementById("cwTimelineButtonsStack" + this.nodeID);
    if (stackButton) {
      stackButton.addEventListener("click", this.manageStackButton.bind(this));
    }
  };

  cwLayoutTimeline.prototype.enableFitButtonEvent = function () {
    var stackButton = document.getElementById("cwTimelineButtonsFit" + this.nodeID);
    var self = this;
    if (stackButton) {
      stackButton.addEventListener("click", function () {
        self.timeLineUI.fit();
      });
    }
  };

  // manage Expert Mode
  cwLayoutTimeline.prototype.manageStackButton = function (event) {
    function customOrder(a, b) {
      // order by id
      return a.start - b.start;
    }

    var self = this;
    let order = undefined;
    if (self.config.stack === false) {
      self.config.stack = true;
      event.target.title = $.i18n.prop("activate_stack_mode");
      event.target.classList.remove("selected");
    } else {
      self.config.stack = false;
      event.target.title = $.i18n.prop("deactivate_stack_mode");
      event.target.classList.add("selected");
    }
    this.updateTimeline();
    /*  let options = {
      //order: order,
      stack: this.config.stack,
      stackSubgroups: this.config.stack,
    };
    this.timeLineUI.setOptions(options);*/
  };

  cwLayoutTimeline.prototype.deleteCurrentTimeline = function () {
    if (this.timeLineUI && this.timeLineUI.destroy) this.timeLineUI.destroy();
    var timeLineContainer = document.getElementById("cwLayoutTimeline_" + this.nodeID);
    timeLineContainer.innerHTML = "";
  };

  cwLayoutTimeline.prototype.createTimeline = function () {
    this.enableExpertModeButtonEvent();
    this.enableStackButtonEvent();
    this.enableFitButtonEvent();

    this.getAndParseData();
    this.createVisTimeline();

    var self = this;
    $(window).resize(function () {
      self.updateTimeline();
    });
  };

  cwLayoutTimeline.prototype.updateTimeline = function () {
    this.manageComplementaryNode();
    this.getAndParseData();
    this.deleteCurrentTimeline();
    this.createVisTimeline();
  };

  // Building network
  cwLayoutTimeline.prototype.getAndParseData = function () {
    this.timelineGroups = new vis.DataSet();
    this.timelineItems = new vis.DataSet();
    this.simplify(this.JSONobjects, { id: this.nodeID }, 1);
  };

  // Building network
  cwLayoutTimeline.prototype.createVisTimeline = function () {
    var timeLineContainer = document.getElementById("cwLayoutTimeline_" + this.nodeID);
    if (!timeLineContainer) return;
    // set height
    var titleReact = document.querySelector("#cw-top-bar").getBoundingClientRect();
    var topBarReact = 52; //document.querySelector(".page-top").getBoundingClientRect();
    var canvaHeight = window.innerHeight - titleReact.height - topBarReact - 20;

    function customOrder(a, b) {
      // order by start date
      return a.start - b.start;
    }

    var options = {
      groupOrder: "sort", // groupOrder can be a property name or a sorting function,
      stack: this.config.stack,
      stackSubgroups: this.config.stack,
      groupHeightMode: "fixed",
      orientation: "top",
      verticalScroll: true,
      maxHeight: canvaHeight,
      start: this.minDate,
      end: this.maxDate,
      margin: {
        item: {
          horizontal: 0,
        },
      },
      format: {
        minorLabels: {
          millisecond: "SSS",
          second: "s",
          minute: "HH:mm",
          hour: "HH:mm",
          weekday: "ddd D",
          day: "D",
          week: "w",
          month: "MMM",
          year: "YYYY",
        },
        majorLabels: {
          millisecond: "HH:mm:ss",
          second: "D MMMM HH:mm",
          minute: "ddd D MMMM",
          hour: "ddd D MMMM",
          weekday: "MMMM YYYY",
          day: "MMMM YYYY",
          week: "MMMM YYYY",
          month: "YYYY",
          year: "",
        },
      },
    };

    if (this.config.stack === true) options.order = customOrder;
    this.timeLineUI = new vis.Timeline(timeLineContainer, this.timelineItems, this.timelineGroups, options);

    // Set first time bar
    this.timeLineUI.addCustomTime(new Date(), "customTimeBar");

    this.timeLineUI.on("timechanged", function (properties) {
      var timeBar = document.getElementsByClassName(properties.id)[0];
      if (timeBar.childElementCount > 1) timeBar.removeChild(timeBar.lastChild);
      var div = document.createElement("div");
      div.innerText = properties.time;
      timeBar.append(div);
    });

    var self = this;
    this.timeLineUI.on("changed", function () {
      let results = document.querySelectorAll(".vis-content .vis-itemset div.vis-background div.vis-group");
      let groupHeight = 0;
      for (let i = 0; i < results.length; i++) {
        let group = results[i];

        let sb = group.querySelector(".extbackground");
        if (sb && window.innerHeight > group.getBoundingClientRect().top) {
          let s = sb.className.split(" ");
          let level = parseInt(s[s.length - 1]);
          let height = group.offsetHeight;
          let maxLevel = level;
          // checking the sublevel
          for (let j = i + 1; j < results.length; j++) {
            if (!results[j].querySelector(".vis-item")) {
              let foreground = document.querySelectorAll(".vis-content .vis-itemset div.vis-foreground div.vis-group");
              if (!foreground[j - 1].querySelector(".vis-item")) break;
            }
            let sb = results[j].querySelector(".extbackground");
            if (sb) {
              let l = sb.className.split(" ");
              l = parseInt(l[l.length - 1]);
              maxLevel = Math.max(maxLevel, l);
              if (level >= l) break;
            }
            height = height + results[j].offsetHeight;
          }
          // only update if the height to not be stuck in a loop
          height = height - 2 * (level - maxLevel + 1);
          if (height != sb.offsetHeight) {
            sb.style.height = height + "px";
          }
        }
      }
    });
  };

  cwLayoutTimeline.prototype.findNextGroup = function () {};

  cwApi.cwLayouts.cwLayoutTimeline = cwLayoutTimeline;
})(cwAPI, jQuery);
