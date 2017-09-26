/* Copyright (c) 2012-2013 Casewise Systems Ltd (UK) - All rights reserved */

/*global jQuery */
(function (cwApi, $) {

    "use strict";
    // constructor
    var timeline = function (option) {
        this.groups = {};
        this.option = option;
    };

    timeline.prototype.getGroups = function (object) {
        return this.objectTypeNodes;
    };

    timeline.prototype.initialisation = function (object) {
        var i;
        if(object.hasOwnProperty("children")) {
            for (i = 0; i < object.children.length; i += 1) {
                this.addGroup(object.children[i]);
            }
        } else { // in case of index
            for (i = 0; i < object.length; i += 1) {
                this.addGroup(object[i]);
            }    
        }
    };


    timeline.prototype.addGroup = function (object) {
        if(!this.groups.hasOwnProperty(object.name)) {
            this.groups[object.name] = new cwApi.customLibs.cwLayoutNetwork.objectTypeNode(object.group,object.objectTypeScriptName); 
        }
    };

    if (!cwApi.customLibs) {
        cwApi.customLibs = {};
    }
    if (!cwApi.customLibs.cwLayoutNetwork) {
        cwApi.customLibs.cwLayoutNetwork = {};
    };
    if (!cwApi.customLibs.cwLayoutNetwork.network) {
        cwApi.customLibs.cwLayoutNetwork.network = network;
    }

}(cwAPI, jQuery));