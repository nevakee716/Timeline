| **Name** | **Layout Timeline** | **Version** | 
| --- | --- | --- |
| **Updated by** | Mathias PFAUWADEL | 1.3 |


## Patch Notes

* 1.3 : Allow you to group children objects by step
* 1.1 : Work on tab, objectPage
* 1.0 : 1st version working

## To be Done

* SearchText Box
* More Options
* Filter
* Export
* Editable


## Description 
Allow you to display DateProperty of your objects (and their associated objects) in a Timeline. The Layout support one level of association, and the customDisplay string

## Screen Shot
<img src="https://raw.githubusercontent.com/nevakee716/Timeline/master/screen/1.jpg" alt="Drawing" style="width: 95%;"/>
Style are fully customisable by CSS, you can expend/collapse the list of associated objects. You can zoom with mouse wheel and the scale time will adapt.

## Node setup

<img src="https://raw.githubusercontent.com/nevakee716/Timeline/master/screen/2.jpg" alt="Drawing" style="width: 95%;"/>

## Options


### Hidden Nodes : 

Set the ID of the nodes you don't want to appear, the children will be display instead. 

### Merged Nodes :

Set the ID of the nodes where you want your children to be merged by Step (see Exemple)

## Steps

Describe your step in a json file, then mimify it on https://www.cleancss.com/json-minify/
Here is an exemple : 

```
{
    "application_roadmap_per_type": {    // node ID
        "step1": {                       //id of the step must be unique
            "name": "step1",             // name of the step
            "start": "WHENCREATED",      // property scriptname of the start date
            "end": "GOLIVEDATE",         // property scriptname of the end date,  
                                         // will be set to current if the date is not set
            "style": "color: green; background-color: orange;"    // css style of the step
        },
        "step2": {
            "name": "step2",
            "start": "GOLIVEDATE",
            "end": "ENDDATE",
            "style": "color: yellow; background-color: blue;"
        }
    },
    "application_20020_230578405": {
        "step3": {
            "name": "step3",
            "start": "WHENCREATED",
            "end": "WHENUPDATED",
            "style": "color: red; background-color: pink;"
        }
    }
}

```

## Exemple 

<img src="https://raw.githubusercontent.com/nevakee716/Timeline/master/screen/3.jpg" alt="Drawing" style="width: 95%;"/>






